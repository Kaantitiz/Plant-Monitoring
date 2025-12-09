# ESP32 Bitki Yaşamı Kurulum Rehberi

## 🔧 Gerekli Malzemeler

### ESP32 Modülü
- **ESP32 DevKit V1** veya **NodeMCU-32S**
- WiFi ve Bluetooth desteği
- 30+ GPIO pin

### Sensörler
- **DHT22** - Sıcaklık ve nem sensörü
- **Soil Moisture Sensor** - Toprak nem sensörü
- **BH1750** - Işık sensörü (I2C)
- **pH Sensor** - Toprak asitlik seviyesi
- **Relay Modülü** - Sulama pompası kontrolü
- **LED Strip** - Işık kontrolü

### Diğer Malzemeler
- **Su pompası** (5V DC)
- **Breadboard** ve jumper kablolar
- **Güç kaynağı** (5V 2A)
- **Kablo** ve bağlantı elemanları

## 📡 Bağlantı Şeması

### ESP32 Pin Bağlantıları
```
DHT22:
- VCC → 3.3V
- GND → GND
- Data → GPIO 4

Soil Moisture:
- VCC → 3.3V
- GND → GND
- A0 → GPIO 36 (ADC1_CH0)

BH1750 (I2C):
- VCC → 3.3V
- GND → GND
- SDA → GPIO 21
- SCL → GPIO 22

pH Sensor:
- VCC → 3.3V
- GND → GND
- A1 → GPIO 39 (ADC1_CH3)

Relay (Su Pompası):
- VCC → 5V
- GND → GND
- IN → GPIO 2

LED Strip:
- VCC → 5V
- GND → GND
- Data → GPIO 5
```

## 💻 Yazılım Kurulumu

### 1. Arduino IDE Kurulumu
1. [Arduino IDE](https://www.arduino.cc/en/software) indirin
2. ESP32 board paketini ekleyin:
   - File → Preferences
   - Additional Board Manager URLs: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager
   - "ESP32" arayın ve yükleyin

### 2. Gerekli Kütüphaneler
```cpp
// Arduino IDE → Tools → Manage Libraries
- DHT sensor library
- BH1750
- ArduinoJson
- WebSockets
```

### 3. ESP32 Kodunu Yükleme
1. `esp32-plant-monitor.ino` dosyasını açın
2. WiFi bilgilerini güncelleyin:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. ESP32'yi bilgisayara bağlayın
4. Board: "ESP32 Dev Module" seçin
5. Upload butonuna basın

## 🌐 Web Uygulaması Ayarları

### 1. ESP32 IP Adresini Bulma
ESP32 yüklendikten sonra Serial Monitor'da IP adresini göreceksiniz:
```
WiFi bağlandı!
IP adresi: 192.168.1.100
```

### 2. Web Uygulamasında IP Güncelleme
`script.js` dosyasında IP adresini güncelleyin:
```javascript
const ESP32_IP = "192.168.1.100"; // ESP32'nin gerçek IP'si
```

### 3. WebSocket Bağlantısı
- ESP32: Port 81'de WebSocket server
- Web App: `ws://192.168.1.100:81` bağlantısı

## 🔄 Veri Akışı

### ESP32 → Web App
```json
{
  "temperature": 24.5,
  "humidity": 65.2,
  "soilMoisture": 75,
  "lightLevel": 850,
  "phLevel": 6.8,
  "waterPumpOn": false,
  "ledOn": true,
  "status": "Sağlıklı",
  "timestamp": 1234567890
}
```

### Web App → ESP32
```json
{
  "command": "water",
  "start": true
}
```

## 🛠️ Sorun Giderme

### Bağlantı Sorunları
1. **WiFi bağlantısı yok**: SSID ve şifre kontrolü
2. **WebSocket bağlantısı yok**: IP adresi ve port kontrolü
3. **Sensör verisi yok**: Pin bağlantıları kontrolü

### Sensör Kalibrasyonu
```cpp
// Soil moisture kalibrasyonu
int soilRaw = analogRead(SOIL_MOISTURE_PIN);
int soilMoisture = map(soilRaw, 0, 4095, 100, 0);

// pH kalibrasyonu
int phRaw = analogRead(PH_PIN);
float phLevel = map(phRaw, 0, 4095, 0, 14) / 10.0;
```

### Güç Yönetimi
- ESP32: 3.3V/5V güç kaynağı
- Sensörler: 3.3V
- Pompa: 5V (relay üzerinden)
- LED: 5V

## 📱 Mobil Erişim

### Aynı WiFi Ağında
- Web uygulamasına mobil cihazdan erişim
- ESP32 IP adresini mobil cihazda kullanın
- PWA olarak ana ekrana ekleyin

### Uzaktan Erişim
- Port forwarding (router ayarları)
- Dynamic DNS servisi
- VPN bağlantısı

## 🔒 Güvenlik

### WiFi Güvenliği
- WPA2/WPA3 şifreleme
- Güçlü şifre kullanın
- MAC adresi filtreleme

### Web Güvenliği
- HTTPS kullanımı (opsiyonel)
- Authentication sistemi
- Rate limiting

## 📊 Veri Kaydetme

### SD Kart Modülü
```cpp
#include <SD.h>
#include <SPI.h>

// Veri kaydetme
void saveDataToSD() {
  File dataFile = SD.open("plant_data.txt", FILE_WRITE);
  if (dataFile) {
    dataFile.println(JSON.stringify(plantData));
    dataFile.close();
  }
}
```

### Cloud Veritabanı
- Firebase Realtime Database
- InfluxDB (time series)
- MySQL/PostgreSQL

## 🚀 Gelişmiş Özellikler

### OTA Güncelleme
```cpp
#include <ArduinoOTA.h>

void setupOTA() {
  ArduinoOTA.setHostname("plant-monitor");
  ArduinoOTA.begin();
}
```

### MQTT Broker
```cpp
#include <PubSubClient.h>

// MQTT ile veri gönderimi
void publishData() {
  client.publish("plant/temperature", String(plantData.temperature).c_str());
  client.publish("plant/humidity", String(plantData.humidity).c_str());
}
```

### Mobil Uygulama
- React Native
- Flutter
- Ionic

## 📈 Performans Optimizasyonu

### Güç Tasarrufu
```cpp
// Deep sleep modu
esp_deep_sleep_start();

// CPU frekansı ayarı
setCpuFrequencyMhz(80);
```

### Veri Sıkıştırma
```cpp
// JSON veri sıkıştırma
DynamicJsonDocument doc(512);
// Sadece değişen verileri gönder
```

## 🎯 Sonraki Adımlar

1. **Temel kurulumu tamamlayın**
2. **Sensörleri test edin**
3. **Web uygulamasını bağlayın**
4. **Veri kaydetme ekleyin**
5. **Mobil erişim sağlayın**
6. **Gelişmiş özellikler ekleyin**

---

**Not**: Bu rehber temel kurulum için hazırlanmıştır. Gelişmiş özellikler için ek dokümantasyon gerekebilir.

