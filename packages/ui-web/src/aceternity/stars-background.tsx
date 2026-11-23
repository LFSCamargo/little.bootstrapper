'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

export interface StarProps {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number | null;
}

export function generateStarsField(
  width: number,
  height: number,
  options: {
    starDensity: number;
    allStarsTwinkle: boolean;
    twinkleProbability: number;
    minTwinkleSpeed: number;
    maxTwinkleSpeed: number;
  },
): StarProps[] {
  const numStars = Math.floor(width * height * options.starDensity);
  return Array.from({ length: numStars }, () => {
    const shouldTwinkle = options.allStarsTwinkle || Math.random() < options.twinkleProbability;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 0.6 + 0.5,
      opacity: Math.random() * 0.5 + 0.5,
      twinkleSpeed: shouldTwinkle
        ? options.minTwinkleSpeed +
          Math.random() * (options.maxTwinkleSpeed - options.minTwinkleSpeed)
        : null,
    };
  });
}

interface StarBackgroundProps {
  starDensity?: number;
  allStarsTwinkle?: boolean;
  twinkleProbability?: number;
  minTwinkleSpeed?: number;
  maxTwinkleSpeed?: number;
  className?: string;
}

export const StarsBackground: React.FC<StarBackgroundProps> = ({
  starDensity = 0.00015,
  allStarsTwinkle = true,
  twinkleProbability = 0.7,
  minTwinkleSpeed = 0.5,
  maxTwinkleSpeed = 1,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<StarProps[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateStars = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      starsRef.current = generateStarsField(width, height, {
        starDensity,
        allStarsTwinkle,
        twinkleProbability,
        minTwinkleSpeed,
        maxTwinkleSpeed,
      });
    };

    updateStars();

    const resizeObserver = new ResizeObserver(updateStars);
    resizeObserver.observe(canvas);

    let animationFrameId = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now() * 0.001;
      for (const star of starsRef.current) {
        if (star.twinkleSpeed !== null) {
          star.opacity = 0.4 + Math.abs(Math.sin(now / star.twinkleSpeed) * 0.6);
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [starDensity, allStarsTwinkle, twinkleProbability, minTwinkleSpeed, maxTwinkleSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  );
};
