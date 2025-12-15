# 🚀 Netlify'dan ESP32 Kontrol - Hızlı Başlangıç

## ⚡ 5 Dakikada Kurulum

### 1️⃣ ESP32'yi Hazırlayın (2 dakika)

```bash
# ESP32 V2 kodunu flash edin
# AkilliSaksiV2/src/main.cpp dosyasını kullanın
```

**Seri monitörden IP'yi öğrenin:**
```
WiFi baglandi IP: 172.20.10.7
HTTP server hazir
```

### 2️⃣ Netlify Environment Variables (1 dakika)

1. Netlify Dashboard → Site → **Environment variables**
2. **Add variable** → Şunları ekleyin:

```
ESP32_IP = 172.20.10.7
ESP32_PORT = 8080
```

3. **Save**

### 3️⃣ Deploy (1 dakika)

**Otomatik:** Git push yaptığınızda otomatik deploy olur

**Manuel:**
- **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

### 4️⃣ Test (1 dakika)

1. Canlı siteyi açın: `https://your-site.netlify.app`
2. Login: `123456`
3. **Ayarlar** → **"Bağlantıyı Test Et"**
4. ✅ Başarılı!

## 🎮 Kullanım

### Dashboard
- Gerçek zamanlı sensör verileri
- Dinamik stat kartları
- Bağlantı durumu göstergesi

### Kontroller
- **Sulama:** Pompa aç/kapat/otomatik
- **LED:** 32 adet Neopixel kontrolü
- **Servo:** 0-180° açı kontrolü
- **Eşik:** Nem eşiği ayarı (0-100%)

## 🔧 Sorun mu Var?

**ESP32'ye bağlanılamıyor:**
1. Seri monitörden ESP32'nin çalıştığını kontrol edin
2. IP adresini doğrulayın (172.20.10.7)
3. Netlify Environment variables'ı kontrol edin
4. Functions loglarını kontrol edin

**Detaylı rehber:** `NETLIFY-ESP32-KONTROL-REHBERI.md`

## 📱 Her Yerden Erişim

✅ Internet bağlantısı olan her yerden  
✅ HTTPS güvenli bağlantı  
✅ Mobil cihazlardan erişilebilir  
✅ PWA desteği (ana ekrana eklenebilir)  

---

**Detaylı bilgi için:** `NETLIFY-ESP32-KONTROL-REHBERI.md`

