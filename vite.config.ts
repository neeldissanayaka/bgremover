import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function guestCreditPlugin(): Plugin {
  const store = new Map<string, { date: string; used: number }>();
  const DAILY_LIMIT = 3;

  const handleGuestCredit = (req: any, res: any, next: () => void) => {
    if (!req.url || !req.url.startsWith('/api/guest-credit')) {
      return next();
    }

    const date = new Date().toISOString().slice(0, 10);
    const xff = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(xff) ? xff[0] : (xff || req.headers['x-real-ip'] || req.socket.remoteAddress || 'guest-ip')).toString().split(',')[0].trim();

    if (req.method === 'GET') {
      const entry = store.get(ip);
      const used = entry && entry.date === date ? entry.used : 0;
      const remaining = Math.max(0, DAILY_LIMIT - used);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ used, remaining, total: DAILY_LIMIT }));
      return;
    }

    if (req.method === 'POST') {
      const entry = store.get(ip);
      let used = entry && entry.date === date ? entry.used : 0;
      if (used >= DAILY_LIMIT) {
        res.statusCode = 429;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ allowed: false, used: DAILY_LIMIT, remaining: 0, total: DAILY_LIMIT }));
        return;
      }
      used += 1;
      store.set(ip, { date, used });
      const remaining = Math.max(0, DAILY_LIMIT - used);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ allowed: true, used, remaining, total: DAILY_LIMIT }));
      return;
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  };

  return {
    name: 'guest-credit-api',
    configureServer(server) {
      server.middlewares.use(handleGuestCredit);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleGuestCredit);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), guestCreditPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            'vendor-imgly': ['@imgly/background-removal'],
            'vendor-canvas': ['canvas-confetti'],
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

