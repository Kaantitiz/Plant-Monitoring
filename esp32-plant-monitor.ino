/*
 * ESP32 Bitki Yaşamı Monitoring Sistemi
 * WebSocket ile gerçek zamanlı veri gönderimi
 * Sulama, ışık ve sıcaklık kontrolü
 */

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>

// WiFi ayarları
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Sensör pinleri
#define DHT_PIN 4
#define SOIL_MOISTURE_PIN A0
#define WATER_PUMP_PIN 2
#define LED_PIN 5
#define PH_PIN A1

// Sensör nesneleri
DHT dht(DHT_PIN, DHT22);
BH1750 lightMeter;

// WebSocket server
WebSocketsServer webSocket = WebSocketsServer(81);

// Bitki verileri
struct PlantData {
  float temperature;
  float humidity;
  int soilMoisture;
  int lightLevel;
  float phLevel;
  bool waterPumpOn;
  bool ledOn;
  String plantName;
  String status;
} plantData;

// Zamanlayıcılar
unsigned long lastSensorRead = 0;
unsigned long lastWebSocketSend = 0;
const unsigned long SENSOR_INTERVAL = 5000; // 5 saniye
const unsigned long WEBSOCKET_INTERVAL = 2000; // 2 saniye

void setup() {
  Serial.begin(115200);
  
  // Pin ayarları
  pinMode(WATER_PUMP_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(WATER_PUMP_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  
  // Sensörleri başlat
  dht.begin();
  Wire.begin();
  lightMeter.begin();
  
  // WiFi bağlantısı
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("WiFi'ye bağlanıyor...");
  }
  
  Serial.println("WiFi bağlandı!");
  Serial.print("IP adresi: ");
  Serial.println(WiFi.localIP());
  
  // WebSocket server başlat
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  
  // İlk veri okuma
  readSensors();
  
  Serial.println("ESP32 Bitki Monitoring Sistemi hazır!");
}

void loop() {
  webSocket.loop();
  
  unsigned long currentTime = millis();
  
  // Sensör verilerini oku
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    readSensors();
    lastSensorRead = currentTime;
  }
  
  // WebSocket'e veri gönder
  if (currentTime - lastWebSocketSend >= WEBSOCKET_INTERVAL) {
    sendDataToWebApp();
    lastWebSocketSend = currentTime;
  }
  
  // Otomatik sulama kontrolü
  checkAutoWatering();
  
  delay(100);
}

void readSensors() {
  // Sıcaklık ve nem
  plantData.temperature = dht.readTemperature();
  plantData.humidity = dht.readHumidity();
  
  // Toprak nemi (0-100%)
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  plantData.soilMoisture = map(soilRaw, 0, 4095, 100, 0);
  
  // Işık seviyesi
  plantData.lightLevel = lightMeter.readLightLevel();
  
  // pH seviyesi (0-14)
  int phRaw = analogRead(PH_PIN);
  plantData.phLevel = map(phRaw, 0, 4095, 0, 14) / 10.0;
  
  // Durum belirleme
  determinePlantStatus();
  
  Serial.println("Sensör verileri okundu:");
  Serial.println("Sıcaklık: " + String(plantData.temperature) + "°C");
  Serial.println("Nem: " + String(plantData.humidity) + "%");
  Serial.println("Toprak Nem: " + String(plantData.soilMoisture) + "%");
  Serial.println("Işık: " + String(plantData.lightLevel) + " lux");
  Serial.println("pH: " + String(plantData.phLevel));
}

void determinePlantStatus() {
  if (plantData.soilMoisture < 20) {
    plantData.status = "Sulama Gerekli";
  } else if (plantData.temperature > 30 || plantData.temperature < 15) {
    plantData.status = "Sıcaklık Uygun Değil";
  } else if (plantData.humidity < 40) {
    plantData.status = "Nem Düşük";
  } else if (plantData.lightLevel < 100) {
    plantData.status = "Işık Yetersiz";
  } else {
    plantData.status = "Sağlıklı";
  }
}

void checkAutoWatering() {
  if (plantData.soilMoisture < 20 && !plantData.waterPumpOn) {
    startWatering();
  } else if (plantData.soilMoisture > 80 && plantData.waterPumpOn) {
    stopWatering();
  }
}

void startWatering() {
  digitalWrite(WATER_PUMP_PIN, HIGH);
  plantData.waterPumpOn = true;
  Serial.println("Sulama başlatıldı");
}

void stopWatering() {
  digitalWrite(WATER_PUMP_PIN, LOW);
  plantData.waterPumpOn = false;
  Serial.println("Sulama durduruldu");
}

void turnOnLED() {
  digitalWrite(LED_PIN, HIGH);
  plantData.ledOn = true;
  Serial.println("LED açıldı");
}

void turnOffLED() {
  digitalWrite(LED_PIN, LOW);
  plantData.ledOn = false;
  Serial.println("LED kapatıldı");
}

void sendDataToWebApp() {
  // JSON veri oluştur
  DynamicJsonDocument doc(1024);
  doc["temperature"] = plantData.temperature;
  doc["humidity"] = plantData.humidity;
  doc["soilMoisture"] = plantData.soilMoisture;
  doc["lightLevel"] = plantData.lightLevel;
  doc["phLevel"] = plantData.phLevel;
  doc["waterPumpOn"] = plantData.waterPumpOn;
  doc["ledOn"] = plantData.ledOn;
  doc["status"] = plantData.status;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // WebSocket ile gönder
  webSocket.broadcastTXT(jsonString);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("Client %u disconnected\n", num);
      break;
      
    case WStype_CONNECTED:
      Serial.printf("Client %u connected\n", num);
      // Bağlantı kurulduğunda mevcut veriyi gönder
      sendDataToWebApp();
      break;
      
    case WStype_TEXT:
      handleWebSocketMessage((char*)payload);
      break;
      
    default:
      break;
  }
}

void handleWebSocketMessage(String message) {
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  String command = doc["command"];
  
  if (command == "water") {
    bool start = doc["start"];
    if (start) {
      startWatering();
    } else {
      stopWatering();
    }
  }
  else if (command == "led") {
    bool on = doc["on"];
    if (on) {
      turnOnLED();
    } else {
      turnOffLED();
    }
  }
  else if (command == "setPlant") {
    plantData.plantName = doc["name"].as<String>();
    Serial.println("Bitki adı güncellendi: " + plantData.plantName);
  }
  
  // Komut işlendikten sonra güncel veriyi gönder
  sendDataToWebApp();
}

