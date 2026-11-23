import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Badge, StatusMessage } from '@inkjs/ui';

export interface MultiSelectOption<T extends string = string> {
  label: string;
  value: T;
  hint?: string;
  category?: string;
}

export interface MultiSelectProps<T extends string = string> {
  options: MultiSelectOption<T>[];
  initialSelected?: T[];
  minSelected?: number;
  maxVisible?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  onBack?: () => void;
  onSubmit: (selected: T[]) => void;
}

export function filterMultiSelectOptions<T extends string = string>(
  options: MultiSelectOption<T>[],
  query: string,
): MultiSelectOption<T>[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;
  return options.filter((opt) => {
    const haystack = [opt.label, opt.value, opt.hint ?? '', opt.category ?? '']
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function MultiSelect<T extends string = string>({
  options,
  initialSelected = [],
  minSelected = 1,
  maxVisible = 12,
  searchable,
  searchPlaceholder = 'Type / to filter options...',
  onBack,
  onSubmit,
}: MultiSelectProps<T>) {
  const enableSearch = searchable ?? options.length > 8;
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<Set<T>>(new Set(initialSelected));
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState('');
  const [warning, setWarning] = useState<string | null>(null);

  const filtered = useMemo(() => filterMultiSelectOptions(options, query), [options, query]);
  const safeCursor = filtered.length === 0 ? 0 : Math.min(cursor, filtered.length - 1);

  useInput((input, key) => {
    // Handle search input mode
    if (searchMode) {
      if (key.escape) {
        setSearchMode(false);
        return;
      }
      if (key.return) {
        setSearchMode(false);
        return;
      }
      if (key.backspace || key.delete) {
        setQuery((q) => q.slice(0, -1));
        setCursor(0);
        return;
      }
      if (key.upArrow && filtered.length > 0) {
        setCursor((c) => (c > 0 ? c - 1 : filtered.length - 1));
        return;
      }
      if (key.downArrow && filtered.length > 0) {
        setCursor((c) => (c < filtered.length - 1 ? c + 1 : 0));
        return;
      }
      if (key.tab && filtered.length > 0) {
        const current = filtered[safeCursor];
        if (current) {
          setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(current.value)) next.delete(current.value);
            else next.add(current.value);
            return next;
          });
        }
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setQuery((q) => q + input);
        setCursor(0);
      }
      return;
    }

    // Browse & toggle mode
    if (enableSearch && input === '/') {
      setSearchMode(true);
      setWarning(null);
      return;
    }

    if (key.escape) {
      if (enableSearch && query.length > 0) {
        setQuery('');
        setCursor(0);
        return;
      }
      if (onBack) {
        onBack();
        return;
      }
    }

    if (key.upArrow && filtered.length > 0) {
      setCursor((c) => (c > 0 ? c - 1 : filtered.length - 1));
      setWarning(null);
    } else if (key.downArrow && filtered.length > 0) {
      setCursor((c) => (c < filtered.length - 1 ? c + 1 : 0));
      setWarning(null);
    } else if (input === ' ' && filtered.length > 0) {
      const current = filtered[safeCursor];
      if (!current) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(current.value)) {
          next.delete(current.value);
        } else {
          next.add(current.value);
        }
        return next;
      });
      setWarning(null);
    } else if ((input === 'a' || input === 'A') && filtered.length > 0) {
      const allFilteredSelected = filtered.every((o) => selected.has(o.value));
      setSelected((prev) => {
        const next = new Set(prev);
        if (allFilteredSelected) {
          for (const o of filtered) next.delete(o.value);
        } else {
          for (const o of filtered) next.add(o.value);
        }
        return next;
      });
      setWarning(null);
    } else if (key.return) {
      if (selected.size < minSelected) {
        setWarning(
          `Please select at least ${minSelected} item(s) using Space before pressing Enter.`,
        );
        return;
      }
      onSubmit(Array.from(selected));
    }
  });

  const start = Math.max(
    0,
    Math.min(safeCursor - Math.floor(maxVisible / 2), Math.max(0, filtered.length - maxVisible)),
  );
  const visible = filtered.slice(start, start + maxVisible);

  return (
    <Box flexDirection="column">
      {enableSearch && (
        <Box
          borderStyle="round"
          borderColor={searchMode ? 'yellow' : 'gray'}
          paddingX={1}
          marginBottom={1}
        >
          <Text color={searchMode ? 'yellow' : 'cyan'}>🔍 Search: </Text>
          {query ? (
            <Text color="white">
              {query}
              {searchMode ? '█' : ''}
            </Text>
          ) : (
            <Text dimColor>
              {searchMode ? '█ (type to filter, Tab to toggle, Enter/Esc done)' : searchPlaceholder}
            </Text>
          )}
        </Box>
      )}
      <Box gap={1}>
        <Badge color="green">{`${selected.size} selected`}</Badge>
        <Text dimColor>
          ↑/↓ move • Space toggle{enableSearch ? ' • / search' : ''} • A toggle visible • Enter
          confirm
        </Text>
      </Box>
      {visible.length === 0 ? (
        <StatusMessage variant="warning">
          No matching items for &quot;{query}&quot;. Press Esc to clear filter.
        </StatusMessage>
      ) : (
        visible.map((opt, idx) => {
          const realIdx = start + idx;
          const isFocused = realIdx === safeCursor;
          const isChecked = selected.has(opt.value);
          return (
            <Box key={opt.value}>
              <Text color={isFocused ? 'cyan' : undefined} bold={isFocused}>
                {isFocused ? '❯ ' : '  '}
                {isChecked ? '[✓] ' : '[ ] '}
                {opt.label}
                {opt.hint ? ` — ${opt.hint}` : ''}
              </Text>
            </Box>
          );
        })
      )}
      {filtered.length > maxVisible && (
        <Text dimColor>
          Showing {start + 1}–{Math.min(start + maxVisible, filtered.length)} of {filtered.length}
          {query ? ` (filtered from ${options.length})` : ''}
        </Text>
      )}
      {warning && <StatusMessage variant="error">{warning}</StatusMessage>}
    </Box>
  );
}
