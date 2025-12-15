# Bitki Yaşamı - Plant Monitoring Web App

Modern ve responsive bir bitki bakım takip uygulaması. Çip tabanlı sensörlerle sulama, nem ve sıcaklık kontrolü sağlar.

## 🌱 Özellikler

### Ana Dashboard
- **Canlı Bitki Animasyonu**: CSS ile oluşturulmuş interaktif bitki animasyonu
- **Gerçek Zamanlı Veri**: Toprak nemi ve sıcaklık göstergeleri
- **Mobil Uyumlu**: Görseldeki tasarıma uygun mobil görünüm

### Kontrol Panelleri
- **Sulama Kontrolü**: Manuel ve otomatik sulama seçenekleri
- **Nem Kontrolü**: Ortam nem seviyesi ayarlama
- **Sıcaklık Kontrolü**: Sıcaklık seviyesi yönetimi
- **Işık Kontrolü**: Işık seviyesi ayarlama

### Teknik Özellikler
- **Responsive Tasarım**: Tüm cihazlarda mükemmel görünüm
- **PWA Desteği**: Offline çalışma ve uygulama kurulumu
- **Modern UI/UX**: Temiz ve kullanıcı dostu arayüz
- **Gerçek Zamanlı Simülasyon**: Sensör verilerinin canlı simülasyonu

## 🚀 Kurulum

### Lokal Geliştirme

1. Dosyaları indirin
2. HTTP sunucu başlatın:
   ```bash
   # Windows
   start-server.bat
   
   # Veya Python ile
   python -m http.server 8000
   ```
3. Tarayıcıda açın: `http://localhost:8000`
4. Login: Şifre `123456`

### ESP32 Bağlantısı

1. ESP32'yi flash edin (`AkilliSaksi` klasöründeki kod)
2. Wi‑Fi bilgilerini güncelleyin (SSID: `iPhone`, Şifre: `Aloha*123`)
3. Seri monitörden IP adresini öğrenin
4. Web uygulamasında **Ayarlar** → ESP32 IP adresini girin

### Deploy (Netlify/Vercel)

Detaylı rehber için: [GIT-DEPLOY-REHBERI.md](GIT-DEPLOY-REHBERI.md)

**Hızlı başlangıç:**
```bash
# Git'e yükle
git-deploy.bat

# Sonra GitHub'a push edin ve Netlify/Vercel'e bağlayın
```

## 📱 Mobil Görünüm

Uygulama, görseldeki tasarıma uygun olarak:
- Yeşil üst bar ile "Plant" başlığı
- Merkezi bitki animasyonu
- "Molur" (toprak nemi) ve "Tewnrs" (sıcaklık) veri gösterimi
- Alt navigasyon menüsü

## 🛠️ Teknolojiler

- **HTML5**: Semantik yapı
- **CSS3**: Modern styling ve animasyonlar
- **JavaScript**: Interaktif özellikler
- **PWA**: Progressive Web App özellikleri
- **Font Awesome**: İkonlar
- **Google Fonts**: Inter font ailesi

## 📊 Veri Simülasyonu

Uygulama gerçek sensör verilerini simüle eder:
- Toprak nemi: 0-100% arası
- Sıcaklık: 15-35°C arası
- Nem: 40-80% arası
- Işık seviyesi: 0-100% arası

## 🔧 Ayarlar

- Otomatik sulama açma/kapama
- Bildirim ayarları
- Veri güncelleme sıklığı (5-60 saniye)

## 📱 PWA Özellikleri

- Offline çalışma
- Ana ekrana ekleme
- Tam ekran modu
- Hızlı yükleme

## 🎨 Tasarım

- **Renk Paleti**: Yeşil (#4CAF50) ve beyaz tonları
- **Tipografi**: Inter font ailesi
- **Animasyonlar**: CSS keyframes ile yumuşak geçişler
- **Responsive**: Mobile-first yaklaşım

## 🔌 ESP32 Entegrasyonu

### Özellikler

- ✅ **Gerçek Zamanlı Sensör Verileri**: Sıcaklık, nem, toprak nemi
- ✅ **Pompa Kontrolü**: Manuel aç/kapat/otomatik mod
- ✅ **LED Kontrolü**: Neopixel LED (32 adet) kontrolü
- ✅ **Servo Motor**: 0-180° açı kontrolü
- ✅ **Nem Eşiği Ayarlama**: 0-100% arası eşik değeri
- ✅ **REST API**: HTTP endpoint'ler ile kontrol

### Endpoint'ler

- `GET /status` - Tüm sensör verilerini al
- `POST /pump?state=on/off/auto` - Pompa kontrolü
- `POST /threshold?value=0-100` - Nem eşiği ayarla
- `POST /led?mode=auto/on/off` - LED kontrolü
- `POST /servo?angle=0-180` - Servo açı kontrolü

### ESP32 Kodu

ESP32 kodu `AkilliSaksi/` klasöründe bulunur. PlatformIO ile derlenebilir.

## 🌐 Deploy

### Netlify

- ✅ Otomatik HTTPS → HTTP proxy (ESP32 için)
- ✅ Netlify Functions ile ESP32 bağlantısı
- ✅ Environment variables ile IP yönetimi

### Vercel

- ✅ Benzer yapı ile deploy edilebilir
- ✅ Vercel Functions kullanılabilir

Detaylar: [GIT-DEPLOY-REHBERI.md](GIT-DEPLOY-REHBERI.md)

## 📚 Dokümantasyon

### Hızlı Başlangıç
- [⚡ Netlify'dan ESP32 Kontrol - Hızlı Başlangıç](HIZLI-BASLANGIC-NETLIFY.md) - 5 dakikada kurulum

### Detaylı Rehberler
- [🌐 Netlify'dan ESP32 Kontrol Rehberi](NETLIFY-ESP32-KONTROL-REHBERI.md) - Detaylı kurulum ve kullanım
- [🔧 ESP32 Bağlantı Sorun Giderme](ESP32-BAGLANTI-SORUN-GIDERME.md) - Sorun giderme
- [🚀 Git Deploy Rehberi](GIT-DEPLOY-REHBERI.md) - Git'e yükleme
- [🔗 Netlify Proxy Kurulum](NETLIFY-PROXY-KURULUM.md) - Proxy yapılandırması
- [📡 Canlı Sistemde ESP32 Bağlantısı](CANLI-SISTEM-ESP32-BAGLANTI.md) - Canlı sistem ayarları

---

**Not**: Bu uygulama ESP32 ile gerçek zamanlı bitki izleme ve kontrol sistemi sağlar.

