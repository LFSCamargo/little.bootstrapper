import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { ProgressBar, Spinner } from '@inkjs/ui';

export interface DeliveryLoaderProps {
  label?: string;
  steps?: string[];
}

const DEFAULT_STEPS = [
  'Fueling dark-matter engines...',
  'Pinning audited package versions...',
  'Syncing universal AI agent rules & skills...',
  'Assembling little.bootstrapper cargo...',
];

export const DeliveryLoader: React.FC<DeliveryLoaderProps> = ({
  label = 'Delivering little.bootstrapper package...',
  steps = DEFAULT_STEPS,
}) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 220);
    return () => clearInterval(timer);
  }, []);

  const stepIdx = Math.min(steps.length - 1, Math.floor(tick / 4) % steps.length);
  const progress = Math.min(96, ((tick * 7) % 95) + 5);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
      <Spinner label={label} type="dots" />
      <Box width={48} marginTop={1}>
        <ProgressBar value={progress} />
      </Box>
      <Text dimColor>{steps[stepIdx]}</Text>
    </Box>
  );
};
