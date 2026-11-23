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
import type { MarketplaceRuleId } from '../../types/index.js';
import { MARKETPLACE_RULES, getMarketplaceRuleById } from '../../modules/catalog/index.js';
import { installMarketplaceRules, loadBootstrapConfig } from '../../modules/generators/index.js';
import { detectCurrentSetup } from '../../modules/workflows/index.js';

export interface RulesMarketplaceScreenProps {
  cwd: string;
  onBackToMenu: () => void;
  onCompleted: () => void;
}

export const RulesMarketplaceScreen: React.FC<RulesMarketplaceScreenProps> = ({
  cwd,
  onBackToMenu,
  onCompleted,
}) => {
  const { exit } = useApp();
  const [installedRules, setInstalledRules] = useState<MarketplaceRuleId[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<MarketplaceRuleId[]>([]);
  const [doneFiles, setDoneFiles] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void detectCurrentSetup(cwd)
      .then((detected) => {
        if (cancelled) return;
        const valid = detected.rulesPresent.filter((id): id is MarketplaceRuleId =>
          MARKETPLACE_RULES.some((r) => r.id === id),
        );
        setInstalledRules(valid);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [cwd]);

  // Auto-exit terminal cleanly once rule installation completes and summary renders
  useEffect(() => {
    if (!doneFiles) return;
    onCompleted();
    const timer = setTimeout(() => exit(), 80);
    return () => clearTimeout(timer);
  }, [doneFiles, exit, onCompleted]);

  useInput((_input, key) => {
    if (error && key.escape) {
      onBackToMenu();
    }
  });

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Alert variant="error" title="Rules Marketplace Error">
          {error}
        </Alert>
        <Select
          options={[{ label: '↩️  Back to Main Menu', value: 'back' }]}
          onChange={onBackToMenu}
        />
        <StatusFooter context="RULES" hints={[{ key: 'Esc/Enter', action: 'Back to menu' }]} />
      </Box>
    );
  }

  if (!installedRules) {
    return (
      <Box flexDirection="column">
        <Spinner label="Loading little.bootstrapper Rules Marketplace..." type="dots" />
        <StatusFooter context="RULES" hints={[{ key: 'Ctrl+C', action: 'Cancel' }]} />
      </Box>
    );
  }

  if (doneFiles) {
    const rows = selectedIds.map((id) => {
      const rule = getMarketplaceRuleById(id);
      return {
        rule: id,
        category: rule?.category ?? 'Rule',
        file: `.ai/rules/${id}.md`,
      };
    });
    const markdown = [
      '# Rules Marketplace Summary',
      `- Installed **${doneFiles.length}** universal AI rule(s) into \`.ai/rules/\``,
      '- Applies identically to Open Code, Antigravity, Claude, Codex, and Cursor',
      '- Run `little-bootstrapper validate` anytime to verify compliance',
    ].join('\n');

    return (
      <Box flexDirection="column" gap={1}>
        <BenderCard
          message={`Installed ${doneFiles.length} Marketplace Rule(s) into .ai/rules/!`}
        />
        <SummaryTable
          title="Installed Marketplace Rules"
          columns={[
            { key: 'rule', header: 'Rule ID', color: 'cyan' },
            { key: 'category', header: 'Category', color: 'magenta' },
            { key: 'file', header: 'Location', color: 'green' },
          ]}
          rows={rows}
        />
        <MarkdownPanel title="Delivery Notes" markdown={markdown} />
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
        <Badge color="magenta">RULES MARKETPLACE</Badge>
        <Text bold color="cyan">
          Browse &amp; Search ({MARKETPLACE_RULES.length} audited rules)
        </Text>
      </Box>
      <Box marginTop={1}>
        <MultiSelect
          searchable
          searchPlaceholder="Press / to search rules (financial, mobile, ink, nextjs, solidity)..."
          options={MARKETPLACE_RULES.map((r) => ({
            label: `[${r.category}] ${r.name}`,
            value: r.id,
            category: r.category,
            hint: r.description,
          }))}
          initialSelected={installedRules}
          minSelected={1}
          onBack={onBackToMenu}
          onSubmit={async (selected) => {
            try {
              const cfg = await loadBootstrapConfig(cwd);
              const files = await installMarketplaceRules(cwd, selected, cfg ?? undefined);
              if (cfg) {
                cfg.stack.rules = Array.from(new Set([...(cfg.stack.rules ?? []), ...selected]));
                await fs.writeFile(
                  path.join(cwd, 'bootstrap.config.json'),
                  `${JSON.stringify(cfg, null, 2)}\n`,
                  'utf-8',
                );
              }
              setSelectedIds(selected);
              setDoneFiles(files);
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err));
            }
          }}
        />
      </Box>
      <StatusFooter
        context="RULES"
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
