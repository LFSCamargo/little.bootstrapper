'use client';

import React, { useEffect, useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { HoverBorderGradient } from '@little-bootstrapper/ui-web';

export function CopyCommandPill({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(command).catch(() => undefined);
    }
    setCopied(true);
  };

  return (
    <HoverBorderGradient containerClassName="rounded-full" className="rounded-full px-5 py-2.5">
      <button
        type="button"
        onClick={handleCopy}
        data-testid="copy-cli-command"
        aria-label={`Copy command ${command}`}
        className="inline-flex cursor-pointer items-center gap-2.5 text-left"
      >
        <Terminal className="h-4 w-4 shrink-0 text-teal-500 dark:text-teal-400" />
        <span className="font-mono text-xs sm:text-sm">{command}</span>
        {copied ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-teal-400" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
        )}
        <span className="sr-only" aria-live="polite">
          {copied ? 'Copied to clipboard' : ''}
        </span>
      </button>
    </HoverBorderGradient>
  );
}
