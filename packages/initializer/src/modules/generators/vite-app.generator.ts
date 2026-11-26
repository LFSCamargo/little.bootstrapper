import fs from 'node:fs/promises';
import path from 'node:path';
import { scaffoldWebHealthPanel } from './health-panel.generator.js';

export async function scaffoldViteEntry(
  dir: string,
  project: string,
  contracts: string | null,
): Promise<string[]> {
  await fs.writeFile(
    path.join(dir, 'index.html'),
    `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${project}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n`,
  );
  await fs.writeFile(
    path.join(dir, 'vite.config.ts'),
    `import { defineConfig } from 'vite';
export default defineConfig({ server: { proxy: { '/health': process.env.API_URL ?? 'http://127.0.0.1:4000' } } });\n`,
  );
  const healthFiles = await scaffoldWebHealthPanel(dir, contracts);
  await fs.writeFile(
    path.join(dir, 'vitest.config.ts'),
    "export { default } from '../../vitest.config.js';\n",
  );
  await fs.writeFile(
    path.join(dir, 'src/main.tsx'),
    `import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app.js';
const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);\n`,
  );
  return ['index.html', 'vite.config.ts', 'vitest.config.ts', 'src/main.tsx', ...healthFiles];
}
