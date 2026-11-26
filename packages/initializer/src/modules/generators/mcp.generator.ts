import fs from 'node:fs/promises';
import path from 'node:path';
import type { AIAgent, McpServerId, McpServerJsonEntry } from '../../types/index.js';
import { getVerifiedMcpById } from '../catalog/index.js';

export interface McpJsonFile {
  $schema?: string;
  mcpServers: Record<string, McpServerJsonEntry>;
}

export interface McpInstallResult {
  filesWritten: string[];
  installedMcps: McpServerId[];
  envVarsAdded: string[];
}

export async function generateMcpConfig(
  targetDir: string,
  mcpIds: McpServerId[],
  agents: AIAgent[] = ['opencode', 'antigravity', 'claude', 'codex', 'cursor'],
): Promise<McpInstallResult> {
  const filesWritten: string[] = [];
  const installedMcps: McpServerId[] = [];
  const envVarsSet = new Set<string>();
  const mcpServers: Record<string, McpServerJsonEntry> = {};

  for (const id of mcpIds) {
    const entry = getVerifiedMcpById(id);
    if (!entry) {
      throw new Error(
        `MCP server "${id}" is not in the little.bootstrapper verified safe MCP catalog.`,
      );
    }
    mcpServers[entry.id] = entry.config;
    installedMcps.push(entry.id);
    for (const envVar of entry.requiredEnvVars) {
      envVarsSet.add(envVar);
    }
  }

  // Read every destination before writing so a broken agent config remains recoverable.
  const destinations = ['mcp.json'];
  if (agents.includes('cursor')) destinations.push('.cursor/mcp.json');
  if (agents.includes('claude')) destinations.push('.mcp.json');
  const configs = await Promise.all(
    destinations.map(async (file) => {
      const raw = await fs
        .readFile(path.join(targetDir, file), 'utf8')
        .catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
          return '{}';
        });
      const config = JSON.parse(raw);
      if (
        !config ||
        typeof config !== 'object' ||
        Array.isArray(config) ||
        ('mcpServers' in config &&
          (!config.mcpServers ||
            typeof config.mcpServers !== 'object' ||
            Array.isArray(config.mcpServers)))
      ) {
        throw new Error(`Invalid MCP configuration in ${file}`);
      }
      return config;
    }),
  );
  for (const [index, file] of destinations.entries()) {
    const config = configs[index];
    const servers = { ...configs[0].mcpServers, ...config.mcpServers, ...mcpServers };
    const destination = path.join(targetDir, file);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(
      destination,
      JSON.stringify({ ...config, mcpServers: servers }, null, 2) + '\n',
      'utf8',
    );
    filesWritten.push(file);
  }

  // 4. Append any required MCP env vars into .env.example (never hardcode secrets!)
  const envVarsAdded: string[] = [];
  if (envVarsSet.size > 0) {
    const envExamplePath = path.join(targetDir, '.env.example');
    let envContent = '';
    try {
      envContent = await fs.readFile(envExamplePath, 'utf-8');
    } catch {
      envContent = '# Environment Variables\n';
    }
    const missingLines: string[] = [];
    for (const envVar of envVarsSet) {
      if (!envContent.includes(`${envVar}=`)) {
        missingLines.push(`${envVar}=your_${envVar.toLowerCase()}_here`);
        envVarsAdded.push(envVar);
      }
    }
    if (missingLines.length > 0) {
      const nextContent = `${envContent.trimEnd()}\n\n# Verified MCP Server Environment Variables\n${missingLines.join('\n')}\n`;
      await fs.writeFile(envExamplePath, nextContent, 'utf-8');
      filesWritten.push('.env.example');
    }
  }

  return { filesWritten, installedMcps, envVarsAdded };
}
