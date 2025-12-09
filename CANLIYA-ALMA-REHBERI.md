# 🌐 Projeyi Canlıya Alma Rehberi

Bu rehber, ESP32 Bitki İzleme sisteminizi internete açmak için adım adım talimatlar içerir.

## 📋 İçindekiler

1. [Web Uygulamasını Canlıya Alma](#1-web-uygulamasını-canlıya-alma)
2. [ESP32 İçin İnternet Erişimi](#2-esp32-için-internet-erişimi)
3. [Güvenlik Önlemleri](#3-güvenlik-önlemleri)
4. [Alternatif Çözümler](#4-alternatif-çözümler)

---

## 1. Web Uygulamasını Canlıya Alma

### 🎯 Yöntem 1: Netlify (Önerilen - En Kolay)

**Avantajlar:**
- ✅ Ücretsiz
- ✅ Otomatik HTTPS
- ✅ Kolay deployment
- ✅ Custom domain desteği
- ✅ CDN desteği

**Adımlar:**

1. **Netlify hesabı oluşturun:**
   - https://www.netlify.com adresine gidin
   - "Sign up" ile GitHub, GitLab veya email ile kaydolun

2. **Projeyi GitHub'a yükleyin:**
   ```bash
   # Git repository oluşturun
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADI/bitki-yasami.git
   git push -u origin main
   ```

3. **Netlify'e bağlayın:**
   - Netlify dashboard'a gidin
   - "Add new site" → "Import an existing project"
   - GitHub repository'nizi seçin
   - Build settings:
     - **Build command:** (boş bırakın)
     - **Publish directory:** `/` (root)
   - "Deploy site" butonuna tıklayın

4. **Custom domain ekleyin (opsiyonel):**
   - Site settings → Domain settings
   - Custom domain ekleyin

**Sonuç:** `https://bitki-yasami.netlify.app` gibi bir URL alırsınız!

---

### 🎯 Yöntem 2: Vercel

**Avantajlar:**
- ✅ Ücretsiz
- ✅ Otomatik HTTPS
- ✅ Hızlı CDN
- ✅ Edge functions desteği

**Adımlar:**

1. **Vercel hesabı oluşturun:**
   - https://vercel.com adresine gidin
   - GitHub ile giriş yapın

2. **Projeyi deploy edin:**
   - "Add New Project" butonuna tıklayın
   - GitHub repository'nizi seçin
   - Framework Preset: "Other"
   - Root Directory: `./`
   - "Deploy" butonuna tıklayın

**Sonuç:** `https://bitki-yasami.vercel.app` gibi bir URL alırsınız!

---

### 🎯 Yöntem 3: GitHub Pages

**Avantajlar:**
- ✅ Tamamen ücretsiz
- ✅ GitHub ile entegre
- ✅ Custom domain desteği

**Adımlar:**

1. **GitHub repository oluşturun:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADI/bitki-yasami.git
   git push -u origin main
   ```

2. **GitHub Pages'i aktifleştirin:**
   - Repository → Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main` / `/ (root)`
   - Save

3. **Custom domain ekleyin (opsiyonel):**
   - Settings → Pages → Custom domain
   - Domain adınızı girin

**Sonuç:** `https://KULLANICI_ADI.github.io/bitki-yasami` URL'i oluşur!

---

### 🎯 Yöntem 4: Firebase Hosting

**Avantajlar:**
- ✅ Google altyapısı
- ✅ Ücretsiz tier
- ✅ Global CDN
- ✅ Custom domain

**Adımlar:**

1. **Firebase CLI kurulumu:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Firebase projesi oluşturun:**
   ```bash
   firebase init hosting
   # Proje klasörünüzü seçin
   # Public directory: . (nokta)
   # Single-page app: Yes
   ```

3. **Deploy edin:**
   ```bash
   firebase deploy --only hosting
   ```

**Sonuç:** `https://PROJE-ID.web.app` URL'i oluşur!

---

## 2. ESP32 İçin İnternet Erişimi

ESP32'nizin WebSocket sunucusuna dışarıdan erişmek için birkaç yöntem var:

### 🌐 Yöntem 1: Port Forwarding + Dynamic DNS (En Pratik)

**Gereksinimler:**
- Router'a admin erişimi
- Dynamic DNS servisi (No-IP, DuckDNS)

**Adımlar:**

1. **Dynamic DNS hesabı oluşturun:**
   - **DuckDNS (Önerilen - Ücretsiz):** https://www.duckdns.org
   - **No-IP:** https://www.noip.com
   - Domain adı alın: `bitki-yasami.duckdns.org`

2. **Router'da Port Forwarding:**
   - Router admin paneline girin (genelde `192.168.1.1`)
   - Port Forwarding / Virtual Server bölümüne gidin
   - Yeni kural ekleyin:
     - **External Port:** 81
     - **Internal IP:** ESP32'nin IP adresi (örn: 192.168.1.100)
     - **Internal Port:** 81
     - **Protocol:** TCP
     - **Service Name:** ESP32-WebSocket

3. **ESP32 kodunu güncelleyin:**
   - ESP32'de Dynamic DNS client kurulumu (opsiyonel)
   - Veya router'da Dynamic DNS ayarlarını yapın

4. **Web uygulamasında IP'yi güncelleyin:**
   ```javascript
   // script.js veya ayarlar sayfasından
   const ESP32_IP = "bitki-yasami.duckdns.org"; // veya public IP
   const WEBSOCKET_PORT = 81;
   ```

**⚠️ Güvenlik Notu:** WebSocket'i doğrudan internete açmak güvenlik riski oluşturur. Güvenlik önlemlerine bakın.

---

### 🌐 Yöntem 2: Cloud WebSocket Bridge (Önerilen - Daha Güvenli)

**Avantajlar:**
- ✅ Daha güvenli
- ✅ HTTPS/WSS desteği
- ✅ Authentication eklenebilir
- ✅ Load balancing

**Seçenekler:**

#### A) Socket.io Server (Node.js)

1. **Heroku/Railway/Render'da Node.js server kurun:**
   ```javascript
   // server.js
   const express = require('express');
   const http = require('http');
   const { Server } = require('socket.io');
   const WebSocket = require('ws');

   const app = express();
   const server = http.createServer(app);
   const io = new Server(server, {
     cors: { origin: "*" }
   });

   // ESP32 WebSocket bağlantısı
   const esp32Ws = new WebSocket('ws://ESP32_LOCAL_IP:81');

   // Client bağlantıları
   io.on('connection', (socket) => {
     console.log('Client connected');
     
     // ESP32'den gelen verileri clientlara ilet
     esp32Ws.on('message', (data) => {
       socket.emit('plant-data', JSON.parse(data));
     });
     
     // Client'tan gelen komutları ESP32'ye ilet
     socket.on('command', (data) => {
       esp32Ws.send(JSON.stringify(data));
     });
   });

   server.listen(process.env.PORT || 3000);
   ```

2. **Deploy edin:**
   - Heroku: `git push heroku main`
   - Railway: GitHub'a bağlayın, otomatik deploy
   - Render: GitHub'a bağlayın, otomatik deploy

3. **Web uygulamasını güncelleyin:**
   ```javascript
   // script.js
   const WEBSOCKET_URL = "wss://bitki-yasami-bridge.herokuapp.com";
   const websocket = new WebSocket(WEBSOCKET_URL);
   ```

#### B) MQTT Broker (Daha Profesyonel)

1. **MQTT Broker kurun:**
   - HiveMQ Cloud (ücretsiz tier)
   - Mosquitto (kendi sunucunuzda)
   - AWS IoT Core

2. **ESP32 kodunu MQTT'ye çevirin:**
   ```cpp
   #include <PubSubClient.h>
   
   WiFiClient espClient;
   PubSubClient client(espClient);
   
   void setup() {
     client.setServer("mqtt.broker.com", 1883);
     client.setCallback(callback);
   }
   
   void loop() {
     client.publish("plant/data", jsonString);
   }
   ```

3. **Web uygulamasında MQTT client kullanın:**
   ```javascript
   import mqtt from 'mqtt';
   const client = mqtt.connect('wss://mqtt.broker.com');
   ```

---

### 🌐 Yöntem 3: VPN (En Güvenli)

**Avantajlar:**
- ✅ Tam güvenlik
- ✅ Şifreli bağlantı
- ✅ Tüm cihazlar erişebilir

**Seçenekler:**

1. **Tailscale (Önerilen - Kolay):**
   - https://tailscale.com
   - Ücretsiz (kişisel kullanım)
   - ESP32'ye Tailscale client kurun
   - Web uygulamasından Tailscale IP ile bağlanın

2. **WireGuard:**
   - Kendi VPN sunucunuzu kurun
   - ESP32'ye WireGuard client kurun

---

## 3. Güvenlik Önlemleri

### 🔒 WebSocket Güvenliği

1. **WSS (WebSocket Secure) kullanın:**
   ```javascript
   // HTTP yerine HTTPS
   const wsUrl = `wss://${ESP32_IP}:443`;
   ```

2. **Authentication ekleyin:**
   ```cpp
   // ESP32'de
   void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
     if (type == WStype_CONNECTED) {
       String token = String((char*)payload);
       if (token != "SECRET_TOKEN") {
         webSocket.disconnect(num);
         return;
       }
     }
   }
   ```

3. **Rate Limiting:**
   - Çok fazla istek engelleme
   - IP bazlı kısıtlama

4. **Firewall kuralları:**
   - Sadece gerekli portları açın
   - IP whitelist kullanın

### 🔒 Web Uygulaması Güvenliği

1. **HTTPS zorunlu:**
   - Tüm hosting servisleri otomatik sağlar

2. **CORS ayarları:**
   ```javascript
   // Gerekirse backend'de
   app.use(cors({
     origin: 'https://bitki-yasami.netlify.app'
   }));
   ```

3. **Environment variables:**
   - Hassas bilgileri environment variable'lara taşıyın
   - `.env` dosyasını git'e eklemeyin

---

## 4. Alternatif Çözümler

### 📱 Mobil Uygulama

Web uygulamasını mobil uygulamaya çevirebilirsiniz:

1. **React Native**
2. **Flutter**
3. **Ionic**
4. **Capacitor** (mevcut web uygulamanızı wrap eder)

### ☁️ Cloud Database

Verileri kaydetmek için:

1. **Firebase Realtime Database**
2. **Supabase**
3. **InfluxDB** (time series data için)
4. **MongoDB Atlas**

### 🔔 Bildirimler

1. **Push Notifications:**
   - Firebase Cloud Messaging
   - Web Push API

2. **Email/SMS:**
   - SendGrid
   - Twilio

---

## 🚀 Hızlı Başlangıç Özeti

### En Kolay Yol (5 Dakika):

1. **Web uygulaması:**
   ```bash
   # GitHub'a yükleyin
   git init
   git add .
   git commit -m "Deploy"
   git remote add origin https://github.com/KULLANICI/bitki-yasami.git
   git push -u origin main
   
   # Netlify'e bağlayın
   # https://app.netlify.com → Import project → GitHub
   ```

2. **ESP32 için:**
   - DuckDNS hesabı oluşturun
   - Router'da port forwarding yapın
   - Web uygulamasında IP'yi güncelleyin

**Sonuç:** 5 dakikada canlıda! 🎉

---

## 📞 Destek

Sorun yaşarsanız:
- GitHub Issues
- Netlify/Vercel dokümantasyonu
- ESP32 forumları

---

**Not:** Canlıya almadan önce mutlaka güvenlik testleri yapın!

