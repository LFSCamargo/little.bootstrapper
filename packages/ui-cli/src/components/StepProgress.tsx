import React from 'react';
import { Box, Text } from 'ink';
import { Badge, ProgressBar } from '@inkjs/ui';

export interface StepProgressProps {
  workflow: string;
  stepName: string;
  currentStep: number;
  totalSteps: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  workflow,
  stepName,
  currentStep,
  totalSteps,
}) => {
  const pct = Math.max(0, Math.min(100, Math.round((currentStep / Math.max(1, totalSteps)) * 100)));

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={1} alignItems="center">
        <Badge color="magenta">{workflow}</Badge>
        <Text bold color="cyan">
          Step {currentStep}/{totalSteps}: {stepName}
        </Text>
        <Text dimColor>({pct}%)</Text>
      </Box>
      <Box width={52} marginTop={0}>
        <ProgressBar value={pct} />
      </Box>
    </Box>
  );
};
