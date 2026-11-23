import React from 'react';
import { Box, Text } from 'ink';
import { Badge } from '@inkjs/ui';

export interface KeyHint {
  key: string;
  action: string;
}

export interface StatusFooterProps {
  context: string;
  hints: KeyHint[];
  rightText?: string;
}

export const StatusFooter: React.FC<StatusFooterProps> = ({
  context,
  hints,
  rightText = 'Planet Express CLI',
}) => (
  <Box
    marginTop={1}
    borderStyle="single"
    borderColor="gray"
    paddingX={1}
    justifyContent="space-between"
    flexWrap="wrap"
  >
    <Box gap={1} flexWrap="wrap" alignItems="center">
      <Badge color="cyan">{context}</Badge>
      {hints.map((h, i) => (
        <Box key={`${h.key}-${h.action}`} gap={0}>
          {i > 0 && <Text dimColor> • </Text>}
          <Text bold color="yellow">
            {h.key}
          </Text>
          <Text dimColor> {h.action}</Text>
        </Box>
      ))}
    </Box>
    <Text dimColor>{rightText}</Text>
  </Box>
);
