import fs from 'node:fs/promises';
import path from 'node:path';

export async function scaffoldLocalValidation(root: string): Promise<string[]> {
  await fs.mkdir(path.join(root, 'scripts'), { recursive: true });
  await fs.writeFile(
    path.join(root, 'scripts/validate.mjs'),
    `import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await fs.readFile(path.join(root, 'bootstrap.config.json'), 'utf8'));
const errors = [];
const entries = [...config.workspace.apps.map(entry => ({ ...entry, bucket: 'apps' })), ...config.workspace.packages.map(entry => ({ ...entry, bucket: 'packages' }))];
for (const entry of entries) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.name)) { errors.push('Invalid workspace name'); continue; }
  const directory = path.join(root, entry.bucket, entry.name);
  const required = ['project.json', entry.language === 'rust' ? 'Cargo.toml' : entry.language === 'golang' ? 'go.mod' : entry.language === 'solidity' ? 'src/SampleContract.sol' : 'package.json'];
  for (const file of required) { try { await fs.access(path.join(directory, file)); } catch { errors.push(\`\${entry.name}: missing \${file}\`); } }
}
const skip = new Set(['node_modules', '.git', '.next', '.nuxt', '.output', '.nx', '.yarn', 'target', 'dist', 'coverage']);
async function check(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (skip.has(entry.name) || entry.isSymbolicLink()) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await check(file);
    else if (entry.name === 'package.json') {
      const pkg = JSON.parse(await fs.readFile(file, 'utf8'));
      for (const group of ['dependencies', 'devDependencies']) for (const [name, version] of Object.entries(pkg[group] ?? {})) {
        if (typeof version !== 'string' || (!version.startsWith('workspace:') && !/^\\d+\\.\\d+\\.\\d+(?:-[\\w.-]+)?$/.test(version))) errors.push(\`\${name}: dependency must use an exact version\`);
      }
    }
  }
}
await check(root);
if (errors.length) { console.error(errors.join('\\n')); process.exitCode = 1; } else console.log('Workspace validation passed');
`,
  );
  return ['scripts/validate.mjs'];
}
