import fs from 'node:fs/promises';
import path from 'node:path';
import type { VersionAuditItem } from '../../types/index.js';
import { AUDITED_VERSIONS, getVulnerabilityAdvisory, isVersionPinned } from '../catalog/index.js';

async function findPackageJsonFiles(rootDir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string, depth: number) {
    if (depth > 3) return;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === '.next' ||
        entry.name === 'dist'
      ) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, depth + 1);
      } else if (entry.isFile() && entry.name === 'package.json') {
        results.push(fullPath);
      }
    }
  }

  await walk(rootDir, 0);
  return results;
}

export async function auditProjectVersions(targetDir: string): Promise<VersionAuditItem[]> {
  const pkgFiles = await findPackageJsonFiles(targetDir);
  const items: VersionAuditItem[] = [];

  for (const file of pkgFiles) {
    const raw = await fs.readFile(file, 'utf-8');
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    for (const [pkgName, currentVersion] of Object.entries(allDeps)) {
      if (pkgName.startsWith('@little-bootstrapper/')) continue;

      const audited = AUDITED_VERSIONS[pkgName];
      const pinned = isVersionPinned(currentVersion);
      const advisory = getVulnerabilityAdvisory(pkgName, currentVersion);

      if (!audited) {
        items.push({
          file: path.relative(targetDir, file),
          packageName: pkgName,
          currentVersion,
          recommendedVersion: currentVersion.replace(/^[~^]/, ''),
          isPinned: pinned,
          needsUpdate: !pinned || Boolean(advisory),
          status: advisory ? 'vulnerable' : pinned ? 'unknown' : 'unpinned',
          ...(advisory ? { advisory } : {}),
        });
        continue;
      }

      const needsUpdate = currentVersion !== audited.version;
      const status: VersionAuditItem['status'] = advisory
        ? 'vulnerable'
        : !pinned
          ? 'unpinned'
          : needsUpdate
            ? 'outdated'
            : 'ok';

      items.push({
        file: path.relative(targetDir, file),
        packageName: pkgName,
        currentVersion,
        recommendedVersion: audited.version,
        isPinned: pinned,
        needsUpdate,
        status,
        ...(advisory ? { advisory } : {}),
      });
    }
  }

  return items;
}

export async function applyAuditedVersionUpdates(targetDir: string): Promise<number> {
  const pkgFiles = await findPackageJsonFiles(targetDir);
  let updatedCount = 0;

  for (const file of pkgFiles) {
    const raw = await fs.readFile(file, 'utf-8');
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    let changed = false;

    for (const section of ['dependencies', 'devDependencies'] as const) {
      const deps = pkg[section];
      if (!deps) continue;
      for (const [name, current] of Object.entries(deps)) {
        if (name.startsWith('@little-bootstrapper/')) continue;
        const audited = AUDITED_VERSIONS[name];
        if (audited && current !== audited.version) {
          deps[name] = audited.version;
          changed = true;
          updatedCount++;
        } else if (!audited && !isVersionPinned(current)) {
          deps[name] = current.replace(/^[~^]/, '');
          changed = true;
          updatedCount++;
        }
      }
    }

    if (changed) {
      await fs.writeFile(file, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8');
    }
  }

  return updatedCount;
}
