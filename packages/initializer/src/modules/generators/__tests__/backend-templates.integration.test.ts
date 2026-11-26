import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { backendConfig } from './fixtures/backend-config.js';
import { generateProject } from '../index.js';

describe('framework-specific native scaffolding', () => {
  it.each(['axum', 'hyper', 'chi', 'gin', 'echo', 'fiber'] as const)(
    'generates runnable %s templates with framework dependencies and tests',
    async (framework) => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), `backend-${framework}-`));
      try {
        const output = await generateProject(dir, backendConfig(framework));
        const nx = JSON.parse(await fs.readFile(path.join(dir, 'nx.json'), 'utf-8'));
        expect(nx.targetDefaults.dev.dependsOn).toEqual(['^build']);
        expect(nx.targetDefaults.start.dependsOn).toEqual(['build']);
        const rust = framework === 'axum' || framework === 'hyper';
        const source = await fs.readFile(
          path.join(
            dir,
            'apps/api',
            rust ? 'src/adapters/http.rs' : 'internal/adapters/http/server.go',
          ),
          'utf-8',
        );
        const manifest = await fs.readFile(
          path.join(dir, 'apps/api', rust ? 'Cargo.toml' : 'go.mod'),
          'utf-8',
        );
        if (rust) {
          expect(manifest).toContain('name = "chatify-stack-api"');
          expect(manifest).toContain(`${framework} =`);
          expect(manifest).toContain(
            'shared_contracts = { package = "chatify-stack-contracts", path = "../../packages/contracts" }',
          );
          expect(source).toContain('use shared_contracts::HealthResponse');
          expect(source).toContain(
            framework === 'axum' ? 'axum::serve' : 'hyper::server::conn::http1',
          );
          expect(
            await fs.readFile(path.join(dir, 'packages/contracts/src/lib.rs'), 'utf-8'),
          ).toContain('pub struct HealthResponse');
          await expect(
            fs.access(path.join(dir, 'packages/contracts/src/health.contract.ts')),
          ).rejects.toThrow();
          expect(
            await fs.readFile(path.join(dir, 'packages/contracts/project.json'), 'utf-8'),
          ).not.toContain('build-types');
        } else {
          const modules = {
            chi: 'github.com/go-chi/chi/v5',
            gin: 'github.com/gin-gonic/gin',
            echo: 'github.com/labstack/echo/v4',
            fiber: 'github.com/gofiber/fiber/v2',
          };
          expect(manifest).toContain(modules[framework]);
          expect(source).toContain(`"${modules[framework]}"`);
          expect(
            await fs.readFile(
              path.join(dir, 'apps/api/internal/adapters/http/server_test.go'),
              'utf-8',
            ),
          ).toContain('TestHealth');
        }
        expect(output.filesCreated).toContain('apps/web/index.html');
        expect(output.filesCreated).toContain('apps/web/src/main.tsx');
        expect(await fs.readFile(path.join(dir, 'apps/web/src/app.tsx'), 'utf-8')).toContain(
          'Check API health',
        );
        expect(await fs.readFile(path.join(dir, 'apps/web/vite.config.ts'), 'utf-8')).toContain(
          'http://127.0.0.1:4000',
        );
      } finally {
        await fs.rm(dir, { recursive: true, force: true });
      }
    },
  );
});
