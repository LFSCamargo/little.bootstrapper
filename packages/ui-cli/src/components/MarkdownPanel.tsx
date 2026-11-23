import React from 'react';
import { Box, Text } from 'ink';

export interface MarkdownPanelProps {
  title?: string;
  markdown: string;
}

/**
 * Lightweight terminal Markdown renderer for Ink panels.
 * Formats headings (#, ##), bullets (- / *), inline `code`, and plain lines cleanly.
 */
export const MarkdownPanel: React.FC<MarkdownPanelProps> = ({ title, markdown }) => {
  const lines = markdown.trim().split('\n');

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
      {title && (
        <Text bold color="magenta">
          {title}
        </Text>
      )}
      {lines.map((raw, idx) => {
        const line = raw.trimEnd();
        const key = `${idx}-${line.slice(0, 24)}`;

        if (line.startsWith('# ')) {
          return (
            <Text key={key} bold color="cyanBright">
              {line.slice(2)}
            </Text>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <Text key={key} bold color="yellow">
              {line.slice(3)}
            </Text>
          );
        }
        if (line.startsWith('```')) {
          return (
            <Text key={key} dimColor>
              ────────────────────────────
            </Text>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <Text key={key} color="greenBright">
              • {line.slice(2).replace(/`/g, '')}
            </Text>
          );
        }
        return (
          <Text key={key} color="white">
            {line.replace(/`/g, '')}
          </Text>
        );
      })}
    </Box>
  );
};
