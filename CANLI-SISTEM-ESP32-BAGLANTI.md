# Canlı Sistemde ESP32 Bağlantı Rehberi

Bu rehber, Netlify/Vercel'de canlıya alınmış web uygulamanızla ESP32'yi nasıl bağlayacağınızı açıklar.

## 🌐 Canlı Sistemde ESP32 Bağlantısı

### Durum

Web uygulamanız **Netlify/Vercel'de HTTPS** üzerinden çalışıyor. ESP32 ise **HTTP** üzerinden çalışıyor. Bu durumda iki seçenek var:

### ✅ Seçenek 1: Netlify Functions Proxy (Önerilen - Zaten Hazır)

Netlify'da deploy ettiyseniz, **otomatik olarak proxy çalışır**:

1. **Netlify Dashboard** → **Site settings** → **Environment variables**
2. Şu değişkenleri ekleyin:
   ```
   ESP32_IP = 172.20.10.7
   ESP32_PORT = 8080
   ```
3. **Deploy** butonuna tıklayın (veya otomatik deploy olur)

**Nasıl çalışır:**
- Web uygulaması: `https://your-site.netlify.app`
- ESP32 istekleri: `/api/esp32/status` → Netlify Function → ESP32 HTTP
- Otomatik HTTPS → HTTP dönüşümü yapılır

### ⚠️ Seçenek 2: ESP32'yi İnternete Açmak (İleri Seviye)

ESP32'yi doğrudan internet üzerinden erişilebilir yapmak için:

1. **Router'da Port Forwarding:**
   - Port 80'i ESP32 IP'sine yönlendirin
   - Public IP'nizi öğrenin

2. **Dynamic DNS (Opsiyonel):**
   - No-IP, DuckDNS gibi servisler kullanın
   - ESP32 IP değişse bile erişilebilir olur

3. **Güvenlik:**
   - Firewall kuralları ekleyin
   - Authentication ekleyin (ESP32 koduna)

## 🔧 Adım Adım Kurulum

### 1. ESP32'yi Hazırlayın

**ESP32 kodunu flash edin:**
```cpp
// AkilliSaksi/src/main.cpp
const char* WIFI_SSID = "iPhone";
const char* WIFI_PASSWORD = "Aloha*123";
```

**Seri monitörden IP'yi öğrenin:**
```
WiFi baglandi IP: 172.20.10.7
HTTP server hazir
```

### 2. Netlify'da Environment Variables Ayarlayın

1. Netlify Dashboard'a giriş yapın
2. Site'nizi seçin
3. **Site settings** → **Environment variables**
4. **Add variable** butonuna tıklayın
5. Şu değişkenleri ekleyin:

| Key | Value |
|-----|-------|
| `ESP32_IP` | `172.20.10.7` |
| `ESP32_PORT` | `8080` |

6. **Save** butonuna tıklayın
7. **Deploy settings** → **Trigger deploy** → **Clear cache and deploy site**

### 3. Web Uygulamasında IP Kontrolü

1. Canlı siteyi açın: `https://your-site.netlify.app`
2. Login yapın (şifre: `123456`)
3. **Ayarlar** sayfasına gidin
4. **ESP32 IP Adresi** alanını kontrol edin
5. Gerekirse güncelleyin ve **Bağlantıyı Test Et** butonuna tıklayın

### 4. Bağlantıyı Test Edin

**Tarayıcı konsolunda (F12):**
```javascript
// Manuel test
fetch('/api/esp32/status')
  .then(r => r.json())
  .then(data => console.log('ESP32 OK:', data))
  .catch(err => console.error('ESP32 HATA:', err));
```

**Başarılı yanıt:**
```json
{
  "temp": 25.5,
  "hum": 60.2,
  "soilAnalog": 2500,
  "soilPercent": 45,
  "threshold": 30,
  "pumpForced": false,
  "pumpState": "off",
  "ledManual": false,
  "servoAngle": 90
}
```

## 🐛 Sorun Giderme

### Problem: ESP32'ye Bağlanılamıyor

**Kontrol listesi:**
1. ✅ ESP32 çalışıyor mu? (Seri monitörden kontrol)
2. ✅ ESP32 ve router aynı ağda mı?
3. ✅ Netlify Environment variables doğru mu?
4. ✅ Netlify Functions deploy oldu mu?

**Netlify Functions loglarını kontrol:**
1. Netlify Dashboard → **Functions** → **esp32-proxy**
2. **Logs** sekmesine bakın
3. Hata mesajlarını kontrol edin

### Problem: "ERR_CONNECTION_TIMED_OUT"

**Nedenler:**
- ESP32 aynı ağda değil
- IP adresi yanlış
- Firewall/router engelliyor
- ESP32 çalışmıyor

**Çözüm:**
1. ESP32'yi seri monitörden kontrol edin
2. IP adresini doğrulayın
3. Router ayarlarını kontrol edin

### Problem: CORS Hatası

**Neden:**
- ESP32'de CORS header'ları eksik

**Çözüm:**
ESP32 kodunda CORS header'ları zaten var. Eğer hata alıyorsanız:
1. ESP32 kodunu yeniden flash edin
2. Netlify proxy kullanın (otomatik CORS)

## 📱 Mobil Cihazlardan Erişim

**Aynı Wi‑Fi ağında:**
- Mobil cihaz ESP32'ye direkt erişemez (farklı ağ)
- Netlify proxy üzerinden erişim gerekir

**Farklı ağda:**
- Netlify proxy otomatik çalışır
- ESP32'nin router'da port forwarding olması gerekir

## 🔒 Güvenlik Notları

1. **ESP32 IP'sini public yapmayın:**
   - Sadece Netlify Environment variables'da saklayın
   - Git repository'ye commit etmeyin

2. **Authentication ekleyin (ileri seviye):**
   - ESP32 koduna token kontrolü ekleyin
   - Netlify Function'a authentication ekleyin

3. **Rate limiting:**
   - Netlify Functions otomatik rate limit uygular
   - ESP32 tarafında da ekleyebilirsiniz

## 📊 Bağlantı Durumu

Web uygulamasında bağlantı durumu otomatik gösterilir:

- **Bağlı:** Yeşil nokta, "ESP32 Bağlı" yazısı
- **Bağlantı Yok:** Kırmızı nokta, "ESP32 Bağlantı Yok" yazısı
- **IP Bilgisi:** Hover ile IP adresi gösterilir

## 🎯 Hızlı Test

1. **ESP32'yi flash edin**
2. **Seri monitörden IP'yi öğrenin**
3. **Netlify Environment variables'ı güncelleyin**
4. **Site'yi yeniden deploy edin**
5. **Web uygulamasında "Bağlantıyı Test Et" butonuna tıklayın**

Başarılı olursa: ✅ Yeşil "ESP32 Bağlı" mesajı görürsünüz!

