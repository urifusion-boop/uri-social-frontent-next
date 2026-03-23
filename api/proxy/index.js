const https = require('https');
const http = require('http');

module.exports = async function (context, req) {
  let path = context.bindingData.path || "";

  // Strip leading api/ or /api/ if present to avoid double /api prefix
  path = path.replace(/^\/?api\//, "");
  const backendUrl = `https://20.164.0.168/${path}`;

  context.log(`Proxying request to: ${backendUrl}`);

  // Get the appropriate protocol handler
  const protocol = backendUrl.startsWith('https') ? https : http;

  return new Promise((resolve) => {
    // Prepare request body
    const bodyString = req.body ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : '';

    // Forward all relevant headers
    const headers = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };

    // Forward Authorization header if present (case-insensitive)
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const options = {
      method: req.method,
      headers: headers,
      // Allow self-signed certificates
      rejectUnauthorized: false,
    };

    // Add Content-Length if there's a body
    if (bodyString) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const proxyReq = protocol.request(backendUrl, options, (proxyRes) => {
      let body = '';

      proxyRes.on('data', (chunk) => {
        body += chunk;
      });

      proxyRes.on('end', () => {
        context.res = {
          status: proxyRes.statusCode,
          headers: {
            'content-type': proxyRes.headers['content-type'] || 'application/json',
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'access-control-allow-headers': 'Content-Type, Authorization',
          },
          body: body,
        };
        resolve();
      });
    });

    proxyReq.on('error', (error) => {
      context.log.error('Proxy error:', error);
      context.res = {
        status: 500,
        body: JSON.stringify({ error: 'Proxy request failed', details: error.message }),
      };
      resolve();
    });

    // Forward the request body if present
    if (bodyString) {
      proxyReq.write(bodyString);
    }

    proxyReq.end();
  });
};
