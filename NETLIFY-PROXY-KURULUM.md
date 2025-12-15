# Netlify HTTPS → ESP32 HTTP Proxy Kurulumu

Bu dokümantasyon, Netlify'da HTTPS üzerinden ESP32'nin HTTP endpoint'lerine erişmek için proxy köprüsünün nasıl kurulacağını açıklar.

## 📋 Gereksinimler

- Netlify hesabı
- ESP32 cihazı aynı ağda (veya internet üzerinden erişilebilir)
- ESP32 IP adresi: `172.20.10.7` (veya kendi IP'niz)

## 🚀 Kurulum Adımları

### 1. Netlify'da Environment Variables Ayarlama

Netlify Dashboard → Site settings → Environment variables:

```
ESP32_IP = 172.20.10.7
ESP32_PORT = 80
```

**Not:** ESP32'niz farklı bir IP'deyse, bu değeri güncelleyin.

### 2. Dosya Yapısı

Projenizde şu dosyalar olmalı:

```
├── netlify/
│   └── functions/
│       └── esp32-proxy.js    # Proxy fonksiyonu
├── netlify.toml              # Netlify konfigürasyonu
├── package.json              # Node.js bağımlılıkları
└── ... (diğer dosyalar)
```

### 3. Deploy

Netlify'da deploy işlemi otomatik olarak:

1. `netlify/functions/` klasöründeki fonksiyonları algılar
2. `/api/esp32/*` isteklerini proxy fonksiyonuna yönlendirir
3. Proxy fonksiyonu ESP32'ye HTTP isteği gönderir

## 🔧 Nasıl Çalışır?

### İstek Akışı

```
Web App (HTTPS) 
  → /api/esp32/status
    → Netlify Function (esp32-proxy)
      → ESP32 (http://172.20.10.7:80/status)
        → Response geri döner
```

### Örnek Kullanım

Web uygulaması otomatik olarak:

- **Netlify'da (HTTPS):** `/api/esp32/status` kullanır
- **Lokal (HTTP):** `http://172.20.10.7:80/status` kullanır

## ⚙️ Konfigürasyon

### ESP32 IP Değiştirme

**Yöntem 1: Netlify Environment Variables**
- Netlify Dashboard → Environment variables → `ESP32_IP` değerini güncelle

**Yöntem 2: Web Uygulaması Ayarları**
- Web uygulamasındaki "Ayarlar" sayfasından IP adresini güncelle
- Bu değer localStorage'da saklanır

### Proxy Endpoint'leri

Proxy aşağıdaki endpoint'leri destekler:

- `GET /api/esp32/status` → ESP32 `/status`
- `POST /api/esp32/pump?state=on` → ESP32 `/pump?state=on`
- `POST /api/esp32/threshold?value=30` → ESP32 `/threshold?value=30`
- `POST /api/esp32/led?mode=on` → ESP32 `/led?mode=on`
- `POST /api/esp32/servo?angle=90` → ESP32 `/servo?angle=90`

## 🐛 Sorun Giderme

### Proxy çalışmıyor

1. **Netlify Functions loglarını kontrol edin:**
   - Netlify Dashboard → Functions → esp32-proxy → Logs

2. **ESP32 IP'sinin doğru olduğundan emin olun:**
   - Environment variable'ı kontrol edin
   - ESP32'nin aynı ağda olduğundan emin olun

3. **CORS hatası:**
   - ESP32 kodunda CORS header'ları olduğundan emin olun
   - Proxy fonksiyonu otomatik olarak CORS header'ları ekler

### ESP32'ye erişilemiyor

- ESP32'nin Wi‑Fi'ye bağlı olduğundan emin olun
- ESP32 IP adresinin doğru olduğundan emin olun
- Firewall/router ayarlarını kontrol edin

## 📝 Notlar

- Proxy sadece **aynı ağdaki** ESP32'lere erişebilir
- İnternet üzerinden erişim için ESP32'nin public IP'si veya port forwarding gerekir
- Production'da ESP32 IP'sini environment variable olarak saklayın (güvenlik)

## 🔒 Güvenlik

- ESP32 IP'sini public repository'de saklamayın
- Environment variables kullanın
- İsterseniz proxy'ye authentication ekleyebilirsiniz

