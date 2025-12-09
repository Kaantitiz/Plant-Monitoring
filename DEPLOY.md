# 🚀 Hızlı Deployment Rehberi

## Netlify ile Deploy (2 Dakika)

### Adım 1: GitHub'a Yükle
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADI/bitki-yasami.git
git push -u origin main
```

### Adım 2: Netlify'e Bağla
1. https://app.netlify.com → Sign up
2. "Add new site" → "Import an existing project"
3. GitHub repository'nizi seçin
4. Build settings:
   - Build command: (boş)
   - Publish directory: `/`
5. "Deploy site"

✅ **Tamamlandı!** `https://bitki-yasami.netlify.app` adresiniz hazır!

---

## Vercel ile Deploy (2 Dakika)

### Adım 1: GitHub'a Yükle
(Yukarıdaki adımları takip edin)

### Adım 2: Vercel'e Bağla
1. https://vercel.com → Sign up (GitHub ile)
2. "Add New Project"
3. Repository seçin
4. Framework: "Other"
5. "Deploy"

✅ **Tamamlandı!** `https://bitki-yasami.vercel.app` adresiniz hazır!

---

## GitHub Pages ile Deploy (3 Dakika)

### Adım 1: Repository Oluştur
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADI/bitki-yasami.git
git push -u origin main
```

### Adım 2: GitHub Pages Aktifleştir
1. Repository → Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: `main` / `/ (root)`
4. Save

✅ **Tamamlandı!** `https://KULLANICI_ADI.github.io/bitki-yasami` adresiniz hazır!

---

## ESP32 Bağlantısı İçin

### Yöntem 1: DuckDNS (Ücretsiz)
1. https://www.duckdns.org → Sign up
2. Domain oluşturun: `bitki-yasami.duckdns.org`
3. Router'da port forwarding yapın (Port 81)
4. Web uygulamasında IP'yi güncelleyin

### Yöntem 2: Cloud Bridge (Daha Güvenli)
- Heroku/Railway/Render'da WebSocket bridge server kurun
- ESP32 ve web uygulaması bridge üzerinden iletişim kurar

Detaylar için `CANLIYA-ALMA-REHBERI.md` dosyasına bakın.

---

## Sonraki Adımlar

1. ✅ Custom domain ekleyin (opsiyonel)
2. ✅ ESP32 bağlantısını yapılandırın
3. ✅ Güvenlik ayarlarını kontrol edin
4. ✅ Test edin!

