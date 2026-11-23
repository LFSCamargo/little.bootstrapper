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

  // Merge cleanly if mcp.json already exists so user-approved servers aren't accidentally wiped
  const rootMcpPath = path.join(targetDir, 'mcp.json');
  let existingServers: Record<string, McpServerJsonEntry> = {};
  try {
    const existingRaw = await fs.readFile(rootMcpPath, 'utf-8');
    const parsed = JSON.parse(existingRaw) as Partial<McpJsonFile>;
    if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
      existingServers = parsed.mcpServers;
    }
  } catch {
    // No existing mcp.json yet
  }

  const payload: McpJsonFile = {
    mcpServers: {
      ...existingServers,
      ...mcpServers,
    },
  };
  const serialized = `${JSON.stringify(payload, null, 2)}\n`;

  // 1. Canonical project root mcp.json
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(rootMcpPath, serialized, 'utf-8');
  filesWritten.push('mcp.json');

  const agentSet = new Set(agents);

  // 2. Cursor expects .cursor/mcp.json
  if (agentSet.has('cursor')) {
    const cursorPath = path.join(targetDir, '.cursor', 'mcp.json');
    await fs.mkdir(path.dirname(cursorPath), { recursive: true });
    await fs.writeFile(cursorPath, serialized, 'utf-8');
    filesWritten.push('.cursor/mcp.json');
  }

  // 3. Claude Code reads .mcp.json at repo root
  if (agentSet.has('claude')) {
    const claudeMcpPath = path.join(targetDir, '.mcp.json');
    await fs.writeFile(claudeMcpPath, serialized, 'utf-8');
    filesWritten.push('.mcp.json');
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
