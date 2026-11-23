import React from 'react';
import { ThemeProvider, defaultTheme, extendTheme } from '@inkjs/ui';

export const planetExpressTheme = extendTheme(defaultTheme, {
  components: {
    Spinner: {
      styles: {
        frame: () => ({ color: 'cyan' }),
        label: () => ({ color: 'greenBright' }),
      },
    },
    ProgressBar: {
      styles: {
        completed: () => ({ color: 'cyan' }),
        remaining: () => ({ color: 'gray' }),
      },
    },
    Select: {
      styles: {
        focusIndicator: () => ({ color: 'cyan' }),
        label: ({ isFocused, isSelected }: { isFocused: boolean; isSelected: boolean }) => ({
          color: isSelected ? 'greenBright' : isFocused ? 'cyan' : undefined,
          bold: isFocused,
        }),
      },
    },
    Badge: {
      styles: {
        container: ({ color }: { color?: string }) => ({
          backgroundColor: color ?? 'cyan',
        }),
      },
    },
  },
});

export const PlanetThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={planetExpressTheme}>{children}</ThemeProvider>
);
