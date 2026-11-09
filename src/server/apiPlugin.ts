import type { Plugin } from 'vite';
import { handleApiRequest } from './api.ts';

export function createApiPlugin(): Plugin {
  return {
    name: 'automanager-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          handleApiRequest(req, res, next);
        } else {
          next();
        }
      });
    },
  };
}
