import React from 'react';
import { Box, Text } from 'ink';

export interface FolderPreviewProps {
  title?: string;
  lines: string[];
}

export const FolderPreview: React.FC<FolderPreviewProps> = ({
  title = 'Folder Structure Preview',
  lines,
}) => (
  <Box flexDirection="column">
    <Text bold color="cyan">
      {title}:
    </Text>
    <Box borderStyle="single" borderColor="gray" paddingX={2} flexDirection="column">
      {lines.map((line, i) => (
        <Text key={`${i}-${line}`} color="green">
          {line}
        </Text>
      ))}
    </Box>
  </Box>
);
