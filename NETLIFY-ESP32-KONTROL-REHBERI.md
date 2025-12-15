# Netlify'dan ESP32 Kontrol Rehberi

Bu rehber, Netlify'da canlıya alınmış web uygulamanızla ESP32'yi nasıl kontrol edeceğinizi detaylı olarak açıklar.

## 📋 Ön Gereksinimler

✅ ESP32 V2 kodu flash edilmiş ve çalışıyor  
✅ ESP32 Wi‑Fi'ye bağlı (IP: 172.20.10.7)  
✅ Netlify'da site deploy edilmiş  
✅ Netlify Functions çalışıyor  

## 🚀 Adım Adım Kurulum

### 1. ESP32'yi Hazırlayın

**ESP32 V2 kodunu flash edin:**
```cpp
// AkilliSaksiV2/src/main.cpp
const char* WIFI_SSID = "iPhone";
const char* WIFI_PASSWORD = "Aloha*123";
WebServer server(8080);  // Port 8080
```

**Seri monitörden IP'yi öğrenin:**
```
WiFi baglandi IP: 172.20.10.7
HTTP server hazir
```

### 2. Netlify Environment Variables Ayarlayın

1. **Netlify Dashboard**'a giriş yapın: https://app.netlify.com
2. Site'nizi seçin
3. **Site settings** → **Environment variables** → **Add variable**

**Şu değişkenleri ekleyin:**

| Key | Value | Açıklama |
|-----|-------|----------|
| `ESP32_IP` | `172.20.10.7` | ESP32'nin IP adresi |
| `ESP32_PORT` | `8080` | ESP32 HTTP portu |

4. **Save** butonuna tıklayın

### 3. Netlify Functions Kontrolü

**Functions'ın çalıştığını kontrol edin:**

1. Netlify Dashboard → **Functions** sekmesi
2. `esp32-proxy` fonksiyonunu görmelisiniz
3. **Logs** sekmesinden çalışıp çalışmadığını kontrol edin

**Eğer function yoksa:**
- `netlify/functions/esp32-proxy.js` dosyasının Git'te olduğundan emin olun
- Site'yi yeniden deploy edin

### 4. Site'yi Deploy Edin

**Otomatik deploy:**
- Git push yaptığınızda otomatik deploy olur

**Manuel deploy:**
1. **Deploys** sekmesi → **Trigger deploy** → **Clear cache and deploy site**
2. Deploy tamamlanmasını bekleyin (1-2 dakika)

### 5. Web Uygulamasında Test Edin

1. **Canlı siteyi açın:** `https://your-site.netlify.app`
2. **Login yapın:** Şifre `123456`
3. **Ayarlar** sayfasına gidin
4. **ESP32 IP Adresi** kontrol edin: `172.20.10.7`
5. **"Bağlantıyı Test Et"** butonuna tıklayın

**Başarılı olursa:**
- ✅ Yeşil "ESP32 Bağlı" mesajı görünür
- ✅ Dashboard'da gerçek zamanlı veriler görünür

## 🔧 Nasıl Çalışır?

### İstek Akışı

```
Web App (HTTPS)
  ↓
  GET /api/esp32/status
  ↓
Netlify Function (esp32-proxy.js)
  ↓
  Environment Variables: ESP32_IP, ESP32_PORT
  ↓
  HTTP Request: http://172.20.10.7:8080/status
  ↓
ESP32 (HTTP)
  ↓
  JSON Response
  ↓
Netlify Function
  ↓
  HTTPS Response (CORS headers ile)
  ↓
Web App
```

### Endpoint'ler

Web uygulaması şu endpoint'leri kullanır:

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/esp32/status` | GET | Tüm sensör verilerini al |
| `/api/esp32/pump?state=on` | POST | Pompayı aç |
| `/api/esp32/pump?state=off` | POST | Pompayı kapat |
| `/api/esp32/pump?state=auto` | POST | Otomatik moda geç |
| `/api/esp32/threshold?value=30` | POST | Nem eşiği ayarla |
| `/api/esp32/led?mode=on&r=0&g=100&b=0` | POST | LED aç (yeşil) |
| `/api/esp32/led?mode=off` | POST | LED kapat |
| `/api/esp32/led?mode=auto` | POST | Otomatik moda geç |
| `/api/esp32/servo?angle=90` | POST | Servo açısı ayarla |

## 🎮 Web Uygulamasından Kontrol

### Dashboard

- **Gerçek Zamanlı Veriler:** Sıcaklık, nem, toprak nemi otomatik güncellenir
- **Stat Kartları:** Dinamik olarak güncellenir
- **Bağlantı Durumu:** ESP32 bağlantı durumu gösterilir

### Kontrol Panelleri

1. **Sulama Kontrolü:**
   - "Şimdi Sula" → Pompayı açar
   - "Otomatik Sulama" → Otomatik moda geçer
   - Nem eşiği ayarlanabilir

2. **LED Kontrolü:**
   - "LED Aç (Yeşil)" → LED'i yeşil yapar
   - "LED Kapat" → LED'i kapatır
   - "Otomatik Mod" → Pompa durumuna göre kırmızı/yeşil

3. **Servo Kontrolü:**
   - 0°, 90°, 180° butonları
   - Slider ile 0-180° arası ayar

## 🐛 Sorun Giderme

### Problem: ESP32'ye Bağlanılamıyor

**Kontrol listesi:**
1. ✅ ESP32 çalışıyor mu? (Seri monitörden kontrol)
2. ✅ ESP32 IP adresi doğru mu? (172.20.10.7)
3. ✅ ESP32 port doğru mu? (8080)
4. ✅ Netlify Environment variables doğru mu?
5. ✅ ESP32 ve router aynı ağda mı?

**Netlify Functions loglarını kontrol:**
1. Netlify Dashboard → **Functions** → **esp32-proxy** → **Logs**
2. Hata mesajlarını kontrol edin
3. ESP32'ye istek gidiyor mu kontrol edin

**Manuel test:**
```bash
# ESP32'ye direkt erişim (aynı ağda)
curl http://172.20.10.7:8080/status
```

### Problem: CORS Hatası

**Neden:**
- ESP32'de CORS header'ları eksik

**Çözüm:**
ESP32 V2 kodunda CORS header'ları zaten var. Eğer hata alıyorsanız:
1. ESP32 kodunu yeniden flash edin
2. Netlify proxy kullanın (otomatik CORS)

### Problem: Timeout Hatası

**Neden:**
- ESP32 aynı ağda değil
- Firewall/router engelliyor
- ESP32 çalışmıyor

**Çözüm:**
1. ESP32'yi seri monitörden kontrol edin
2. IP adresini doğrulayın
3. Router ayarlarını kontrol edin
4. Port forwarding gerekebilir (internet üzerinden erişim için)

### Problem: Functions Çalışmıyor

**Kontrol:**
1. `netlify/functions/esp32-proxy.js` dosyası Git'te mi?
2. `netlify.toml` dosyası doğru mu?
3. Site yeniden deploy edildi mi?

**Çözüm:**
1. Git'te dosyaları kontrol edin
2. Site'yi yeniden deploy edin
3. Functions sekmesinden logları kontrol edin

## 📱 Mobil Cihazlardan Erişim

**Netlify üzerinden:**
- ✅ Tüm cihazlardan erişilebilir (internet bağlantısı ile)
- ✅ HTTPS güvenli bağlantı
- ✅ PWA desteği (ana ekrana eklenebilir)

**ESP32'ye direkt erişim:**
- ❌ Sadece aynı Wi‑Fi ağında mümkün
- ✅ Netlify proxy üzerinden her yerden erişilebilir

## 🔒 Güvenlik

### Environment Variables

**Önemli:**
- ESP32 IP'sini public repository'ye commit etmeyin
- Sadece Netlify Environment variables'da saklayın
- Production ve preview environment'ları ayrı ayarlayabilirsiniz

### Authentication (İleri Seviye)

**ESP32 tarafında:**
```cpp
// Token kontrolü ekleyebilirsiniz
if (server.hasArg("token") && server.arg("token") == "SECRET_TOKEN") {
    // İşlem yap
}
```

**Netlify Function'da:**
```javascript
// API key kontrolü ekleyebilirsiniz
const API_KEY = process.env.API_KEY;
if (event.headers['x-api-key'] !== API_KEY) {
    return { statusCode: 401, body: 'Unauthorized' };
}
```

## 📊 Monitoring

### Netlify Functions Logs

1. Netlify Dashboard → **Functions** → **esp32-proxy** → **Logs**
2. Her isteği görebilirsiniz
3. Hata mesajlarını takip edebilirsiniz

### Web Uygulaması Logs

Tarayıcı konsolunda (F12):
- Bağlantı durumu
- Hata mesajları
- API yanıtları

## 🎯 Hızlı Test Komutları

### Tarayıcı Konsolunda

```javascript
// ESP32 bağlantı testi
fetch('/api/esp32/status')
  .then(r => r.json())
  .then(data => console.log('✅ ESP32 OK:', data))
  .catch(err => console.error('❌ ESP32 HATA:', err));

// Pompa kontrolü
fetch('/api/esp32/pump?state=on', { method: 'POST' })
  .then(r => r.text())
  .then(data => console.log('Pompa:', data));

// LED kontrolü
fetch('/api/esp32/led?mode=on&r=0&g=100&b=0', { method: 'POST' })
  .then(r => r.text())
  .then(data => console.log('LED:', data));

// Servo kontrolü
fetch('/api/esp32/servo?angle=90', { method: 'POST' })
  .then(r => r.text())
  .then(data => console.log('Servo:', data));
```

## ✅ Kontrol Listesi

Deploy öncesi:
- [ ] ESP32 V2 kodu flash edildi
- [ ] ESP32 IP adresi öğrenildi
- [ ] Netlify Environment variables ayarlandı
- [ ] Netlify Functions deploy edildi
- [ ] Site deploy edildi

Deploy sonrası:
- [ ] Web uygulaması açılıyor
- [ ] Login çalışıyor
- [ ] "Bağlantıyı Test Et" başarılı
- [ ] Dashboard'da veriler görünüyor
- [ ] Kontroller çalışıyor (pompa, LED, servo)

## 🎉 Başarı!

Tüm adımlar tamamlandıysa:
- ✅ Netlify'dan ESP32'yi kontrol edebilirsiniz
- ✅ Her yerden erişilebilir (internet bağlantısı ile)
- ✅ HTTPS güvenli bağlantı
- ✅ Gerçek zamanlı veri görüntüleme
- ✅ Tüm kontroller çalışıyor

## 📞 Destek

Sorun yaşarsanız:
1. Netlify Functions loglarını kontrol edin
2. ESP32 seri monitörünü kontrol edin
3. Tarayıcı konsolunu kontrol edin
4. `ESP32-BAGLANTI-SORUN-GIDERME.md` dosyasına bakın

