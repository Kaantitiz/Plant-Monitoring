// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mainContent = document.getElementById('mainContent');
const pages = document.querySelectorAll('.page');
const menuItems = document.querySelectorAll('.menu-item');
const mobileNavItems = document.querySelectorAll('.mobile-bottom-nav .nav-item');

// Data simulation
let plantData = {
    soilMoisture: 75,
    temperature: 26,
    humidity: 60,
    lightLevel: 80,
    phLevel: 6.5,
    autoWatering: true,
    notifications: true,
    updateFrequency: 10,
    waterPumpOn: false,
    ledOn: false,
    status: "Sağlıklı",
    connected: false
};

// WebSocket connection
let websocket = null;
const ESP32_IP = "192.168.1.100"; // ESP32'nin IP adresi
const WEBSOCKET_PORT = 81;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    connectToESP32();
    startDataSimulation();
    setupEventListeners();
});

function initializeApp() {
    // Set initial data
    updateDashboard();
    
    // Show dashboard by default
    showPage('dashboard');
    
    // Set active menu item
    setActiveMenuItem('dashboard');
    
    // Update plant statuses in sidebar
    updateSidebarPlantStatuses();
}

// WebSocket bağlantı fonksiyonları
function connectToESP32() {
    const wsUrl = `ws://${ESP32_IP}:${WEBSOCKET_PORT}`;
    
    try {
        websocket = new WebSocket(wsUrl);
        
        websocket.onopen = function(event) {
            console.log('ESP32 ile bağlantı kuruldu');
            plantData.connected = true;
            updateConnectionStatus();
            showMessage('ESP32 ile bağlantı kuruldu!', 'success');
        };
        
        websocket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                updatePlantDataFromESP32(data);
            } catch (error) {
                console.error('WebSocket veri hatası:', error);
            }
        };
        
        websocket.onclose = function(event) {
            console.log('ESP32 bağlantısı kesildi');
            plantData.connected = false;
            updateConnectionStatus();
            showMessage('ESP32 bağlantısı kesildi. Yeniden bağlanmaya çalışılıyor...', 'error');
            
            // 5 saniye sonra yeniden bağlan
            setTimeout(connectToESP32, 5000);
        };
        
        websocket.onerror = function(error) {
            console.error('WebSocket hatası:', error);
            plantData.connected = false;
            updateConnectionStatus();
        };
        
    } catch (error) {
        console.error('WebSocket bağlantı hatası:', error);
        plantData.connected = false;
        updateConnectionStatus();
    }
}

function updatePlantDataFromESP32(data) {
    // ESP32'den gelen verileri güncelle
    if (data.temperature !== undefined) plantData.temperature = data.temperature;
    if (data.humidity !== undefined) plantData.humidity = data.humidity;
    if (data.soilMoisture !== undefined) plantData.soilMoisture = data.soilMoisture;
    if (data.lightLevel !== undefined) plantData.lightLevel = data.lightLevel;
    if (data.phLevel !== undefined) plantData.phLevel = data.phLevel;
    if (data.waterPumpOn !== undefined) plantData.waterPumpOn = data.waterPumpOn;
    if (data.ledOn !== undefined) plantData.ledOn = data.ledOn;
    if (data.status !== undefined) plantData.status = data.status;
    
    // UI'yi güncelle
    updateDashboard();
    updateGauges();
    updatePlantCards();
    updateSidebarPlantStatuses();
}

function sendCommandToESP32(command, data = {}) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        const message = {
            command: command,
            ...data
        };
        websocket.send(JSON.stringify(message));
        console.log('ESP32\'ye komut gönderildi:', message);
    } else {
        console.error('ESP32 bağlantısı yok');
        showMessage('ESP32 bağlantısı yok!', 'error');
    }
}

function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    const connectionDot = document.getElementById('connectionDot');
    const connectionText = document.getElementById('connectionText');
    const connectionStatusDisplay = document.getElementById('connectionStatusDisplay');
    
    if (statusElement) {
        statusElement.textContent = plantData.connected ? 'Bağlı' : 'Bağlantı Yok';
        statusElement.className = plantData.connected ? 'connected' : 'disconnected';
    }
    
    if (connectionDot) {
        connectionDot.className = plantData.connected ? 'connection-dot connected' : 'connection-dot';
    }
    
    if (connectionText) {
        connectionText.textContent = plantData.connected ? 'Bağlı' : 'Bağlantı Yok';
    }
    
    if (connectionStatusDisplay) {
        connectionStatusDisplay.textContent = plantData.connected ? 'Bağlı' : 'Bağlantı Yok';
        connectionStatusDisplay.className = plantData.connected ? 'connected' : 'disconnected';
    }
}

function updatePlantCards() {
    // Bitki kartlarındaki verileri güncelle
    const plantCards = document.querySelectorAll('.plant-card[data-plant]');
    plantCards.forEach(card => {
        const plant = card.getAttribute('data-plant');
        const statusElement = card.querySelector('.status-text');
        const dataItems = card.querySelectorAll('.plant-data .data-value');
        
        if (statusElement) {
            statusElement.textContent = plantData.status;
        }
        
        if (dataItems.length >= 2) {
            dataItems[0].textContent = plantData.soilMoisture + '%';
            dataItems[1].textContent = plantData.temperature + '°C';
        }
    });
}

function setupEventListeners() {
    // Sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Mobile menu toggle removed - no longer needed
    
    // Menu item clicks
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            const plant = this.getAttribute('data-plant');
            
            showPage(page);
            setActiveMenuItem(page);
            closeSidebar();
            
            // Store selected plant if it's a plant item
            if (plant) {
                localStorage.setItem('selectedPlant', plant);
                const plantName = this.querySelector('.plant-name').textContent;
                showMessage(`${plantName} seçildi. Kontrol paneline yönlendiriliyorsunuz...`, 'success');
            }
        });
    });
    
    // Mobile navigation clicks
    mobileNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
            setActiveMobileNav(page);
            setActiveMenuItem(page);
        });
    });
    
    // Plant card clicks
    setupPlantCardClicks();
    
    // General status page clicks
    setupGeneralStatusClicks();
    
    // Quick action buttons
    setupQuickActions();
    
    // Settings page functionality
    setupSettingsPage();
    
    // Control buttons
    setupControlButtons();
    
    // Settings
    setupSettings();
    
    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });
}

function toggleSidebar() {
    sidebar.classList.toggle('open');
}

function closeSidebar() {
    sidebar.classList.remove('open');
}

function showPage(pageId) {
    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

function setActiveMenuItem(pageId) {
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        }
    });
}

function setActiveMobileNav(pageId) {
    mobileNavItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        }
    });
}

function updateDashboard() {
    // Update soil moisture
    const soilMoistureElement = document.getElementById('soilMoisture');
    if (soilMoistureElement) {
        soilMoistureElement.textContent = plantData.soilMoisture;
    }
    
    // Update temperature
    const temperatureElement = document.getElementById('temperature');
    if (temperatureElement) {
        temperatureElement.textContent = plantData.temperature + '°';
    }
}

function setupPlantCardClicks() {
    const plantCards = document.querySelectorAll('.plant-card[data-page]');
    
    plantCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            const plant = this.getAttribute('data-plant');
            
            if (page) {
                showPage(page);
                
                // Update navigation if it's a plant control page
                if (page.includes('-control')) {
                    setActiveMenuItem('dashboard');
                    setActiveMobileNav('dashboard');
                    
                    // Enable sidebar menu items
                    enableSidebarMenu();
                    
                    // Store selected plant
                    if (plant) {
                        localStorage.setItem('selectedPlant', plant);
                        const plantName = this.querySelector('h3').textContent;
                        showMessage(`${plantName} seçildi. Kontrol menüleri aktifleştirildi!`, 'success');
                    }
                }
                
                // Show message for plant selection
                if (plant) {
                    const plantName = this.querySelector('h3').textContent;
                    showMessage(`${plantName} seçildi. Kontrol paneline yönlendiriliyorsunuz...`, 'success');
                }
            }
        });
    });
}

// Sidebar çiçek durumlarını güncelle
function updateSidebarPlantStatuses() {
    const plantItems = document.querySelectorAll('.plant-item');
    plantItems.forEach(item => {
        const plant = item.getAttribute('data-plant');
        const statusElement = item.querySelector('.plant-status');
        
        if (statusElement) {
            // ESP32'den gelen veriye göre durumu güncelle
            if (plantData.status) {
                statusElement.textContent = plantData.status;
                statusElement.className = 'plant-status';
                
                if (plantData.status.includes('Sağlıklı')) {
                    statusElement.classList.add('healthy');
                } else if (plantData.status.includes('Dikkat')) {
                    statusElement.classList.add('warning');
                } else if (plantData.status.includes('Sulama')) {
                    statusElement.classList.add('error');
                }
            }
        }
    });
}

// Genel Durum Sayfası Tıklamaları
function setupGeneralStatusClicks() {
    const statusCards = document.querySelectorAll('.plant-status-card[data-plant]');
    
    statusCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            const plant = this.getAttribute('data-plant');
            
            if (page) {
                showPage(page);
                setActiveMenuItem(page);
                setActiveMobileNav('dashboard');
                
                if (plant) {
                    localStorage.setItem('selectedPlant', plant);
                    const plantName = this.querySelector('h3').textContent;
                    showMessage(`${plantName} seçildi. Kontrol paneline yönlendiriliyorsunuz...`, 'success');
                }
            }
        });
    });
}

// Hızlı İşlemler
function setupQuickActions() {
    const waterAllBtn = document.getElementById('waterAll');
    const lightAllBtn = document.getElementById('lightAll');
    const checkAllBtn = document.getElementById('checkAll');
    
    if (waterAllBtn) {
        waterAllBtn.addEventListener('click', function() {
            if (plantData.connected) {
                sendCommandToESP32('water', { start: true, all: true });
                showMessage('Tüm çiçekler sulanmaya başlandı!', 'success');
            } else {
                showMessage('ESP32 bağlantısı gerekli!', 'error');
            }
        });
    }
    
    if (lightAllBtn) {
        lightAllBtn.addEventListener('click', function() {
            if (plantData.connected) {
                sendCommandToESP32('led', { on: true, all: true });
                showMessage('Tüm ışıklar açıldı!', 'success');
            } else {
                showMessage('ESP32 bağlantısı gerekli!', 'error');
            }
        });
    }
    
    if (checkAllBtn) {
        checkAllBtn.addEventListener('click', function() {
            showMessage('Tüm çiçeklerin durumu kontrol ediliyor...', 'success');
            // Simulate status check
            setTimeout(() => {
                updateSidebarPlantStatuses();
                showMessage('Durum kontrolü tamamlandı!', 'success');
            }, 2000);
        });
    }
}

// Ayarlar Sayfası
function setupSettingsPage() {
    const esp32IPInput = document.getElementById('esp32IP');
    const websocketPortInput = document.getElementById('websocketPort');
    const testConnectionBtn = document.getElementById('testConnection');
    const resetDataBtn = document.getElementById('resetData');
    
    // ESP32 IP güncelleme
    if (esp32IPInput) {
        esp32IPInput.addEventListener('change', function() {
            const newIP = this.value;
            if (newIP && newIP !== ESP32_IP) {
                // Update global IP
                window.ESP32_IP = newIP;
                showMessage(`ESP32 IP adresi güncellendi: ${newIP}`, 'success');
                // Reconnect with new IP
                connectToESP32();
            }
        });
    }
    
    // WebSocket Port güncelleme
    if (websocketPortInput) {
        websocketPortInput.addEventListener('change', function() {
            const newPort = this.value;
            if (newPort && newPort !== WEBSOCKET_PORT) {
                window.WEBSOCKET_PORT = newPort;
                showMessage(`WebSocket port güncellendi: ${newPort}`, 'success');
                connectToESP32();
            }
        });
    }
    
    // Bağlantı testi
    if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', function() {
            showMessage('ESP32 bağlantısı test ediliyor...', 'success');
            connectToESP32();
        });
    }
    
    // Veri sıfırlama
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', function() {
            if (confirm('Tüm verileri sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
                localStorage.clear();
                showMessage('Tüm veriler sıfırlandı!', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        });
    }
}

function setupControlButtons() {
    // Watering controls
    const waterNowBtn = document.getElementById('waterNow');
    const autoWaterBtn = document.getElementById('autoWater');
    
    if (waterNowBtn) {
        waterNowBtn.addEventListener('click', function() {
            waterNow();
        });
    }
    
    if (autoWaterBtn) {
        autoWaterBtn.addEventListener('click', function() {
            toggleAutoWatering();
        });
    }
    
    // Humidity controls
    const increaseHumidityBtn = document.getElementById('increaseHumidity');
    const decreaseHumidityBtn = document.getElementById('decreaseHumidity');
    
    if (increaseHumidityBtn) {
        increaseHumidityBtn.addEventListener('click', function() {
            adjustHumidity(10);
        });
    }
    
    if (decreaseHumidityBtn) {
        decreaseHumidityBtn.addEventListener('click', function() {
            adjustHumidity(-10);
        });
    }
    
    // Temperature controls
    const increaseTempBtn = document.getElementById('increaseTemp');
    const decreaseTempBtn = document.getElementById('decreaseTemp');
    
    if (increaseTempBtn) {
        increaseTempBtn.addEventListener('click', function() {
            adjustTemperature(1);
        });
    }
    
    if (decreaseTempBtn) {
        decreaseTempBtn.addEventListener('click', function() {
            adjustTemperature(-1);
        });
    }
    
    // Light controls
    const turnOnLightBtn = document.getElementById('turnOnLight');
    const turnOffLightBtn = document.getElementById('turnOffLight');
    
    if (turnOnLightBtn) {
        turnOnLightBtn.addEventListener('click', function() {
            adjustLight(100);
        });
    }
    
    if (turnOffLightBtn) {
        turnOffLightBtn.addEventListener('click', function() {
            adjustLight(0);
        });
    }
}

function setupSettings() {
    const autoWateringCheckbox = document.getElementById('autoWatering');
    const notificationsCheckbox = document.getElementById('notifications');
    const updateFrequencySelect = document.getElementById('updateFrequency');
    
    if (autoWateringCheckbox) {
        autoWateringCheckbox.checked = plantData.autoWatering;
        autoWateringCheckbox.addEventListener('change', function() {
            plantData.autoWatering = this.checked;
            showMessage('Otomatik sulama ' + (this.checked ? 'açıldı' : 'kapatıldı'), 'success');
        });
    }
    
    if (notificationsCheckbox) {
        notificationsCheckbox.checked = plantData.notifications;
        notificationsCheckbox.addEventListener('change', function() {
            plantData.notifications = this.checked;
            showMessage('Bildirimler ' + (this.checked ? 'açıldı' : 'kapatıldı'), 'success');
        });
    }
    
    if (updateFrequencySelect) {
        updateFrequencySelect.value = plantData.updateFrequency;
        updateFrequencySelect.addEventListener('change', function() {
            plantData.updateFrequency = parseInt(this.value);
            showMessage('Veri güncelleme sıklığı değiştirildi: ' + this.value + ' saniye', 'success');
        });
    }
}

// Control Functions
function waterNow() {
    if (plantData.connected) {
        sendCommandToESP32('water', { start: true });
        showMessage('ESP32\'ye sulama komutu gönderildi...', 'success');
    } else {
        showMessage('Sulama başlatılıyor...', 'success');
        
        // Simulate watering process
        setTimeout(() => {
            plantData.soilMoisture = Math.min(100, plantData.soilMoisture + 20);
            updateDashboard();
            updateGauges();
            showMessage('Sulama tamamlandı!', 'success');
        }, 2000);
    }
}

function toggleAutoWatering() {
    plantData.autoWatering = !plantData.autoWatering;
    const autoWaterBtn = document.getElementById('autoWater');
    if (autoWaterBtn) {
        autoWaterBtn.textContent = plantData.autoWatering ? 'Otomatik Sulama (Açık)' : 'Otomatik Sulama (Kapalı)';
        autoWaterBtn.classList.toggle('btn-primary', plantData.autoWatering);
        autoWaterBtn.classList.toggle('btn-secondary', !plantData.autoWatering);
    }
    showMessage('Otomatik sulama ' + (plantData.autoWatering ? 'açıldı' : 'kapatıldı'), 'success');
}

function adjustHumidity(change) {
    plantData.humidity = Math.max(0, Math.min(100, plantData.humidity + change));
    updateGauges();
    showMessage('Nem seviyesi ayarlandı: ' + plantData.humidity + '%', 'success');
}

function adjustTemperature(change) {
    plantData.temperature = Math.max(15, Math.min(35, plantData.temperature + change));
    updateDashboard();
    showMessage('Sıcaklık ayarlandı: ' + plantData.temperature + '°C', 'success');
}

function adjustLight(level) {
    plantData.lightLevel = level;
    updateGauges();
    showMessage('Işık seviyesi ayarlandı: ' + plantData.lightLevel + '%', 'success');
}

function updateGauges() {
    // Update moisture gauge
    const moistureGauge = document.querySelector('#moistureGauge .gauge-fill');
    if (moistureGauge) {
        moistureGauge.style.width = plantData.soilMoisture + '%';
    }
    
    // Update humidity gauge
    const humidityGauge = document.querySelector('#humidityGauge .gauge-fill');
    if (humidityGauge) {
        humidityGauge.style.width = plantData.humidity + '%';
    }
    
    // Update light gauge
    const lightGauge = document.querySelector('#lightGauge .gauge-fill');
    if (lightGauge) {
        lightGauge.style.width = plantData.lightLevel + '%';
    }
    
    // Update gauge values
    const gaugeValues = document.querySelectorAll('.gauge-value');
    gaugeValues.forEach((value, index) => {
        switch(index) {
            case 0: // Moisture
                value.textContent = plantData.soilMoisture + '%';
                break;
            case 1: // Humidity
                value.textContent = plantData.humidity + '%';
                break;
            case 2: // Light
                value.textContent = plantData.lightLevel + '%';
                break;
        }
    });
}

function startDataSimulation() {
    setInterval(() => {
        // Simulate natural changes in plant data
        if (plantData.autoWatering && plantData.soilMoisture < 30) {
            plantData.soilMoisture = Math.min(100, plantData.soilMoisture + 5);
        } else {
            plantData.soilMoisture = Math.max(0, plantData.soilMoisture - 0.5);
        }
        
        // Simulate temperature fluctuations
        plantData.temperature += (Math.random() - 0.5) * 0.2;
        plantData.temperature = Math.max(18, Math.min(30, plantData.temperature));
        
        // Simulate humidity changes
        plantData.humidity += (Math.random() - 0.5) * 1;
        plantData.humidity = Math.max(40, Math.min(80, plantData.humidity));
        
        // Update displays
        updateDashboard();
        updateGauges();
        
        // Check for alerts
        checkAlerts();
        
    }, plantData.updateFrequency * 1000);
}

function checkAlerts() {
    if (!plantData.notifications) return;
    
    let alerts = [];
    
    if (plantData.soilMoisture < 20) {
        alerts.push('Toprak nem seviyesi çok düşük!');
    }
    
    if (plantData.temperature < 20 || plantData.temperature > 28) {
        alerts.push('Sıcaklık seviyesi uygun değil!');
    }
    
    if (plantData.humidity < 50) {
        alerts.push('Nem seviyesi çok düşük!');
    }
    
    if (alerts.length > 0) {
        showMessage(alerts.join(' '), 'error');
    }
}

function showMessage(text, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // Insert message at the top of the current page
    const currentPage = document.querySelector('.page.active');
    if (currentPage) {
        currentPage.insertBefore(message, currentPage.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    }
}

// Plant card hover effects
function enhancePlantCards() {
    const plantCards = document.querySelectorAll('.plant-card');
    
    plantCards.forEach(card => {
        // Add click effect
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// Initialize plant card enhancements
document.addEventListener('DOMContentLoaded', function() {
    enhancePlantCards();
});

// Responsive handling
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        closeSidebar();
    }
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}

// CORS warning suppression for file:// protocol
if (location.protocol === 'file:') {
    console.log('⚠️ Uygulama file:// protokolü ile çalışıyor. PWA özellikleri için HTTP/HTTPS sunucu gereklidir.');
    console.log('💡 Çözüm: Python -m http.server 8000 veya Live Server kullanın');
}

// Suppress favicon and icon 404 errors
const originalError = console.error;
console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('favicon.ico') || 
        message.includes('Failed to load resource') ||
        message.includes('icon-144x144.png') ||
        message.includes('icon-') ||
        message.includes('Download error or resource isn\'t a valid image')) {
        return; // Suppress icon/favicon errors
    }
    originalError.apply(console, args);
};

// Clear any old caches on load
if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
        return Promise.all(
            cacheNames.map(function(cacheName) {
                if (cacheName.startsWith('bitki-yasami-') && cacheName !== 'bitki-yasami-v1.0.2') {
                    console.log('Clearing old cache:', cacheName);
                    return caches.delete(cacheName);
                }
            })
        );
    });
}

// Force clear all caches and reload
function forceClearCache() {
    if ('caches' in window) {
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    console.log('Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(function() {
            console.log('All caches cleared');
            // Reload page after clearing cache
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        });
    }
}

// Add cache clear button to console for debugging
console.log('Cache temizlemek için: forceClearCache() fonksiyonunu çalıştırın');
