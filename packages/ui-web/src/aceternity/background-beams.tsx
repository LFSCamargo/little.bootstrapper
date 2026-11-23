'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const BEAM_PATHS = [
  'M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875',
  'M-310 -220C-310 -220 -242 185 222 312C686 439 754 844 754 844',
  'M-240 -251C-240 -251 -172 154 292 281C756 408 824 813 824 813',
  'M-170 -282C-170 -282 -102 123 362 250C826 377 894 782 894 782',
  'M-100 -313C-100 -313 -32 92 432 219C896 346 964 751 964 751',
];

export const BackgroundBeams: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white,transparent_78%)]',
        className,
      )}
      aria-hidden="true"
    >
      <svg className="h-full w-full" viewBox="0 0 696 316" fill="none">
        {BEAM_PATHS.map((d, idx) => (
          <g key={d}>
            <path d={d} stroke="url(#beam-static)" strokeOpacity="0.16" strokeWidth="1" />
            <motion.path
              d={d}
              stroke={`url(#beam-grad-${idx})`}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="140 900"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: [0, -1040] }}
              transition={{
                duration: 6 + idx * 1.4,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </g>
        ))}
        <defs>
          <linearGradient id="beam-static" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
          {BEAM_PATHS.map((_, idx) => (
            <linearGradient key={idx} id={`beam-grad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0" />
              <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
      </svg>
    </div>
  );
};
