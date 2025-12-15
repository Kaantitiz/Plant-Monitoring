#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <Adafruit_NeoPixel.h>
#include <ESP32Servo.h>
#include <WiFi.h>
#include <WebServer.h>

// --- PIN TANIMLAMALARI ---
#define DHTPIN 15        // Sıcaklık ve Nem Sensörü
#define DHTTYPE DHT11    
#define NEOPIXEL_PIN 14  // Neopixel LED
#define SERVO_PIN 13     // Servo Motor
#define RELAY_PIN 26     // Su Pompası
#define SOIL_PIN 34      // Toprak Sensörü (G34 - Analog)
#define STATUS_LED 2     // Dahili Mavi LED

// --- AYARLAR ---
#define NUMPIXELS 32     // GÜNCELLENDİ: Senin şeridin 32'li
#define SCREEN_WIDTH 128 
#define SCREEN_HEIGHT 64 

// --- WI-FI AYARLARI ---
const char* WIFI_SSID     = "iPhone";
const char* WIFI_PASSWORD = "Aloha*123";

// --- SENSÖR SINIRLARI (KALİBRASYON) ---
const int KuruDeger = 4095;  // Havada (Kuru)
const int IslakDeger = 1600; // Suda (Islak)

// --- NESNELER ---
DHT dht(DHTPIN, DHTTYPE);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
Adafruit_NeoPixel pixels(NUMPIXELS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
Servo myservo;
WebServer server(80);

// --- DURUM ---
unsigned long lastMeasureMs = 0;
const unsigned long measurePeriodMs = 2000;
float lastHum = 0;
float lastTemp = 0;
int lastSoilAnalog = 0;
int lastSoilPercent = 0;
int moistureThreshold = 30;   // Uygulamadan değiştirilebilir
bool pumpForced = false;      // true ise otomatik devre dışı
bool pumpForceState = false;  // zorunlu açık/kapalı
bool ledManual = false;        // true ise LED manuel kontrol
uint32_t ledManualColor = 0;  // manuel LED rengi
int servoAngle = 90;           // Servo açısı (0-180)

void setPump(bool on) {
  digitalWrite(RELAY_PIN, on ? LOW : HIGH); // Röle ters lojik
  digitalWrite(STATUS_LED, on ? HIGH : LOW);
}

void readSensorsAndControl() {
  lastHum = dht.readHumidity();
  lastTemp = dht.readTemperature();
  lastSoilAnalog = analogRead(SOIL_PIN);
  lastSoilPercent = map(lastSoilAnalog, KuruDeger, IslakDeger, 0, 100);
  lastSoilPercent = constrain(lastSoilPercent, 0, 100);

  bool pumpOn;
  if (pumpForced) {
    pumpOn = pumpForceState;
  } else {
    pumpOn = lastSoilPercent < moistureThreshold;
  }
  setPump(pumpOn);

  // LED kontrolü: manuel değilse otomatik (pompa durumuna göre)
  if (!ledManual) {
    uint32_t color = pumpOn ? pixels.Color(100, 0, 0) : pixels.Color(0, 100, 0);
    for (int i = 0; i < NUMPIXELS; i++) {
      pixels.setPixelColor(i, color);
    }
    pixels.show();
  }
}

void renderDisplay() {
  display.clearDisplay();
  display.setCursor(0,0);
  display.print("AKILLI SAKSI V1");

  display.setCursor(0, 15);
  display.print("Sicaklik: "); display.print(lastTemp); display.print(" C");

  display.setCursor(0, 25);
  display.print("Nem     : %"); display.print(lastHum);

  display.setCursor(0, 35);
  display.print("Toprak  : %"); display.print(lastSoilPercent);
  
  display.setCursor(0, 50);
  if (pumpForced) {
    display.print(pumpForceState ? ">> ZORLA ACIK <<" : ">> ZORLA KAPALI <<");
  } else if (lastSoilPercent < moistureThreshold) {
    display.print(">> SULANIYOR <<");
  } else {
    display.print(">> BITKI MUTLU <<");
  }

  display.display();
}

void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  String json = "{";
  json += "\"temp\":" + String(lastTemp, 1) + ",";
  json += "\"hum\":" + String(lastHum, 1) + ",";
  json += "\"soilAnalog\":" + String(lastSoilAnalog) + ",";
  json += "\"soilPercent\":" + String(lastSoilPercent) + ",";
  json += "\"threshold\":" + String(moistureThreshold) + ",";
  json += "\"pumpForced\":" + String(pumpForced ? "true" : "false") + ",";
  json += "\"pumpState\":" + String(digitalRead(RELAY_PIN) == LOW ? "\"on\"" : "\"off") + ",";
  json += "\"ledManual\":" + String(ledManual ? "true" : "false") + ",";
  json += "\"servoAngle\":" + String(servoAngle);
  json += "}";
  server.send(200, "application/json", json);
}

void handlePump() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  if (!server.hasArg("state")) {
    server.send(400, "text/plain", "state=on/off/auto gerekli");
    return;
  }
  String state = server.arg("state");
  if (state == "auto") {
    pumpForced = false;
    server.send(200, "text/plain", "Pump auto mod");
    return;
  }
  pumpForced = true;
  pumpForceState = (state == "on");
  setPump(pumpForceState);
  server.send(200, "text/plain", pumpForceState ? "Pump ON" : "Pump OFF");
}

void handleThreshold() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  if (!server.hasArg("value")) {
    server.send(400, "text/plain", "value (0-100) gerekli");
    return;
  }
  int val = server.arg("value").toInt();
  val = constrain(val, 0, 100);
  moistureThreshold = val;
  server.send(200, "text/plain", "Threshold guncellendi");
}

void handleLED() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  if (!server.hasArg("mode")) {
    server.send(400, "text/plain", "mode=auto/on/off gerekli");
    return;
  }
  String mode = server.arg("mode");
  if (mode == "auto") {
    ledManual = false;
    server.send(200, "text/plain", "LED auto mod");
    return;
  }
  ledManual = true;
  if (mode == "on") {
    // Renk parametreleri varsa kullan
    int r = server.hasArg("r") ? server.arg("r").toInt() : 0;
    int g = server.hasArg("g") ? server.arg("g").toInt() : 100;
    int b = server.hasArg("b") ? server.arg("b").toInt() : 0;
    ledManualColor = pixels.Color(r, g, b);
    for (int i = 0; i < NUMPIXELS; i++) {
      pixels.setPixelColor(i, ledManualColor);
    }
    pixels.show();
    server.send(200, "text/plain", "LED ON");
  } else if (mode == "off") {
    for (int i = 0; i < NUMPIXELS; i++) {
      pixels.setPixelColor(i, 0);
    }
    pixels.show();
    server.send(200, "text/plain", "LED OFF");
  } else {
    server.send(400, "text/plain", "Gecersiz mode");
  }
}

void handleServo() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  if (!server.hasArg("angle")) {
    server.send(400, "text/plain", "angle (0-180) gerekli");
    return;
  }
  int angle = server.arg("angle").toInt();
  angle = constrain(angle, 0, 180);
  servoAngle = angle;
  myservo.write(angle);
  server.send(200, "text/plain", "Servo " + String(angle) + " derece");
}

void setupWifiAndServer() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(250);
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi baglanamadi, offline devam");
  } else {
    Serial.print("WiFi baglandi IP: ");
    Serial.println(WiFi.localIP());
  }

  auto handleOptions = []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  };

  server.on("/status", HTTP_GET, handleStatus);
  server.on("/status", HTTP_OPTIONS, handleOptions);
  server.on("/pump", HTTP_POST, handlePump);
  server.on("/pump", HTTP_OPTIONS, handleOptions);
  server.on("/threshold", HTTP_POST, handleThreshold);
  server.on("/threshold", HTTP_OPTIONS, handleOptions);
  server.on("/led", HTTP_POST, handleLED);
  server.on("/led", HTTP_OPTIONS, handleOptions);
  server.on("/servo", HTTP_POST, handleServo);
  server.on("/servo", HTTP_OPTIONS, handleOptions);
  server.begin();
  Serial.println("HTTP server hazir");
}

void setup() {
  Serial.begin(115200);

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  pinMode(SOIL_PIN, INPUT);
  
  digitalWrite(RELAY_PIN, HIGH); // Röle kapalı başlasın

  dht.begin();
  pixels.begin();
  pixels.show(); // LED'leri söndürerek başlat
  
  myservo.setPeriodHertz(50); 
  myservo.attach(SERVO_PIN, 500, 2400);
  setupWifiAndServer();

  // OLED Başlatma
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
    Serial.println(F("HATA: OLED Ekran bulunamadı!"));
  }
  
  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setTextSize(1);
  display.setCursor(0,0);
  display.println("Sistem (32 LED) Hazir!");
  display.display();
  delay(1000);
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  if (now - lastMeasureMs >= measurePeriodMs) {
    lastMeasureMs = now;
    readSensorsAndControl();
    renderDisplay();
    Serial.print("Analog: "); Serial.print(lastSoilAnalog);
    Serial.print(" | Yuzde: "); Serial.println(lastSoilPercent);
  }
}