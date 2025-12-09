# Local Server Kurulum Talimatları

## 🚀 CORS Hatasını Çözmek İçin

### Yöntem 1: Python HTTP Server (Önerilen)
```bash
# Proje klasörüne gidin
cd C:\Users\KT\Desktop\Salih

# Python 3 ile server başlatın
python -m http.server 8000

# Tarayıcıda açın
http://localhost:8000
```

### Yöntem 2: Node.js HTTP Server
```bash
# Node.js yüklüyse
npx http-server -p 8000

# Tarayıcıda açın
http://localhost:8000
```

### Yöntem 3: VS Code Live Server
1. VS Code'da projeyi açın
2. `index.html` dosyasına sağ tıklayın
3. "Open with Live Server" seçin

### Yöntem 4: XAMPP/WAMP
1. XAMPP/WAMP kurun
2. Proje dosyalarını `htdocs` klasörüne kopyalayın
3. `http://localhost/Salih` adresinden erişin

## ✅ Avantajlar

- ✅ CORS hatası çözülür
- ✅ PWA özellikleri çalışır
- ✅ Service Worker aktif olur
- ✅ Manifest.json yüklenir
- ✅ Offline çalışma sağlanır

## 🔧 Sorun Giderme

**Hata**: `python: command not found`
**Çözüm**: Python 3'ü indirin ve PATH'e ekleyin

**Hata**: Port 8000 kullanımda
**Çözüm**: Farklı port kullanın: `python -m http.server 8080`

**Hata**: PWA özellikleri çalışmıyor
**Çözüm**: HTTPS kullanın veya localhost'ta test edin

