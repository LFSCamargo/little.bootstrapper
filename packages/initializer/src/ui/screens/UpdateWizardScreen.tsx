import React, { useEffect, useState } from 'react';
import { Box, useApp, useInput } from 'ink';
import {
  Alert,
  BenderCard,
  MarkdownPanel,
  Select,
  Spinner,
  StatusFooter,
  SummaryTable,
} from '@little-bootstrapper/ui-cli';
import type { VersionAuditItem } from '../../types/index.js';
import { applyAuditedVersionUpdates, auditProjectVersions } from '../../modules/workflows/index.js';

export interface UpdateWizardScreenProps {
  cwd: string;
  onBackToMenu: () => void;
  onCompleted: () => void;
}

export const UpdateWizardScreen: React.FC<UpdateWizardScreenProps> = ({
  cwd,
  onBackToMenu,
  onCompleted,
}) => {
  const { exit } = useApp();
  const [items, setItems] = useState<VersionAuditItem[] | null>(null);
  const [updatedCount, setUpdatedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void auditProjectVersions(cwd)
      .then((res) => {
        if (!cancelled) setItems(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [cwd]);

  useEffect(() => {
    if (updatedCount === null) return;
    onCompleted();
    const timer = setTimeout(() => exit(), 80);
    return () => clearTimeout(timer);
  }, [updatedCount, exit, onCompleted]);

  useInput((_input, key) => {
    if (key.escape && updatedCount === null) {
      onBackToMenu();
    }
  });

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Alert variant="error" title="Update Audit Error">
          {error}
        </Alert>
        <Select
          options={[{ label: '↩️  Back to Main Menu', value: 'back' }]}
          onChange={onBackToMenu}
        />
        <StatusFooter context="UPDATE" hints={[{ key: 'Esc/Enter', action: 'Back to menu' }]} />
      </Box>
    );
  }

  if (!items) {
    return (
      <Box flexDirection="column">
        <Spinner
          label="Auditing package.json files against Planet Express audited registry..."
          type="dots"
        />
        <StatusFooter context="UPDATE" hints={[{ key: 'Ctrl+C', action: 'Cancel' }]} />
      </Box>
    );
  }

  const actionable = items.filter((i) => i.needsUpdate);

  if (updatedCount !== null) {
    const markdown = [
      '# Audited Version Update Summary',
      `- Audited **${items.length}** total dependencies across workspace \`package.json\` files`,
      `- Pinned & updated **${updatedCount}** package(s) to CVE-free releases`,
      '- Run `yarn install` to update your lockfile cleanly',
    ].join('\n');

    return (
      <Box flexDirection="column" gap={1}>
        <BenderCard
          message={`Updated & pinned ${updatedCount} package versions to audited releases!`}
        />
        <MarkdownPanel title="Update Notes" markdown={markdown} />
        <StatusFooter
          context="DONE"
          hints={[{ key: 'Exit', action: 'Command complete — returned to shell' }]}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Alert
        variant={actionable.length > 0 ? 'warning' : 'success'}
        title={`Update Helper — Audited ${items.length} Dependencies`}
      >
        {actionable.length > 0
          ? `${actionable.length} package(s) require pinning or security updates.`
          : 'All dependencies are strictly pinned to audited, safe versions!'}
      </Alert>

      {actionable.length > 0 && (
        <SummaryTable
          title="Actionable Dependencies"
          columns={[
            { key: 'file', header: 'File', color: 'white' },
            { key: 'pkg', header: 'Package', color: 'cyan' },
            { key: 'change', header: 'Version Change', color: 'yellow' },
            { key: 'status', header: 'Status', color: 'red' },
          ]}
          rows={actionable.slice(0, 12).map((a) => ({
            file: a.file,
            pkg: a.packageName,
            change: `${a.currentVersion} → ${a.recommendedVersion}`,
            status: a.advisory ? `${a.status} (${a.advisory})` : a.status,
          }))}
        />
      )}

      <Select
        options={[
          ...(actionable.length > 0
            ? [{ label: '🛡️  Pin & Update All to Audited Versions', value: 'apply' }]
            : []),
          { label: '↩️  Back to Main Menu', value: 'back' },
        ]}
        onChange={async (value) => {
          if (value === 'apply') {
            try {
              const count = await applyAuditedVersionUpdates(cwd);
              setUpdatedCount(count);
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err));
            }
          } else {
            onBackToMenu();
          }
        }}
      />
      <StatusFooter
        context="UPDATE"
        hints={[
          { key: '↑/↓', action: 'Choose' },
          { key: 'Enter', action: actionable.length > 0 ? 'Apply & Exit' : 'Back to menu' },
          { key: 'Esc', action: 'Back to menu' },
        ]}
      />
    </Box>
  );
};
