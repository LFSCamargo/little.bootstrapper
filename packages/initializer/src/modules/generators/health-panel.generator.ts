import fs from 'node:fs/promises';
import path from 'node:path';
export async function scaffoldWebHealthPanel(
  dir: string,
  contracts: string | null,
  next = false,
): Promise<string[]> {
  await fs.writeFile(
    path.join(dir, 'src/app.tsx'),
    `${next ? "'use client';" : ''}
import React, { useState } from 'react';
${contracts ? `import { HealthResponseSchema } from '${contracts}';` : ''}
import { WEB_APP_INFO } from './index${next ? '' : '.js'}';

export function App() {
  const [status, setStatus] = useState('Not connected');
  const [loading, setLoading] = useState(false);
  async function checkHealth() {
    setLoading(true);
    try {
      const response = await fetch(WEB_APP_INFO.healthEndpoint);
      if (!response.ok) throw new Error(\`API returned HTTP \${response.status}\`);
      const payload: unknown = await response.json();
      ${
        contracts
          ? `const parsed = HealthResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error('API response does not match the health contract');
      setStatus(\`\${parsed.data.service}: \${parsed.data.status}\`);`
          : `if (!payload || typeof payload !== 'object' || !('status' in payload) || typeof payload.status !== 'string' || !('service' in payload) || typeof payload.service !== 'string') throw new Error('Invalid health response');
      setStatus(\`\${payload.service}: \${payload.status}\`);`
      }
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Cannot reach API'); }
    finally { setLoading(false); }
  }
  return <main><h1>{WEB_APP_INFO.project}</h1><p>Starter application</p><output>{status}</output><button type="button" disabled={loading} onClick={() => { void checkHealth(); }}>{loading ? 'Connecting…' : 'Check API health'}</button></main>;
}
\n`,
  );
  await fs.writeFile(
    path.join(dir, 'src/__tests__/health-panel.test.tsx'),
    `import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, act, type ReactTestRenderer } from 'react-test-renderer';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { App } from '../app.js';
afterEach(() => { vi.unstubAllGlobals(); });

async function clickWith(response: Response | Error) {
  const fetcher = response instanceof Error ? vi.fn().mockRejectedValue(response) : vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetcher);
  let tree!: ReactTestRenderer;
  await act(async () => { tree = create(<App />); });
  expect(tree.root.findByType('output').children.join('')).toBe('Not connected');
  await act(async () => { const click: unknown = tree.root.findByType('button').props.onClick; if (typeof click !== 'function') throw new Error('Missing click handler'); click(); });
  expect(fetcher).toHaveBeenCalledWith('/health');
  expect(tree.root.findByType('button').props.disabled).toBe(false);
  const status = tree.root.findByType('output').children.join('');
  await act(async () => { tree.unmount(); });
  return status;
}

describe('API health panel', () => {
  it('shows an API response matching the shared wire contract', async () => {
    const json = { status: 'ok', service: 'api', version: '0.1.0', timestamp: '2026-01-01T00:00:00Z', uptimeSeconds: 0 };
    expect(await clickWith(new Response(JSON.stringify(json)))).toBe('api: ok');
  });
  it('reports network failures', async () => { expect(await clickWith(new Error('Offline'))).toBe('Offline'); });
  it('reports non-200 responses', async () => { expect(await clickWith(new Response('{}', { status: 503 }))).toContain('503'); });
  it('handles unknown network failures', async () => { vi.stubGlobal('fetch', vi.fn().mockRejectedValue(null)); let tree!: ReactTestRenderer; await act(async () => { tree = create(<App />); }); await act(async () => { const click: unknown = tree.root.findByType('button').props.onClick; if (typeof click === 'function') click(); }); expect(tree.root.findByType('output').children.join('')).toBe('Cannot reach API'); tree.unmount(); });
  it('rejects invalid payloads', async () => { expect(await clickWith(new Response('{}'))).toContain('${contracts ? 'does not match' : 'Invalid health'}'); });
});\n`,
  );
  return ['src/app.tsx', 'src/__tests__/health-panel.test.tsx'];
}
