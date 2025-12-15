# Git Deploy Rehberi

Bu rehber, projeyi Git repository'ye yükleyip Netlify/Vercel'e deploy etmek için adımları içerir.

## 📋 Ön Hazırlık

### 1. Git Repository Oluşturma

**GitHub'da:**
1. GitHub'a giriş yapın
2. Yeni repository oluşturun (örn: `akilli-saksi`)
3. Repository'yi public veya private olarak ayarlayın

**Alternatif (GitLab/Bitbucket):**
- Benzer şekilde yeni repository oluşturun

## 🚀 Git'e Yükleme

### Adım 1: Git İlk Kurulum (İlk kez kullanıyorsanız)

```bash
git config --global user.name "Adınız"
git config --global user.email "email@example.com"
```

### Adım 2: Repository'yi Başlat

```bash
# Proje klasörüne gidin
cd "C:\Users\KT\Desktop\Özel\Projeler\Salih"

# Git repository başlat
git init

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "İlk commit: Akıllı Saksı Web Uygulaması"
```

### Adım 3: Remote Repository Bağla

```bash
# GitHub repository URL'inizi kullanın
git remote add origin https://github.com/KULLANICI_ADI/akilli-saksi.git

# Veya SSH kullanıyorsanız
git remote add origin git@github.com:KULLANICI_ADI/akilli-saksi.git
```

### Adım 4: Push Et

```bash
# Ana branch'i main olarak ayarla
git branch -M main

# Push et
git push -u origin main
```

## 🌐 Netlify Deploy

### Otomatik Deploy (Önerilen)

1. **Netlify'a giriş yapın:** https://app.netlify.com
2. **"Add new site" → "Import an existing project"**
3. **GitHub'ı seçin** ve repository'nizi seçin
4. **Build settings:**
   - Build command: (boş bırakın - statik site)
   - Publish directory: `.` (root)
5. **Environment variables ekleyin:**
   - `ESP32_IP` = `172.20.10.7`
   - `ESP32_PORT` = `80`
6. **Deploy site** butonuna tıklayın

### Manuel Deploy

```bash
# Netlify CLI ile
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

## ⚡ Vercel Deploy

### Otomatik Deploy

1. **Vercel'e giriş yapın:** https://vercel.com
2. **"Add New Project"**
3. **GitHub repository'nizi seçin**
4. **Framework Preset:** Other
5. **Root Directory:** `.`
6. **Environment Variables:**
   - `ESP32_IP` = `172.20.10.7`
   - `ESP32_PORT` = `80`
7. **Deploy** butonuna tıklayın

### Manuel Deploy

```bash
# Vercel CLI ile
npm install -g vercel
vercel login
vercel --prod
```

## 🔧 Deploy Sonrası Ayarlar

### Netlify Functions (ESP32 Proxy)

Netlify'da deploy ettikten sonra:

1. **Site settings → Environment variables**
2. Şu değişkenleri ekleyin:
   ```
   ESP32_IP = 172.20.10.7
   ESP32_PORT = 80
   ```

3. **Functions otomatik deploy olur:**
   - `netlify/functions/esp32-proxy.js` dosyası otomatik algılanır
   - `/api/esp32/*` endpoint'leri çalışır

### Custom Domain (Opsiyonel)

1. **Netlify/Vercel dashboard → Domain settings**
2. Custom domain ekleyin
3. DNS ayarlarını yapın

## 📝 Önemli Notlar

### Dosyalar Git'e Eklendi mi?

**Eklendi:**
- ✅ Tüm web dosyaları (HTML, CSS, JS)
- ✅ Netlify Functions
- ✅ Konfigürasyon dosyaları (netlify.toml, vercel.json)
- ✅ ESP32 kodu (AkilliSaksi klasörü)

**Eklenmedi (.gitignore):**
- ❌ node_modules/
- ❌ .env dosyaları
- ❌ Build çıktıları
- ❌ IDE ayarları

### ESP32 IP Adresi

**Deploy sonrası:**
- Web uygulamasındaki **Ayarlar** sayfasından IP'yi güncelleyebilirsiniz
- Veya Netlify/Vercel environment variables'dan değiştirebilirsiniz

### HTTPS → HTTP Proxy

**Netlify:**
- Otomatik çalışır (`netlify/functions/esp32-proxy.js`)
- `/api/esp32/*` endpoint'leri ESP32'ye yönlendirilir

**Vercel:**
- Vercel Functions kullanılabilir (benzer yapı)

## 🐛 Sorun Giderme

### Deploy Başarısız Olursa

1. **Build loglarını kontrol edin**
2. **Environment variables doğru mu?**
3. **Git push başarılı mı?**

### ESP32 Bağlantısı Çalışmıyorsa

1. **Netlify Functions loglarını kontrol edin**
2. **Environment variables'ı kontrol edin**
3. **ESP32'nin aynı ağda olduğundan emin olun**

## 📚 Ek Kaynaklar

- [Netlify Docs](https://docs.netlify.com/)
- [Vercel Docs](https://vercel.com/docs)
- [Git Basics](https://git-scm.com/book)

