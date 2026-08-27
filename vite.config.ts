import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

function aiCorsProxyPlugin(): Plugin {
  return {
    name: 'ai-cors-proxy',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url || '';
        const match = url.match(/^\/api\/ai-proxy\/(https?)\/([^\/\?]+)(.*)$/);
        if (!match) return next();

        const [_, proto, host, rest] = match;
        const targetUrl = `${proto}://${host}${rest}`;

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(req.headers)) {
            if (k.toLowerCase() === 'host') {
              headers['host'] = host;
            } else if (k.toLowerCase() !== 'content-length' && typeof v === 'string') {
              headers[k] = v;
            }
          }

          let body: any = undefined;
          if (req.method === 'POST' || req.method === 'PUT') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            body = Buffer.concat(chunks);
          }

          const fetchRes = await fetch(targetUrl, {
            method: req.method,
            headers,
            body
          });

          res.statusCode = fetchRes.status;
          fetchRes.headers.forEach((val, key) => {
            if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'transfer-encoding') {
              res.setHeader(key, val);
            }
          });
          res.setHeader('Access-Control-Allow-Origin', '*');

          if (fetchRes.body) {
            const reader = fetchRes.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
          }
          res.end();
        } catch (err: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'AI Proxy Error' }));
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), aiCorsProxyPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true, // Allows 000.localhost, 000.local, custom subdomains
    cors: true,
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  }
});
