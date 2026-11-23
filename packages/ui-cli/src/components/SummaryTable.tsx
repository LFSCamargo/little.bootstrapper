import React from 'react';
import { Box, Text } from 'ink';

export interface TableColumn {
  key: string;
  header: string;
  width?: number;
  color?: 'cyan' | 'green' | 'yellow' | 'magenta' | 'white' | 'red';
}

export interface SummaryTableProps {
  title?: string;
  columns: TableColumn[];
  rows: Record<string, string>[];
}

export function computeColumnWidths(
  columns: TableColumn[],
  rows: Record<string, string>[],
): number[] {
  return columns.map((col) => {
    const maxData = rows.reduce((max, row) => Math.max(max, (row[col.key] ?? '').length), 0);
    const natural = Math.max(col.header.length, maxData);
    return col.width
      ? Math.min(col.width, Math.max(col.header.length, natural))
      : Math.min(44, natural);
  });
}

function padCell(value: string, width: number): string {
  if (value.length > width) {
    return `${value.slice(0, Math.max(1, width - 1))}…`;
  }
  return value.padEnd(width, ' ');
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ title, columns, rows }) => {
  const widths = computeColumnWidths(columns, rows);
  const topBorder = `┌${widths.map((w) => '─'.repeat(w + 2)).join('┬')}┐`;
  const midBorder = `├${widths.map((w) => '─'.repeat(w + 2)).join('┼')}┤`;
  const botBorder = `└${widths.map((w) => '─'.repeat(w + 2)).join('┴')}┘`;

  return (
    <Box flexDirection="column" marginY={0}>
      {title && (
        <Text bold color="cyan">
          {title}
        </Text>
      )}
      <Text dimColor>{topBorder}</Text>
      <Box>
        <Text dimColor>│</Text>
        {columns.map((col, i) => (
          <React.Fragment key={col.key}>
            <Text bold color="yellow">
              {` ${padCell(col.header, widths[i] ?? col.header.length)} `}
            </Text>
            <Text dimColor>│</Text>
          </React.Fragment>
        ))}
      </Box>
      <Text dimColor>{midBorder}</Text>
      {rows.map((row, rowIdx) => (
        <Box key={`${rowIdx}-${columns.map((c) => row[c.key] ?? '').join('|')}`}>
          <Text dimColor>│</Text>
          {columns.map((col, colIdx) => (
            <React.Fragment key={col.key}>
              <Text color={col.color}>
                {` ${padCell(row[col.key] ?? '', widths[colIdx] ?? col.header.length)} `}
              </Text>
              <Text dimColor>│</Text>
            </React.Fragment>
          ))}
        </Box>
      ))}
      <Text dimColor>{botBorder}</Text>
    </Box>
  );
};
