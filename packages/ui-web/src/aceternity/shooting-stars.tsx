'use client';

import React, { useEffect, useState, useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface ShootingStar {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  angle: number;
  duration: number;
}

interface ShootingStarsProps {
  minSpeed?: number;
  maxSpeed?: number;
  minDelay?: number;
  maxDelay?: number;
  starColor?: string;
  trailColor?: string;
  starWidth?: number;
  starHeight?: number;
  className?: string;
}

export function createRandomTrajectory(
  minSpeed: number,
  maxSpeed: number,
  viewport?: { width: number; height: number },
  forcedSide?: 0 | 1 | 2 | 3,
): ShootingStar {
  const width = viewport?.width ?? window.innerWidth;
  const height = viewport?.height ?? window.innerHeight;
  const side = forcedSide ?? Math.floor(Math.random() * 4);
  const offset = Math.random() * width;

  let startX = offset;
  let startY = 0;
  let angle = 45;

  if (side === 1) {
    startX = width;
    startY = Math.random() * height;
    angle = 135;
  } else if (side === 2) {
    startX = offset;
    startY = height;
    angle = 225;
  } else if (side === 3) {
    startX = 0;
    startY = Math.random() * height;
    angle = 315;
  }

  const distance = Math.hypot(width, height) + 120;
  const rad = (angle * Math.PI) / 180;
  const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
  const duration = Math.max(0.6, distance / (speed * 60));

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    startX,
    startY,
    endX: startX + Math.cos(rad) * distance,
    endY: startY + Math.sin(rad) * distance,
    angle,
    duration,
  };
}

export const ShootingStars: React.FC<ShootingStarsProps> = ({
  minSpeed = 10,
  maxSpeed = 30,
  minDelay = 1200,
  maxDelay = 4200,
  starColor = '#9E00FF',
  trailColor = '#2EB9DF',
  starWidth = 28,
  starHeight = 1.5,
  className,
}) => {
  const [star, setStar] = useState<ShootingStar | null>(null);
  const gradientId = `shooting-star-gradient-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const spawn = () => {
      setStar(createRandomTrajectory(minSpeed, maxSpeed));
      const delay = Math.random() * (maxDelay - minDelay) + minDelay;
      timeoutId = setTimeout(spawn, delay);
    };

    timeoutId = setTimeout(spawn, 400);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [minSpeed, maxSpeed, minDelay, maxDelay]);

  return (
    <svg className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}>
      {star && (
        <motion.g
          key={star.id}
          initial={{ x: star.startX, y: star.startY, opacity: 0.9 }}
          animate={{ x: star.endX, y: star.endY, opacity: 0 }}
          transition={{ duration: star.duration, ease: 'linear' }}
        >
          <rect
            x={0}
            y={0}
            width={starWidth}
            height={starHeight}
            fill={`url(#${gradientId})`}
            transform={`rotate(${star.angle})`}
          />
        </motion.g>
      )}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
          <stop offset="100%" style={{ stopColor: starColor, stopOpacity: 1 }} />
        </linearGradient>
      </defs>
    </svg>
  );
};
