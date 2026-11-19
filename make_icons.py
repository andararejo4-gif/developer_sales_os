from PIL import Image, ImageDraw, ImageFont
import os
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
def make(size, name):
    img = Image.new("RGB", (size, size), "#B45309")
    d = ImageDraw.Draw(img)
    try:
        f = ImageFont.truetype("arialbd.ttf", int(size * 0.6))
    except Exception:
        f = ImageFont.load_default()
    d.text((size / 2, size / 2), "A", font=f, fill="white", anchor="mm")
    img.save(os.path.join(out, name))
make(192, "pwa-192.png"); make(512, "pwa-512.png"); make(180, "apple-touch-icon.png")
