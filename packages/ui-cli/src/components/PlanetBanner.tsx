import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { Badge } from '@inkjs/ui';
import { PLANET_EXPRESS_SHIP_ASCII, FUTURAMA_QUOTES } from '../ascii.js';

export interface PlanetBannerProps {
  title?: string;
  subtitle?: string;
  version?: string;
  animated?: boolean;
}

const THRUSTER_FRAMES = ['✦ ═══', '✧ ═══', '★ ═══', '✧ ═══'] as const;

export const PlanetBanner: React.FC<PlanetBannerProps> = ({
  title = 'little.bootstrapper — Universal AI Agent Initializer & Rules Marketplace',
  subtitle = FUTURAMA_QUOTES[0],
  version = '1.0.0',
  animated = true,
}) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % THRUSTER_FRAMES.length);
    }, 320);
    return () => clearInterval(timer);
  }, [animated]);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
      <Text color="cyan">{PLANET_EXPRESS_SHIP_ASCII}</Text>
      <Box marginTop={1} gap={1} alignItems="center">
        <Badge color="cyan">{`v${version}`}</Badge>
        <Text color="yellowBright">{THRUSTER_FRAMES[frame]}</Text>
        <Text bold color="greenBright">
          {title}
        </Text>
      </Box>
      <Text dimColor>{subtitle}</Text>
    </Box>
  );
};
