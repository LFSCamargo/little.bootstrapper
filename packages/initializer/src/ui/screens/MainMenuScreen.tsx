import React from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { Badge, Select, StatusFooter } from '@little-bootstrapper/ui-cli';
import type { InteractiveMode } from '../../commands/index.js';

export interface MainMenuScreenProps {
  onSelectMode: (mode: InteractiveMode) => void;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({ onSelectMode }) => {
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.escape || input === 'q' || input === 'Q') {
      exit();
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1} alignItems="center">
        <Badge color="cyan">MISSION CONTROL</Badge>
        <Text bold color="yellow">
          Select a Planet Express Delivery Mission:
        </Text>
      </Box>
      <Select
        visibleOptionCount={6}
        options={[
          { label: '🚀 Initialize Setup (CORE) — Bootstrap a new project', value: 'init' },
          {
            label:
              '📚 Rules Marketplace — Browse, search & install framework/language/financial rules',
            value: 'rules',
          },
          {
            label: '🔌 Verified Safe MCPs — Browse, search & install into mcp.json',
            value: 'mcps',
          },
          {
            label: '🔧 Normalize Existing Setup — Detect & sync AI agents, rules, MCPs & tools',
            value: 'normalize',
          },
          {
            label: '🛡️  Update Helper — Audit & pin latest safe package versions',
            value: 'update',
          },
          { label: '❌ Exit ("Fine! I\'ll build my own CLI!")', value: 'exit' },
        ]}
        onChange={(value) => {
          if (value === 'exit') {
            exit();
            return;
          }
          onSelectMode(value as InteractiveMode);
        }}
      />
      <StatusFooter
        context="MENU"
        hints={[
          { key: '↑/↓', action: 'Navigate' },
          { key: 'Enter', action: 'Open workflow' },
          { key: 'Q/Esc', action: 'Quit' },
        ]}
      />
    </Box>
  );
};
