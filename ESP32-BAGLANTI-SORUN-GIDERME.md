# ESP32 Bağlantı Sorun Giderme Rehberi

## 🔴 Hata: `ERR_CONNECTION_TIMED_OUT`

ESP32'ye bağlanamıyorsanız, aşağıdaki adımları kontrol edin:

### 1. ESP32'nin Çalıştığını Kontrol Edin

- ESP32'yi seri monitörden kontrol edin (115200 baud)
- Wi‑Fi bağlantısını kontrol edin
- IP adresini seri monitörden okuyun

### 2. IP Adresini Doğrulayın

**Varsayılan IP:** `172.20.10.7`

**IP'yi değiştirmek için:**
1. Web uygulamasında **Ayarlar** sayfasına gidin
2. **ESP32 IP Adresi** alanını güncelleyin
3. **Bağlantıyı Test Et** butonuna tıklayın

### 3. Ağ Bağlantısını Kontrol Edin

**ESP32 ve bilgisayar aynı ağda olmalı:**
- ESP32: `iPhone` ağına bağlı
- Bilgisayar: Aynı `iPhone` ağına bağlı olmalı

**Kontrol:**
```bash
# Windows'ta ESP32'ye ping atın
ping 172.20.10.7
```

Eğer ping başarısız olursa:
- ESP32 farklı bir ağda olabilir
- Firewall/router engelliyor olabilir
- IP adresi yanlış olabilir

### 4. ESP32 Kodunu Kontrol Edin

**ESP32 kodunda (`main.cpp`):**
- Wi‑Fi SSID: `iPhone`
- Wi‑Fi Şifre: `Aloha*123`
- HTTP Server: Port `80`'de çalışıyor olmalı

**Seri monitörde görmeniz gereken:**
```
WiFi baglandi IP: 172.20.10.7
HTTP server hazir
```

### 5. Tarayıcı Konsolunu Kontrol Edin

**Chrome/Edge:**
1. F12 tuşuna basın
2. **Console** sekmesine gidin
3. Hata mesajlarını kontrol edin

**Beklenen hatalar:**
- `ERR_CONNECTION_TIMED_OUT` → ESP32'ye erişilemiyor
- `ERR_CONNECTION_REFUSED` → ESP32 çalışmıyor veya port yanlış
- `CORS error` → ESP32'de CORS header'ları eksik

### 6. Manuel Bağlantı Testi

**Tarayıcıda direkt test:**
```
http://172.20.10.7/status
```

Bu adres çalışıyorsa:
- ESP32 çalışıyor ✅
- Ağ bağlantısı OK ✅
- Web uygulaması ayarlarını kontrol edin

Bu adres çalışmıyorsa:
- ESP32'yi kontrol edin
- IP adresini doğrulayın
- Ağ bağlantısını kontrol edin

### 7. Firewall/Router Ayarları

**Windows Firewall:**
- ESP32 IP'sine erişime izin verin
- Port 80'in açık olduğundan emin olun

**Router Ayarları:**
- AP Isolation kapalı olmalı
- Client Isolation kapalı olmalı

### 8. Alternatif Çözümler

**IP adresi değiştiyse:**
1. ESP32'yi seri monitörden kontrol edin
2. Yeni IP'yi web uygulamasına girin

**Farklı ağdaysa:**
- ESP32 ve bilgisayarı aynı Wi‑Fi ağına bağlayın
- Veya port forwarding yapın (ileri seviye)

## 🔧 Hızlı Test Komutları

### Windows PowerShell:
```powershell
# ESP32'ye ping
Test-Connection -ComputerName 172.20.10.7

# Port kontrolü
Test-NetConnection -ComputerName 172.20.10.7 -Port 80
```

### Tarayıcı Console:
```javascript
// ESP32 bağlantı testi
fetch('http://172.20.10.7/status')
  .then(r => r.json())
  .then(data => console.log('ESP32 OK:', data))
  .catch(err => console.error('ESP32 HATA:', err));
```

## 📝 Notlar

- **Timeout süresi:** 5 saniye (kod içinde ayarlanmış)
- **Retry:** Otomatik olarak 5 saniyede bir tekrar dener
- **Offline mod:** ESP32 bağlantısı yoksa simülasyon verisi gösterir

## 🆘 Hala Çalışmıyorsa

1. ESP32'yi yeniden başlatın
2. Wi‑Fi bağlantısını kesip tekrar bağlayın
3. Web uygulamasını yenileyin (F5)
4. Tarayıcı cache'ini temizleyin
5. Farklı bir tarayıcı deneyin

