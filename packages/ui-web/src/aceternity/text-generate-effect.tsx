'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export const TextGenerateEffect: React.FC<{
  words: string;
  className?: string;
}> = ({ words, className }) => {
  const wordsArray = words.split(' ');
  return (
    <div className={cn('font-medium', className)}>
      {wordsArray.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          initial={{ opacity: 0, filter: 'blur(6px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.35, delay: idx * 0.04 }}
          className="inline-block"
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </div>
  );
};
