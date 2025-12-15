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

// Bağlantı (HTTP REST)
let statusTimer = null;
const DEFAULT_ESP32_IP = "172.20.10.7"; // varsayılan IP
const DEFAULT_HTTP_PORT = 80;
let moistureThreshold = 30; // ESP32'den okunur
let apiBaseOverride = localStorage.getItem('apiBase') || '';
let loggedIn = false;
let connectionErrorCount = 0; // Bağlantı hata sayacı
let lastErrorTime = 0; // Son hata zamanı
const ERROR_LOG_INTERVAL = 30000; // 30 saniyede bir log göster

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupLogin();
    initializeApp();
    startStatusPolling();
    startDataSimulation(); // bağlantı yokken simülasyon devam etsin
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
    
    // Render user plants
    renderUserPlants();
}

// HTTP tabanlı status/komut
function apiBase() {
    // Manuel override varsa onu kullan
    if (apiBaseOverride) return apiBaseOverride;
    
    // Netlify'da mıyız? (HTTPS için proxy kullan)
    const isNetlify = window.location.hostname.includes('netlify.app') || 
                      window.location.hostname.includes('netlify.com') ||
                      window.location.protocol === 'https:';
    
    if (isNetlify) {
        // Netlify Function proxy kullan
        return '/api/esp32';
    }
    
    // Lokal geliştirme: direkt ESP32 IP
    const ip = window.ESP32_IP || DEFAULT_ESP32_IP;
    const port = window.HTTP_PORT || DEFAULT_HTTP_PORT;
    return `http://${ip}:${port}`;
}

async function fetchStatus() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 saniye timeout
        
        const res = await fetch(`${apiBase()}/status`, { 
            method: 'GET', 
            cache: 'no-store',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error('Status HTTP ' + res.status);
        const data = await res.json();
        // ESP JSON alanları: temp, hum, soilAnalog, soilPercent, threshold, pumpForced, pumpState, ledManual, servoAngle
        plantData.temperature = data.temp ?? plantData.temperature;
        plantData.humidity = data.hum ?? plantData.humidity;
        plantData.soilMoisture = data.soilPercent ?? plantData.soilMoisture;
        plantData.waterPumpOn = data.pumpState === 'on';
        moistureThreshold = data.threshold ?? moistureThreshold;
        plantData.ledOn = data.ledManual === true;
        plantData.servoAngle = data.servoAngle ?? 90;
        plantData.status = plantData.waterPumpOn ? 'Sulama' : 'Sağlıklı';
        plantData.connected = true;
        connectionErrorCount = 0; // Başarılı bağlantı - sayacı sıfırla
        updateConnectionStatus();
        updateDashboard();
        updateGauges();
        updatePlantCards();
        updateSidebarPlantStatuses();
        updateLEDStatus();
        updateServoDisplay();
    } catch (err) {
        connectionErrorCount++;
        const now = Date.now();
        const shouldLog = (now - lastErrorTime) > ERROR_LOG_INTERVAL || connectionErrorCount === 1;
        
        if (shouldLog) {
            if (err.name === 'AbortError') {
                console.warn('ESP32 bağlantı zaman aşımı - IP adresini ve ESP32\'nin çalıştığını kontrol edin');
            } else {
                console.warn('Status okunamadı:', err.message);
            }
            lastErrorTime = now;
        }
        // Sessiz mod: Konsol spam'ini durdur, sadece ilk hatada ve 30 saniyede bir log göster
        plantData.connected = false;
        updateConnectionStatus();
    }
}

async function sendCommandToESP32(command, data = {}) {
    const base = apiBase();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 saniye timeout
        
        let url = '';
        if (command === 'water') {
            // start:true -> on, start:false -> off, data.mode==='auto' -> auto
            let state = 'auto';
            if (data.mode === 'auto') {
                state = 'auto';
            } else if (data.start === true) {
                state = 'on';
            } else if (data.start === false) {
                state = 'off';
            }
            url = `${base}/pump?state=${state}`;
        } else if (command === 'threshold') {
            const value = data.value ?? moistureThreshold;
            url = `${base}/threshold?value=${value}`;
        } else if (command === 'led') {
            // mode: auto/on/off, on ise r,g,b parametreleri
            let mode = data.mode || 'auto';
            url = `${base}/led?mode=${mode}`;
            if (mode === 'on' && data.r !== undefined) {
                url += `&r=${data.r}&g=${data.g || 0}&b=${data.b || 0}`;
            }
        } else if (command === 'servo') {
            const angle = data.angle ?? 90;
            url = `${base}/servo?angle=${angle}`;
        }
        
        const res = await fetch(url, { 
            method: 'POST',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error('HTTP ' + res.status);
        showMessage('Komut gönderildi', 'success');
    } catch (err) {
        if (err.name === 'AbortError') {
            console.error('ESP32 bağlantı zaman aşımı');
            showMessage('ESP32\'ye bağlanılamadı. IP adresini ve ESP32\'nin çalıştığını kontrol edin.', 'error');
        } else {
            console.error('Komut hatası:', err.message);
            showMessage('ESP32 komut hatası: ' + err.message, 'error');
        }
    }
}

function startStatusPolling() {
    if (statusTimer) clearInterval(statusTimer);
    fetchStatus(); // hemen bir kez
    statusTimer = setInterval(fetchStatus, 5000); // 5 sn'de bir
}

// --- Login ---
function setupLogin() {
    const overlay = document.getElementById('loginOverlay');
    const form = document.getElementById('loginForm');
    const passInput = document.getElementById('loginPassword');
    const errorBox = document.getElementById('loginError');
    const saved = localStorage.getItem('panelLoggedIn');
    if (saved === 'true') {
        loggedIn = true;
        overlay?.classList.remove('active');
        return;
    }
    overlay?.classList.add('active');
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = passInput?.value || '';
        if (pwd === '123456') {
            loggedIn = true;
            localStorage.setItem('panelLoggedIn', 'true');
            overlay?.classList.remove('active');
            errorBox.style.display = 'none';
        } else {
            errorBox.style.display = 'block';
        }
    });
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
    
    // Add plant form
    setupAddPlantForm();
    
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
                showMessage('Tüm çiçekler sulama komutu gönderildi!', 'success');
            } else {
                showMessage('ESP32 bağlantısı gerekli!', 'error');
            }
        });
    }
    
    if (lightAllBtn) {
        lightAllBtn.addEventListener('click', function() {
            showMessage('LED toplu kontrolü ESP tarafında tanımlı değil.', 'error');
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
    const testConnectionBtn = document.getElementById('testConnection');
    const apiBaseInput = document.getElementById('apiBase');
    const resetDataBtn = document.getElementById('resetData');
    
    // ESP32 IP güncelleme
    if (esp32IPInput) {
        esp32IPInput.addEventListener('change', function() {
            const newIP = this.value;
            if (newIP) {
                window.ESP32_IP = newIP;
                localStorage.setItem('esp32_ip', newIP);
                showMessage(`ESP32 IP adresi güncellendi: ${newIP}`, 'success');
                startStatusPolling();
            }
        });
        const savedIp = localStorage.getItem('esp32_ip');
        if (savedIp) {
            esp32IPInput.value = savedIp;
            window.ESP32_IP = savedIp;
        }
    }

    // API Base (örn: https://tunnel.example.com veya http://192.168.x.x)
    if (apiBaseInput) {
        const savedBase = localStorage.getItem('apiBase');
        if (savedBase) {
            apiBaseInput.value = savedBase;
            apiBaseOverride = savedBase;
        }
        apiBaseInput.addEventListener('change', function() {
            const val = this.value.trim();
            apiBaseOverride = val;
            if (val) localStorage.setItem('apiBase', val);
            else localStorage.removeItem('apiBase');
            showMessage(`API adresi güncellendi: ${val || '(varsayılan IP/port)'}`, 'success');
            startStatusPolling();
        });
    }
    
    // Bağlantı testi
    if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', async function() {
            this.disabled = true;
            this.textContent = 'Test ediliyor...';
            showMessage('ESP32 bağlantısı test ediliyor...', 'success');
            
            try {
                const base = apiBase();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const res = await fetch(`${base}/status`, { 
                    method: 'GET',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (res.ok) {
                    const data = await res.json();
                    showMessage(`✅ ESP32 bağlantısı başarılı! IP: ${base}`, 'success');
                    console.log('ESP32 verisi:', data);
                } else {
                    showMessage(`❌ ESP32 yanıt verdi ama hata: HTTP ${res.status}`, 'error');
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    showMessage('❌ ESP32\'ye bağlanılamadı (zaman aşımı). IP adresini ve ESP32\'nin çalıştığını kontrol edin.', 'error');
                } else {
                    showMessage('❌ ESP32 bağlantı hatası: ' + err.message, 'error');
                }
                console.error('Bağlantı testi hatası:', err);
            } finally {
                this.disabled = false;
                this.textContent = 'Bağlantıyı Test Et';
            }
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
    const increaseSoilBtn = document.getElementById('increaseSoil');
    const decreaseSoilBtn = document.getElementById('decreaseSoil');
    
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

    if (increaseSoilBtn) {
        increaseSoilBtn.addEventListener('click', function() {
            adjustSoilMoisture(5);
        });
    }
    if (decreaseSoilBtn) {
        decreaseSoilBtn.addEventListener('click', function() {
            adjustSoilMoisture(-5);
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
    
    // LED controls
    const turnOnLightBtn = document.getElementById('turnOnLight');
    const turnOffLightBtn = document.getElementById('turnOffLight');
    const ledAutoBtn = document.getElementById('ledAuto');
    
    if (turnOnLightBtn) {
        turnOnLightBtn.addEventListener('click', function() {
            if (plantData.connected) {
                sendCommandToESP32('led', { mode: 'on', r: 0, g: 100, b: 0 });
                showMessage('LED açıldı (Yeşil)', 'success');
            } else {
                showMessage('ESP32 bağlantısı gerekli!', 'error');
            }
        });
    }
    
    if (turnOffLightBtn) {
        turnOffLightBtn.addEventListener('click', function() {
            if (plantData.connected) {
                sendCommandToESP32('led', { mode: 'off' });
                showMessage('LED kapatıldı', 'success');
            } else {
                showMessage('ESP32 bağlantısı gerekli!', 'error');
            }
        });
    }
    
    if (ledAutoBtn) {
        ledAutoBtn.addEventListener('click', function() {
            if (plantData.connected) {
                sendCommandToESP32('led', { mode: 'auto' });
                showMessage('LED otomatik moda alındı', 'success');
            } else {
                showMessage('ESP32 bağlantısı gerekli!', 'error');
            }
        });
    }
    
    // Servo controls
    const servo0Btn = document.getElementById('servo0');
    const servo90Btn = document.getElementById('servo90');
    const servo180Btn = document.getElementById('servo180');
    const servoSlider = document.getElementById('servoSlider');
    const servoAngleDisplay = document.getElementById('servoAngleDisplay');
    
    if (servo0Btn) {
        servo0Btn.addEventListener('click', function() {
            if (plantData.connected) {
                sendCommandToESP32('servo', { angle: 0 });
                if (servoAngleDisplay) servoAngleDisplay.textContent = '0°';
                if (servoSlider) servoSlider.value = 0;
            } else {
                showMessage('ESP32 bağlantısı gerekli!', 'error');
            }
        });
    }
    
    if (servo90Btn) {
        servo90Btn.addEventListener('click', function() {
            if (plantData.connected) {
                sendCommandToESP32('servo', { angle: 90 });
                if (servoAngleDisplay) servoAngleDisplay.textContent = '90°';
                if (servoSlider) servoSlider.value = 90;
            } else {
                showMessage('ESP32 bağlantısı gerekli!', 'error');
            }
        });
    }
    
    if (servo180Btn) {
        servo180Btn.addEventListener('click', function() {
            if (plantData.connected) {
                sendCommandToESP32('servo', { angle: 180 });
                if (servoAngleDisplay) servoAngleDisplay.textContent = '180°';
                if (servoSlider) servoSlider.value = 180;
            } else {
                showMessage('ESP32 bağlantısı gerekli!', 'error');
            }
        });
    }
    
    if (servoSlider) {
        servoSlider.addEventListener('input', function() {
            const angle = parseInt(this.value);
            if (servoAngleDisplay) servoAngleDisplay.textContent = angle + '°';
        });
        servoSlider.addEventListener('change', function() {
            const angle = parseInt(this.value);
            if (plantData.connected) {
                sendCommandToESP32('servo', { angle: angle });
            } else {
                showMessage('ESP32 bağlantısı gerekli!', 'error');
            }
        });
    }

    // Plant control cards soil +/- (class based)
    document.querySelectorAll('.soil-inc').forEach(btn => {
        btn.addEventListener('click', function() {
            adjustSoilMoisture(5);
        });
    });
    document.querySelectorAll('.soil-dec').forEach(btn => {
        btn.addEventListener('click', function() {
            adjustSoilMoisture(-5);
        });
    });
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
    // ESP32 tarafında auto için state=auto gönder
    sendCommandToESP32('water', { mode: 'auto' });
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

function adjustSoilMoisture(change) {
    plantData.soilMoisture = Math.max(0, Math.min(100, plantData.soilMoisture + change));
    updateDashboard();
    updateGauges();
    showMessage('Toprak nemi ayarlandı: ' + plantData.soilMoisture + '%', 'success');
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

function updateLEDStatus() {
    const ledStatus = document.getElementById('ledStatus');
    if (ledStatus) {
        if (plantData.ledOn) {
            ledStatus.textContent = 'Durum: Manuel (Açık)';
        } else {
            ledStatus.textContent = 'Durum: Otomatik (Pompa durumuna göre)';
        }
    }
}

function updateServoDisplay() {
    const servoAngleDisplay = document.getElementById('servoAngleDisplay');
    const servoSlider = document.getElementById('servoSlider');
    if (servoAngleDisplay) {
        servoAngleDisplay.textContent = plantData.servoAngle + '°';
    }
    if (servoSlider) {
        servoSlider.value = plantData.servoAngle;
        const sliderValue = servoSlider.parentElement.querySelector('.servo-slider-value');
        if (sliderValue) {
            sliderValue.textContent = plantData.servoAngle + '°';
        }
    }
}

function startDataSimulation() {
    setInterval(() => {
        if (plantData.connected) return; // gerçek bağlantı varsa simülasyon yapma
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
    console.log('💡 Çözüm: start-server.bat dosyasını çalıştırın veya Python -m http.server 8000 kullanın');
    
    // Kullanıcıya görünür uyarı göster
    setTimeout(() => {
        showMessage('⚠️ PWA özellikleri için HTTP sunucu gereklidir. start-server.bat dosyasını çalıştırın.', 'error');
    }, 2000);
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

// --- Çiçek Yönetimi ---
function getPlants() {
    const plantsJson = localStorage.getItem('userPlants');
    return plantsJson ? JSON.parse(plantsJson) : [];
}

function savePlants(plants) {
    localStorage.setItem('userPlants', JSON.stringify(plants));
}

function setupAddPlantForm() {
    const form = document.getElementById('addPlantForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('plantName').value.trim();
        const type = document.getElementById('plantType').value;
        const frequency = document.getElementById('wateringFrequency').value;
        const threshold = parseInt(document.getElementById('moistureThreshold').value) || 30;
        
        if (!name) {
            showMessage('Bitki adı gereklidir!', 'error');
            return;
        }
        
        // Yeni çiçek oluştur
        const newPlant = {
            id: Date.now().toString(),
            name: name,
            type: type,
            frequency: frequency,
            threshold: threshold,
            createdAt: new Date().toISOString(),
            status: 'healthy',
            soilMoisture: 50,
            temperature: 22,
            humidity: 60
        };
        
        // Çiçekleri kaydet
        const plants = getPlants();
        plants.push(newPlant);
        savePlants(plants);
        
        showMessage(`${name} başarıyla eklendi!`, 'success');
        
        // Formu temizle
        form.reset();
        document.getElementById('moistureThreshold').value = 30;
        
        // Dashboard'a dön ve çiçekleri güncelle
        setTimeout(() => {
            showPage('dashboard');
            renderUserPlants();
        }, 1000);
    });
}

function renderUserPlants() {
    const plants = getPlants();
    const plantsGrid = document.querySelector('.plants-grid');
    
    if (!plantsGrid) return;
    
    // Mevcut çiçek kartlarını temizle (sadece kullanıcı çiçekleri)
    const existingCards = plantsGrid.querySelectorAll('.user-plant-card');
    existingCards.forEach(card => card.remove());
    
    // Her çiçek için kart oluştur
    plants.forEach(plant => {
        const card = document.createElement('div');
        card.className = 'plant-card user-plant-card';
        card.setAttribute('data-plant-id', plant.id);
        
        const statusClass = plant.status === 'healthy' ? 'healthy' : 
                           plant.status === 'warning' ? 'warning' : 'error';
        const statusText = plant.status === 'healthy' ? 'Sağlıklı' :
                          plant.status === 'warning' ? 'Dikkat' : 'Sulama Gerekli';
        
        card.innerHTML = `
            <div class="plant-image">
                <i class="fas fa-seedling"></i>
            </div>
            <div class="plant-info">
                <h3>${plant.name}</h3>
                <div class="plant-status">
                    <span class="status-dot ${statusClass}"></span>
                    <span class="status-text">${statusText}</span>
                </div>
                <div class="plant-data">
                    <div class="data-item">
                        <span class="data-label">Nem</span>
                        <span class="data-value">${plant.soilMoisture}%</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">Sıcaklık</span>
                        <span class="data-value">${plant.temperature}°C</span>
                    </div>
                </div>
                <div class="plant-actions">
                    <button class="btn-icon delete-plant" data-plant-id="${plant.id}" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Sil butonu
        const deleteBtn = card.querySelector('.delete-plant');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm(`${plant.name} çiçeğini silmek istediğinizden emin misiniz?`)) {
                    deletePlant(plant.id);
                }
            });
        }
        
        // Kart tıklama - detay sayfası (ileride eklenebilir)
        card.addEventListener('click', function() {
            showMessage(`${plant.name} çiçeği seçildi`, 'success');
        });
        
        // "Yeni Bitki Ekle" kartından önce ekle
        const addCard = plantsGrid.querySelector('.add-plant');
        if (addCard) {
            plantsGrid.insertBefore(card, addCard);
        } else {
            plantsGrid.appendChild(card);
        }
    });
    
    // Sil butonları için event listener'ları ekle
    setupDeleteButtons();
}

function deletePlant(plantId) {
    const plants = getPlants();
    const filtered = plants.filter(p => p.id !== plantId);
    savePlants(filtered);
    showMessage('Çiçek silindi', 'success');
    renderUserPlants();
}

function setupDeleteButtons() {
    document.querySelectorAll('.delete-plant').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const plantId = this.getAttribute('data-plant-id');
            const plants = getPlants();
            const plant = plants.find(p => p.id === plantId);
            if (plant && confirm(`${plant.name} çiçeğini silmek istediğinizden emin misiniz?`)) {
                deletePlant(plantId);
            }
        });
    });
}

// Sayfa yüklendiğinde çiçekleri göster
document.addEventListener('DOMContentLoaded', function() {
    renderUserPlants();
});
