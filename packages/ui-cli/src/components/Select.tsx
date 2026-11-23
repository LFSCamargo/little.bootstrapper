import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, type BoxProps, type TextProps } from 'ink';
import { useComponentTheme, type Option } from '@inkjs/ui';

export type SelectOption = Option;

export interface SelectProps {
  /**
   * When disabled, user input is ignored.
   *
   * @default false
   */
  readonly isDisabled?: boolean;
  /**
   * Number of visible options.
   *
   * @default 5
   */
  readonly visibleOptionCount?: number;
  /**
   * Highlight text in option labels.
   */
  readonly highlightText?: string;
  /**
   * Options to display.
   */
  readonly options: Option[];
  /**
   * Default value. Initially focused and marked as selected; pressing Enter confirms it immediately.
   */
  readonly defaultValue?: string;
  /**
   * Callback fired whenever the user confirms the focused option with Enter.
   */
  readonly onChange?: (value: string) => void;
}

type SelectTheme = {
  styles?: {
    container?: () => BoxProps;
    option?: (props: { isFocused: boolean }) => BoxProps;
    focusIndicator?: () => TextProps;
    selectedIndicator?: () => TextProps;
    label?: (props: { isFocused: boolean; isSelected: boolean }) => TextProps;
    highlightedText?: () => TextProps;
  };
};

export function findInitialSelectIndex(options: Option[], defaultValue?: string): number {
  if (defaultValue === undefined) return 0;
  const idx = options.findIndex((o) => o.value === defaultValue);
  return idx >= 0 ? idx : 0;
}

export function computeSelectWindow(
  total: number,
  focusedIndex: number,
  visibleOptionCount: number,
  currentFrom: number,
): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  const count = Math.min(Math.max(1, visibleOptionCount), total);
  if (total <= count) {
    return { from: 0, to: total };
  }
  let from = currentFrom;
  if (focusedIndex < from) {
    from = focusedIndex;
  } else if (focusedIndex >= from + count) {
    from = focusedIndex - count + 1;
  }
  from = Math.max(0, Math.min(from, total - count));
  return { from, to: from + count };
}

/**
 * Interactive single-select component built on `@inkjs/ui`'s `Select` theme.
 *
 * Unlike `@inkjs/ui`'s raw `Select`, pressing Enter on an option matching `defaultValue`
 * always triggers `onChange`, and `defaultValue` is automatically focused and scrolled
 * into view on mount.
 */
export function Select({
  isDisabled = false,
  visibleOptionCount = 5,
  highlightText,
  options,
  defaultValue,
  onChange,
}: SelectProps) {
  const optionsKey = options.map((o) => o.value).join('\0');
  const initialIndex = findInitialSelectIndex(options, defaultValue);

  const [focusedIndex, setFocusedIndex] = useState(initialIndex);
  const [selectedValue, setSelectedValue] = useState<string | undefined>(defaultValue);
  const [visibleFrom, setVisibleFrom] = useState(
    () => computeSelectWindow(options.length, initialIndex, visibleOptionCount, 0).from,
  );

  useEffect(() => {
    const nextIdx = findInitialSelectIndex(options, defaultValue);
    setFocusedIndex(nextIdx);
    setSelectedValue(defaultValue);
    setVisibleFrom(computeSelectWindow(options.length, nextIdx, visibleOptionCount, 0).from);
    // Sync only when option values, defaultValue, or viewport size actually change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey, defaultValue, visibleOptionCount]);

  const safeFocusedIndex =
    options.length === 0 ? 0 : Math.min(Math.max(0, focusedIndex), options.length - 1);

  useInput(
    (_input, key) => {
      if (options.length === 0) return;

      if (key.downArrow) {
        const next = Math.min(safeFocusedIndex + 1, options.length - 1);
        setFocusedIndex(next);
        setVisibleFrom(
          (from) => computeSelectWindow(options.length, next, visibleOptionCount, from).from,
        );
        return;
      }

      if (key.upArrow) {
        const next = Math.max(safeFocusedIndex - 1, 0);
        setFocusedIndex(next);
        setVisibleFrom(
          (from) => computeSelectWindow(options.length, next, visibleOptionCount, from).from,
        );
        return;
      }

      if (key.return) {
        const focused = options[safeFocusedIndex];
        if (!focused) return;
        setSelectedValue(focused.value);
        onChange?.(focused.value);
      }
    },
    { isActive: !isDisabled },
  );

  const theme = useComponentTheme<SelectTheme>('Select');
  const styles = theme?.styles;
  const windowRange = computeSelectWindow(
    options.length,
    safeFocusedIndex,
    visibleOptionCount,
    visibleFrom,
  );
  const visibleOptions = options.slice(windowRange.from, windowRange.to);

  return (
    <Box flexDirection="column" {...styles?.container?.()}>
      {visibleOptions.map((option, idx) => {
        const realIdx = windowRange.from + idx;
        const isFocused = !isDisabled && realIdx === safeFocusedIndex;
        const isSelected = selectedValue === option.value;

        let label: React.ReactNode = option.label;
        if (highlightText && option.label.includes(highlightText)) {
          const matchIdx = option.label.indexOf(highlightText);
          label = (
            <>
              {option.label.slice(0, matchIdx)}
              <Text {...styles?.highlightedText?.()}>{highlightText}</Text>
              {option.label.slice(matchIdx + highlightText.length)}
            </>
          );
        }

        return (
          <Box key={option.value} {...styles?.option?.({ isFocused })}>
            {isFocused && <Text {...styles?.focusIndicator?.()}>❯</Text>}
            <Text {...styles?.label?.({ isFocused, isSelected })}>{label}</Text>
            {isSelected && <Text {...styles?.selectedIndicator?.()}>✔</Text>}
          </Box>
        );
      })}
    </Box>
  );
}
