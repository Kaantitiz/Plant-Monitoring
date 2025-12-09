# 🚀 Proje Başlatma Rehberi

## 📋 Proje Özeti

Bu proje **ESP32 Bitki İzleme Sistemi**dir. İki ana bileşenden oluşur:

1. **Web Uygulaması** (Frontend)
   - HTML, CSS, JavaScript
   - PWA (Progressive Web App) desteği
   - Responsive tasarım

2. **ESP32 Firmware** (Backend)
   - Arduino/C++ kodu
   - WebSocket ile gerçek zamanlı veri gönderimi
   - Sensör okuma ve kontrol

## 🎯 Kullanılan Diller ve Teknolojiler

### Web Tarafı:
- **HTML5** - Web arayüzü yapısı
- **CSS3** - Stil ve animasyonlar
- **JavaScript (ES6+)** - İş mantığı ve WebSocket bağlantısı
- **PWA** - Offline çalışma desteği

### ESP32 Tarafı:
- **Arduino/C++** - Mikrodenetleyici programlama
- **WebSocket** - Gerçek zamanlı iletişim
- **JSON** - Veri formatı

## 🚀 Hızlı Başlatma

### Yöntem 1: Batch Dosyası ile (En Kolay)

1. `start-server.bat` dosyasına çift tıklayın
2. Tarayıcıda `http://localhost:8000` adresini açın

### Yöntem 2: Python ile Manuel Başlatma

1. PowerShell veya CMD'yi açın
2. Proje klasörüne gidin:
   ```powershell
   cd "C:\Users\KT\Desktop\Özel\Projeler\Salih"
   ```
3. Python HTTP Server'ı başlatın:
   ```powershell
   python -m http.server 8000
   ```
4. Tarayıcıda açın: `http://localhost:8000`

### Yöntem 3: VS Code Live Server

1. VS Code'da projeyi açın
2. `index.html` dosyasına sağ tıklayın
3. "Open with Live Server" seçin

### Yöntem 4: Node.js ile

```powershell
npx http-server -p 8000
```

## 📱 Web Uygulaması Özellikleri

- ✅ **Dashboard** - Bitki durumu görüntüleme
- ✅ **Gerçek Zamanlı Veri** - WebSocket ile canlı veri
- ✅ **Sulama Kontrolü** - Manuel ve otomatik sulama
- ✅ **Mobil Uyumlu** - Responsive tasarım
- ✅ **PWA Desteği** - Ana ekrana ekleme
- ✅ **Offline Çalışma** - Service Worker ile

## 🔌 ESP32 Kurulumu

### Gereksinimler:
1. Arduino IDE
2. ESP32 Board paketi
3. Gerekli kütüphaneler:
   - DHT sensor library
   - BH1750
   - ArduinoJson
   - WebSockets

### Kurulum Adımları:

1. **Arduino IDE'yi açın**
2. **ESP32 board paketini ekleyin:**
   - File → Preferences
   - Additional Board Manager URLs: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager → "ESP32" yükleyin

3. **Kütüphaneleri yükleyin:**
   - Tools → Manage Libraries
   - Yukarıdaki kütüphaneleri arayıp yükleyin

4. **ESP32 kodunu yükleyin:**
   - `esp32-plant-monitor.ino` dosyasını açın
   - WiFi bilgilerini güncelleyin:
     ```cpp
     const char* ssid = "YOUR_WIFI_SSID";
     const char* password = "YOUR_WIFI_PASSWORD";
     ```
   - ESP32'yi bilgisayara bağlayın
   - Board: "ESP32 Dev Module" seçin
   - Upload butonuna basın

5. **IP Adresini Bulun:**
   - Serial Monitor'da ESP32'nin IP adresini göreceksiniz
   - Örnek: `192.168.1.100`

6. **Web Uygulamasında IP'yi Güncelleyin:**
   - `script.js` dosyasında:
     ```javascript
     const ESP32_IP = "192.168.1.100"; // ESP32'nin gerçek IP'si
     ```

## 🔗 Bağlantı Ayarları

### WebSocket Bağlantısı:
- **ESP32 Port:** 81
- **WebSocket URL:** `ws://192.168.1.100:81`

### Ayarlar Sayfası:
- Web uygulamasında "Ayarlar" sayfasından ESP32 IP adresini güncelleyebilirsiniz

## 📂 Dosya Yapısı

```
Salih/
├── index.html          # Ana HTML dosyası
├── styles.css          # CSS stilleri
├── script.js           # JavaScript mantığı
├── sw.js              # Service Worker (PWA)
├── manifest.json      # PWA manifest
├── esp32-plant-monitor.ino  # ESP32 firmware
├── server-setup.md    # Sunucu kurulum rehberi
├── esp32-setup-guide.md    # ESP32 kurulum rehberi
└── start-server.bat   # Hızlı başlatma scripti
```

## 🛠️ Sorun Giderme

### Web Uygulaması Açılmıyor:
- ✅ Python yüklü mü kontrol edin: `python --version`
- ✅ Port 8000 kullanımda mı? Farklı port deneyin: `python -m http.server 8080`
- ✅ Firewall ayarlarını kontrol edin

### ESP32 Bağlantısı Yok:
- ✅ WiFi SSID ve şifre doğru mu?
- ✅ ESP32 ve bilgisayar aynı WiFi ağında mı?
- ✅ IP adresi doğru mu? (script.js'de kontrol edin)
- ✅ WebSocket port 81 açık mı?

### CORS Hatası:
- ✅ HTTP server kullanıyorsanız sorun olmaz
- ✅ `file://` protokolü ile açmayın, mutlaka HTTP server kullanın

### PWA Özellikleri Çalışmıyor:
- ✅ HTTP/HTTPS sunucu gereklidir (file:// çalışmaz)
- ✅ Service Worker kayıt edilmiş mi? (Console'da kontrol edin)

## 📊 Veri Akışı

### ESP32 → Web App:
```json
{
  "temperature": 24.5,
  "humidity": 65.2,
  "soilMoisture": 75,
  "lightLevel": 850,
  "phLevel": 6.8,
  "waterPumpOn": false,
  "ledOn": true,
  "status": "Sağlıklı"
}
```

### Web App → ESP32:
```json
{
  "command": "water",
  "start": true
}
```

## 🎯 Sonraki Adımlar

1. ✅ Web uygulamasını başlatın
2. ✅ ESP32'yi kurun ve yükleyin
3. ✅ IP adresini güncelleyin
4. ✅ Bağlantıyı test edin
5. ✅ Sensörleri bağlayın ve test edin

## 📚 Daha Fazla Bilgi

- **ESP32 Kurulum:** `esp32-setup-guide.md`
- **Sunucu Kurulum:** `server-setup.md`
- **README:** `README.md`

---

**Not:** Bu proje eğitim ve demo amaçlıdır. Gerçek kullanım için ek güvenlik önlemleri alınmalıdır.

