# Andara Sales OS (PWA)

React + Vite + TypeScript + Tailwind v4 + vite-plugin-pwa.

## Pengembangan (laptop)

```
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + build ke dist/
npm run preview    # uji PWA dari hasil build
```

## Deploy ke server

Hasil build adalah file statis di `dist/`. Di server (Ubuntu + nginx):

```
git pull
npm ci
npm run build
sudo rsync -a --delete dist/ /var/www/developer_sales_os/
```

Contoh nginx (wajib HTTPS agar PWA bisa di-install):

```
server {
  server_name sales.example.com;
  root /var/www/developer_sales_os;
  index index.html;
  location / { try_files $uri /index.html; }
  # service worker & manifest jangan di-cache lama
  location = /sw.js { add_header Cache-Control "no-cache"; }
  location = /manifest.webmanifest { add_header Cache-Control "no-cache"; }
  location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
}
```
