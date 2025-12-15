// Netlify Function: ESP32 HTTP Proxy
// Bu fonksiyon HTTPS üzerinden gelen istekleri ESP32'nin HTTP endpoint'ine yönlendirir

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS request için CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  try {
    // ESP32 IP adresi - Environment variable'dan veya default değer
    const ESP32_IP = process.env.ESP32_IP || '172.20.10.7';
    const ESP32_PORT = process.env.ESP32_PORT || '80';
    const ESP32_BASE = `http://${ESP32_IP}:${ESP32_PORT}`;

    // URL path'i al
    // Redirect ile gelen path: /.netlify/functions/esp32-proxy/status -> /status
    let path = event.path || '/status';
    
    // Function path'ini temizle
    if (path.includes('/esp32-proxy')) {
      // /.netlify/functions/esp32-proxy/status -> /status
      path = path.split('/esp32-proxy')[1] || '/status';
    } else if (path.startsWith('/.netlify/functions/esp32-proxy')) {
      path = path.replace('/.netlify/functions/esp32-proxy', '') || '/status';
    }
    
    // Path'i normalize et (başında / olmalı, boşsa /status)
    if (!path || path === '/') {
      path = '/status';
    }
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Query string'i al
    const queryString = event.queryStringParameters 
      ? '?' + new URLSearchParams(event.queryStringParameters).toString()
      : '';

    // ESP32 endpoint URL'i oluştur
    const esp32Url = `${ESP32_BASE}${path}${queryString}`;

    console.log(`Proxying ${event.httpMethod} request to: ${esp32Url}`);

    // ESP32'ye istek gönder
    const response = await fetch(esp32Url, {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json'
      },
      // Body varsa gönder
      body: event.body ? event.body : undefined
    });

    // Response'u al
    const contentType = response.headers.get('content-type') || 'text/plain';
    let data;
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Başarılı response döndür
    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': contentType
      },
      body: typeof data === 'string' ? data : JSON.stringify(data)
    };

  } catch (error) {
    console.error('Proxy error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Proxy hatası',
        message: error.message
      })
    };
  }
};

