import React, { useEffect, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  Alert,
  Badge,
  BenderCard,
  MarkdownPanel,
  MultiSelect,
  Select,
  Spinner,
  StatusFooter,
  SummaryTable,
} from '@little-bootstrapper/ui-cli';
import type { McpServerId } from '../../types/index.js';
import {
  AI_AGENTS,
  DEFAULT_VERIFIED_MCPS,
  VERIFIED_MCPS,
  getVerifiedMcpById,
  recommendMcpsForProject,
} from '../../modules/catalog/index.js';
import { generateMcpConfig, loadBootstrapConfig } from '../../modules/generators/index.js';
import { detectCurrentSetup } from '../../modules/workflows/index.js';

export interface McpCatalogScreenProps {
  cwd: string;
  onBackToMenu: () => void;
  onCompleted: () => void;
}

export const McpCatalogScreen: React.FC<McpCatalogScreenProps> = ({
  cwd,
  onBackToMenu,
  onCompleted,
}) => {
  const { exit } = useApp();
  const [existingMcps, setExistingMcps] = useState<McpServerId[] | null>(null);
  const [result, setResult] = useState<{
    files: string[];
    installed: McpServerId[];
    envVars: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([detectCurrentSetup(cwd), loadBootstrapConfig(cwd)])
      .then(([detected, cfg]) => {
        if (cancelled) return;
        const validExisting = detected.mcpsConfigured.filter((id): id is McpServerId =>
          VERIFIED_MCPS.some((m) => m.id === id),
        );
        const recommended = cfg ? recommendMcpsForProject(cfg) : DEFAULT_VERIFIED_MCPS;
        setExistingMcps(Array.from(new Set([...validExisting, ...recommended])));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [cwd]);

  useEffect(() => {
    if (!result) return;
    onCompleted();
    const timer = setTimeout(() => exit(), 80);
    return () => clearTimeout(timer);
  }, [result, exit, onCompleted]);

  useInput((_input, key) => {
    if (error && key.escape) onBackToMenu();
  });

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Alert variant="error" title="MCP Catalog Error">
          {error}
        </Alert>
        <Select
          options={[{ label: '↩️  Back to Main Menu', value: 'back' }]}
          onChange={onBackToMenu}
        />
        <StatusFooter context="MCPS" hints={[{ key: 'Esc/Enter', action: 'Back to menu' }]} />
      </Box>
    );
  }

  if (!existingMcps) {
    return (
      <Box flexDirection="column">
        <Spinner label="Loading little.bootstrapper Verified Safe MCP Marketplace..." type="dots" />
        <StatusFooter context="MCPS" hints={[{ key: 'Ctrl+C', action: 'Cancel' }]} />
      </Box>
    );
  }

  if (result) {
    const rows = result.installed.map((id) => {
      const m = getVerifiedMcpById(id);
      return {
        id,
        category: m?.category ?? 'MCP',
        publisher: m?.publisher ?? 'Verified',
        transport: m?.transport ?? 'stdio',
        env: m?.requiredEnvVars.join(', ') || 'none',
      };
    });
    const markdown = [
      '# Verified MCP Installation Report',
      `- Synced config files: ${result.files.map((f) => `\`${f}\``).join(', ')}`,
      result.envVars.length > 0
        ? `- Set placeholder keys in \`.env\`: ${result.envVars.join(', ')}`
        : '- Zero credentials required — ready to use immediately!',
    ].join('\n');

    return (
      <Box flexDirection="column" gap={1}>
        <BenderCard
          message={`Installed ${result.installed.length} Verified Safe MCP(s) into mcp.json!`}
        />
        <SummaryTable
          title="Installed Verified Safe MCP Servers"
          columns={[
            { key: 'id', header: 'MCP Server', color: 'cyan' },
            { key: 'category', header: 'Category', color: 'magenta' },
            { key: 'publisher', header: 'Publisher', color: 'green' },
            { key: 'transport', header: 'Transport', color: 'yellow' },
            { key: 'env', header: 'Env Vars', color: 'white' },
          ]}
          rows={rows}
        />
        <MarkdownPanel title="Configuration Notes" markdown={markdown} />
        <StatusFooter
          context="DONE"
          hints={[{ key: 'Exit', action: 'Command complete — returned to shell' }]}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box gap={1} alignItems="center">
        <Badge color="cyan">VERIFIED MCP MARKETPLACE</Badge>
        <Text bold color="cyan">
          Browse &amp; Search ({VERIFIED_MCPS.length} audited servers)
        </Text>
      </Box>
      <Text dimColor>Stack-recommended MCPs are pre-selected.</Text>
      <Box marginTop={1}>
        <MultiSelect
          searchable
          searchPlaceholder="Press / to search MCPs (nx, nextjs, postgres, stripe, playwright)..."
          options={VERIFIED_MCPS.map((m) => ({
            label: `[${m.category}] ${m.name} (${m.publisher})`,
            value: m.id,
            category: m.category,
            hint: m.description,
          }))}
          initialSelected={existingMcps}
          minSelected={1}
          onBack={onBackToMenu}
          onSubmit={async (selected) => {
            try {
              const cfg = await loadBootstrapConfig(cwd);
              const agents = cfg?.stack.agents ?? AI_AGENTS.map((a) => a.id);
              const res = await generateMcpConfig(cwd, selected, agents);
              if (cfg) {
                cfg.stack.mcps = Array.from(
                  new Set([...(cfg.stack.mcps ?? []), ...res.installedMcps]),
                );
                await fs.writeFile(
                  path.join(cwd, 'bootstrap.config.json'),
                  `${JSON.stringify(cfg, null, 2)}\n`,
                  'utf-8',
                );
              }
              setResult({
                files: res.filesWritten,
                installed: res.installedMcps,
                envVars: res.envVarsAdded,
              });
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err));
            }
          }}
        />
      </Box>
      <StatusFooter
        context="MCPS"
        hints={[
          { key: '↑/↓', action: 'Move' },
          { key: 'Space', action: 'Toggle' },
          { key: '/', action: 'Search' },
          { key: 'Enter', action: 'Install & Exit' },
          { key: 'Esc', action: 'Back to menu' },
        ]}
      />
    </Box>
  );
};
