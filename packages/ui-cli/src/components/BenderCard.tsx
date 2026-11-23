import React from 'react';
import { Box, Text } from 'ink';
import { Alert, StatusMessage } from '@inkjs/ui';
import { BENDER_MASCOT_ASCII } from '../ascii.js';

export interface BenderCardProps {
  message?: string;
  detail?: string;
  variant?: 'success' | 'info' | 'warning' | 'error';
}

export const BenderCard: React.FC<BenderCardProps> = ({
  message = 'Bite my shiny metal scaffold!',
  detail,
  variant = 'success',
}) => (
  <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={2} paddingY={1}>
    <Text color="greenBright">{BENDER_MASCOT_ASCII}</Text>
    <Box marginTop={1} flexDirection="column" gap={1}>
      <Alert variant={variant} title="Planet Express Delivery Complete">
        {message}
      </Alert>
      {detail && <StatusMessage variant="info">{detail}</StatusMessage>}
    </Box>
  </Box>
);
