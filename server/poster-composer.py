"""Overlay pasca-Recraft. Teks poster digambar langsung oleh model gambar (AI);
skrip ini hanya menempel logo resmi dan, untuk slide denah, denah ASLI (bukan gambar AI)."""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

EMERALD = (11, 56, 42)
EMERALD_DEEP = (6, 34, 26)
GOLD = (222, 184, 108)
GOLD_LIGHT = (245, 224, 170)
IVORY = (255, 248, 232)

SERIF_BOLD = [
    "C:/Windows/Fonts/georgiab.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/Library/Fonts/Georgia Bold.ttf",
]
SANS = [
    "C:/Windows/Fonts/segoeui.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/Library/Fonts/Arial.ttf",
]
SANS_BOLD = [
    "C:/Windows/Fonts/segoeuib.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
]


def font(paths, size):
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, int(size))
    return ImageFont.load_default()


def text_w(draw, txt, fnt):
    return draw.textlength(txt, font=fnt)


def wrap(draw, txt, fnt, max_w):
    lines, cur = [], ""
    for w in txt.split():
        test = f"{cur} {w}".strip()
        if text_w(draw, test, fnt) <= max_w or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def vertical_gradient(w, h, color, a_top, a_bottom, power=1.0):
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(grad)
    for y in range(h):
        t = y / max(1, h - 1)
        a = a_top + (a_bottom - a_top) * (t ** power)
        d.line([(0, y), (w, y)], fill=(*color, int(a)))
    return grad


def pill(base, box, fill, outline, radius):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=max(2, base.size[0] // 450))
    base.alpha_composite(layer)


def clean_logo(path):
    """Logo resmi dengan noise alpha rendah dibuang (file asli punya kabut alpha 1-40 di sekeliling huruf)."""
    logo = Image.open(path).convert("RGBA")
    alpha = logo.getchannel("A").point(lambda v: 0 if v <= 40 else min(255, int((v - 40) * 255 / 160)))
    logo.putalpha(alpha)
    return logo.crop(alpha.getbbox())


def headroom(base):
    """Tinggi area atas yang bebas teks (px): baris pertama dengan tepi tajam rapat di kolom tengah."""
    W, H = base.size
    w = 448
    h = int(H * w / W)
    g = base.convert("L").resize((w, h), Image.Resampling.BOX)
    px = g.load()
    x0, x1 = int(w * 0.18), int(w * 0.82)
    run = 0
    for y in range(int(h * 0.45)):
        sharp = sum(1 for x in range(x0, x1) if abs(px[x + 1, y] - px[x, y]) > 34)
        run = run + 1 if sharp >= 6 else 0
        if run >= 3:
            return int((y - 2) * H / h)
    return int(H * 0.45)


def add_sky(base, need):
    """Tambah `need` px langit di atas (strip langit kosong diregang), lalu kembalikan ke ukuran semula."""
    W, H = base.size
    strip_h = max(16, int(headroom(base) * 0.6))
    strip = base.crop((0, 0, W, strip_h)).resize((W, strip_h + need), Image.Resampling.BICUBIC)
    tall = Image.new("RGBA", (W, H + need))
    tall.paste(strip, (0, 0))
    tall.paste(base.crop((0, strip_h, W, H)), (0, strip_h + need))
    return tall.resize((W, H), Image.Resampling.LANCZOS)


def place_logo(base, logo_path):
    """Plakat emerald berbingkai emas menggantung dari tepi atas; logo putih+emas selalu kontras."""
    if not os.path.exists(logo_path):
        raise FileNotFoundError(f"Logo wajib tidak ditemukan: {logo_path}")
    W, H = base.size
    k = 3
    logo = clean_logo(logo_path)
    pad_x, pad_y = int(W * 0.03), int(H * 0.010)
    lw = int(W * 0.235)
    pw, ph = lw + pad_x * 2, int(lw * logo.height / logo.width) + pad_y * 2
    margin = int(H * 0.014)
    room = headroom(base) - margin
    if room < ph:
        need = int((ph - room) * 1.08) + 2
        if need > H * 0.085 or headroom(base) < H * 0.015:
            raise SystemExit(f"LOGO_ZONE: ruang atas {room}px, plakat butuh {ph}px")
        base.paste(add_sky(base, need))
        room = max(ph, headroom(base) - margin)
    grow = min(1.3, room / ph)
    pw, ph = int(pw * grow), int(ph * grow)
    scale = min((pw - pad_x * 2) / logo.width, (ph - pad_y * 2) / logo.height)
    lw, lh = int(logo.width * scale), int(logo.height * scale)
    x0, r = (W - pw) // 2, int(W * 0.035)

    def plaque_mask(inset):
        m = Image.new("L", (pw * k, (ph + r) * k), 0)
        ImageDraw.Draw(m).rounded_rectangle(
            (inset * k, -r * k, (pw - inset) * k - 1, (ph - inset) * k - 1), radius=max(1, r - inset) * k, fill=255
        )
        return m.resize((pw, ph + r), Image.Resampling.LANCZOS)

    def ramp(stops):
        strip = Image.new("RGBA", (1, ph + r))
        for y in range(ph + r):
            t = y / (ph + r - 1) * (len(stops) - 1)
            i = min(int(t), len(stops) - 2)
            f = t - i
            strip.putpixel((0, y), tuple(int(stops[i][n] + (stops[i + 1][n] - stops[i][n]) * f) for n in range(3)) + (255,))
        return strip.resize((pw, ph + r))

    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    shadow.paste((3, 20, 15, 150), (x0, int(H * 0.006)), plaque_mask(0))
    base.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(W * 0.012)))

    edge = max(3, W // 220)
    hair = max(1, W // 600)
    gold = ramp([(150, 108, 48), GOLD_LIGHT, (190, 142, 70), (255, 240, 200), (164, 118, 54)])
    green = ramp([(9, 78, 59), (7, 58, 44), (4, 38, 29)])
    for layer, inset in ((gold, 0), (green, edge), (gold, edge + hair * 4), (green, edge + hair * 5)):
        piece = layer.copy()
        piece.putalpha(plaque_mask(inset))
        base.alpha_composite(piece, (x0, 0))
    base.alpha_composite(logo.resize((lw, lh), Image.Resampling.LANCZOS), (x0 + (pw - lw) // 2, (ph - lh) // 2 - pad_y // 4))


def trim_denah(path):
    im = Image.open(path).convert("RGB")
    mid = im.convert("L").point(lambda v: 255 if 30 < v < 240 else 0)
    bbox = mid.getbbox()
    if bbox:
        pad = 8
        im = im.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(im.width, bbox[2] + pad), min(im.height, bbox[3] + pad)))
    keep = 0.66 if im.height / im.width > 1.3 else 0.84
    return im.crop((0, 0, im.width, int(im.height * keep)))


def draw_denah_panel(base, cfg, s):
    W, H = base.size
    y_start = int(H * 0.40)
    base.alpha_composite(vertical_gradient(W, int(H * 0.10), EMERALD_DEEP, 0, 232, power=0.9), (0, y_start - int(H * 0.06)))
    base.alpha_composite(Image.new("RGBA", (W, H - y_start + int(H * 0.04)), (*EMERALD_DEEP, 232)), (0, y_start + int(H * 0.04)))
    paths = [cfg.get("denah_lt1"), cfg.get("denah_lt2")]
    labels = ["LANTAI 1", "LANTAI 2"]
    notes = [cfg.get("denah_lt1_text") or "", cfg.get("denah_lt2_text") or ""]
    top = y_start + int(H * 0.055)
    avail_h = H - top - 170 * s
    card_w = (W * 0.90 - 18 * s) / 2
    d = ImageDraw.Draw(base)
    lf, nf = font(SANS_BOLD, 24 * s), font(SANS, 21 * s)
    cards = []
    for p in paths:
        if p and os.path.exists(p):
            im = trim_denah(p)
            sc = min((card_w - 24 * s) / im.width, (avail_h - 130 * s) / im.height)
            cards.append(im.resize((max(1, int(im.width * sc)), max(1, int(im.height * sc))), Image.Resampling.LANCZOS))
        else:
            cards.append(None)
    note_lines = [wrap(d, n, nf, card_w - 28 * s)[:4] for n in notes]
    img_h = max((c.height for c in cards if c), default=0)
    card_h = int(img_h + 62 * s + max(len(n) for n in note_lines) * (nf.size + 4 * s) + 28 * s)
    for i in range(2):
        x0 = int(W * 0.05 + i * (card_w + 18 * s))
        pill(base, (x0, top, int(x0 + card_w), top + card_h), (*EMERALD, 238), (*GOLD, 255), int(28 * s))
        d = ImageDraw.Draw(base)
        d.text((x0 + (card_w - text_w(d, labels[i], lf)) / 2, top + 14 * s), labels[i], font=lf, fill=GOLD_LIGHT)
        if cards[i]:
            base.paste(cards[i], (int(x0 + (card_w - cards[i].width) / 2), int(top + 54 * s)))
        ny = top + 54 * s + img_h + 14 * s
        for ln in note_lines[i]:
            d.text((x0 + 14 * s, ny), ln, font=nf, fill=IVORY)
            ny += nf.size + 4 * s
    title = cfg.get("denah_title") or ""
    if title:
        tf = font(SERIF_BOLD, 34 * s)
        d.text(((W - text_w(d, title, tf)) / 2, top + card_h + 20 * s), title, font=tf, fill=GOLD_LIGHT)


def compose(cfg):
    base = Image.open(cfg["image_path"]).convert("RGBA")
    s = base.size[0] / 1080.0
    if cfg.get("layout") == "denah":
        draw_denah_panel(base, cfg, s)
    place_logo(base, cfg["logo_path"])
    base.convert("RGB").save(cfg["image_path"], format="PNG", optimize=True)


if __name__ == "__main__":
    compose(json.loads(sys.argv[1]))
