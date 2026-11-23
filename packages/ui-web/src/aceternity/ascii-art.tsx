'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback, useId } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '../lib/utils';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const ASCII_CHARSETS = {
  standard: ' .,:;i1tfLCG08@',
  blocks: ' ░▒▓█',
  binary: ' 01',
  dots: ' ·•●',
  minimal: ' .:░▒',
  dense: ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  arrows: ' ←↑→↓↔↕↖↗↘↙',
  stars: ' ·✦✧★',
  hash: ' -=#',
  pipes: ' |/─\\│',
  braille: ' ⠁⠃⠇⠏⠟⠿⡿⣿',
  circles: ' ○◔◑◕●',
  squares: ' ▢▣▤▥▦▧▨▩',
  hearts: ' ♡♥',
  math: ' +-×÷=≠≈∞',
} as const;

export type CharsetPreset = keyof typeof ASCII_CHARSETS;

const isCharsetPreset = (value: string): value is CharsetPreset => value in ASCII_CHARSETS;

const resolveCharset = (charset: string): string =>
  isCharsetPreset(charset) ? ASCII_CHARSETS[charset] : charset;

const resolveCssColor = (color: string, element: HTMLElement | null): string => {
  if (!color) return color;

  if (color.startsWith('var(')) {
    if (!element) return '#ffffff';

    const tempDiv = document.createElement('div');
    tempDiv.style.color = color;
    element.appendChild(tempDiv);
    const computedColor = getComputedStyle(tempDiv).color;
    element.removeChild(tempDiv);
    return computedColor || '#ffffff';
  }

  return color;
};

export type AsciiArtProps = {
  src: string;
  /** Number of ASCII columns (character resolution). Higher = more detail. */
  resolution?: number;
  /** Charset preset name ("standard", "blocks", "binary", etc.) or custom character string */
  charset?: CharsetPreset | string;
  /** Text color for the ASCII art (ignored if colored=true) */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Invert luminance mapping (useful for white-background illustrations on dark canvas) */
  inverted?: boolean;
  /** Enable colored ASCII (uses image colors) */
  colored?: boolean;
  /** Enable animation on load */
  animated?: boolean;
  /** Animation style */
  animationStyle?: 'fade' | 'typewriter' | 'matrix' | 'none';
  /** Duration for reveal animation in seconds */
  animationDuration?: number;
  /** Font family for ASCII characters */
  fontFamily?: string;
  /** Font weight for ASCII characters */
  fontWeight?: string | number;
  /** Container className - use this to control size (e.g., w-full, aspect-square) */
  className?: string;
  /** Only animate when in view */
  animateOnView?: boolean;
  /** How the image should fit within the ASCII grid */
  objectFit?: 'cover' | 'contain' | 'fill';
  /** Accessible description of the rendered image */
  alt?: string;
};

const MATRIX_CHARSET = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';

type AsciiPixel = {
  char: string;
  r: number;
  g: number;
  b: number;
};

export const AsciiArt: React.FC<AsciiArtProps> = ({
  src,
  resolution = 80,
  charset = 'standard',
  color = '#ffffff',
  backgroundColor = 'transparent',
  inverted = false,
  colored = false,
  animated = true,
  animationStyle = 'fade',
  animationDuration = 1.4,
  fontFamily = 'monospace',
  fontWeight = 600,
  className,
  animateOnView = true,
  objectFit = 'cover',
  alt = 'ASCII art rendering of image',
}) => {
  const uniqueId = useId();
  const [asciiData, setAsciiData] = useState<AsciiPixel[][]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  const shouldStartAnimation = animated && animateOnView ? isInView : animated;
  const shouldShowStatic = !animated || animationStyle === 'none';

  const resolvedCharset = resolveCharset(charset);
  const effectiveCharset = inverted
    ? resolvedCharset.split('').reverse().join('')
    : resolvedCharset;

  const defaultColor = inverted ? '#ffffff' : '#000000';
  const textColor = color || defaultColor;

  useEffect(() => {
    let isCancelled = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      if (isCancelled) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Canvas context not available');
        return;
      }

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const imgAspect = imgWidth / imgHeight;
      const charAspectRatio = 0.55;

      const container = containerRef.current;
      const containerAspect =
        container && container.clientWidth > 0 && container.clientHeight > 0
          ? container.clientWidth / container.clientHeight
          : imgAspect;
      const visualAspect = objectFit === 'contain' ? imgAspect : containerAspect;

      const cols = resolution;
      const rows = Math.max(1, Math.round((cols / visualAspect) * charAspectRatio));

      canvas.width = cols;
      canvas.height = rows;

      let sx = 0;
      let sy = 0;
      let sw = imgWidth;
      let sh = imgHeight;

      if (objectFit === 'cover') {
        if (imgAspect > visualAspect) {
          sw = imgHeight * visualAspect;
          sx = (imgWidth - sw) / 2;
        } else {
          sh = imgWidth / visualAspect;
          sy = (imgHeight - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
      } else if (objectFit === 'contain') {
        ctx.fillStyle = inverted ? '#ffffff' : '#000000';
        ctx.fillRect(0, 0, cols, rows);
        ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, cols, rows);
      } else {
        ctx.drawImage(img, 0, 0, cols, rows);
      }

      let imageData: ImageData;
      try {
        imageData = ctx.getImageData(0, 0, cols, rows);
      } catch {
        setError('Unable to read image data (CORS issue)');
        return;
      }

      const data = imageData.data;
      const result: AsciiPixel[][] = [];

      for (let y = 0; y < rows; y++) {
        const row: AsciiPixel[] = [];
        for (let x = 0; x < cols; x++) {
          const idx = (y * cols + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const adjustedBrightness = a === 0 ? (inverted ? 1 : 0) : brightness;

          const charIndex = Math.round(adjustedBrightness * (effectiveCharset.length - 1));
          const char = effectiveCharset[charIndex] ?? ' ';

          row.push({ char, r, g, b });
        }
        result.push(row);
      }

      setError(null);
      setAsciiData(result);
      setIsLoaded(true);
    };

    img.onerror = () => {
      if (isCancelled) return;
      setError('Failed to load image');
    };

    return () => {
      isCancelled = true;
    };
  }, [src, resolution, effectiveCharset, objectFit, inverted]);

  const drawCanvas = useCallback(
    (progress = 1, matrixProgress?: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || asciiData.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      if (containerWidth === 0 || containerHeight === 0) return;

      canvas.width = containerWidth * dpr;
      canvas.height = containerHeight * dpr;
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${containerHeight}px`;
      ctx.scale(dpr, dpr);

      const resolvedBgColor = resolveCssColor(backgroundColor, container);
      const resolvedTextColor = resolveCssColor(textColor, container);

      if (resolvedBgColor !== 'transparent') {
        ctx.fillStyle = resolvedBgColor;
        ctx.fillRect(0, 0, containerWidth, containerHeight);
      } else {
        ctx.clearRect(0, 0, containerWidth, containerHeight);
      }

      const rows = asciiData.length;
      const cols = asciiData[0]?.length || 0;
      if (cols === 0) return;

      const charWidth = containerWidth / cols;
      const charHeight = containerHeight / rows;
      const fontSize = Math.min(charWidth * 1.85, charHeight * 1.2);

      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';

      const totalChars = rows * cols;
      const revealedChars = Math.floor(progress * totalChars);

      let charIndex = 0;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const pixel = asciiData[y][x];
          const cx = x * charWidth + charWidth / 2;
          const cy = y * charHeight;

          if (animationStyle === 'typewriter' && charIndex >= revealedChars) {
            charIndex++;
            continue;
          }

          let displayChar = pixel.char;
          let displayColor = colored
            ? `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`
            : resolvedTextColor;

          if (animationStyle === 'matrix' && matrixProgress !== undefined) {
            const charProgress = (x / Math.max(cols, 1) + y / Math.max(rows, 1)) / 2.2;
            if (matrixProgress < charProgress) {
              charIndex++;
              continue;
            } else if (matrixProgress < charProgress + 0.14) {
              displayChar =
                MATRIX_CHARSET[
                  (x * 7 + y * 13 + Math.floor(matrixProgress * 60)) % MATRIX_CHARSET.length
                ];
              displayColor = '#2dd4bf';
              ctx.shadowColor = '#2dd4bf';
              ctx.shadowBlur = 4;
            } else {
              ctx.shadowBlur = 0;
            }
          }

          if (displayChar !== ' ') {
            ctx.fillStyle = displayColor;
            ctx.globalAlpha = animationStyle === 'fade' ? progress : 1;
            ctx.fillText(displayChar, cx, cy);
          }

          charIndex++;
        }
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    },
    [asciiData, backgroundColor, colored, textColor, fontFamily, fontWeight, animationStyle],
  );

  useEffect(() => {
    if (!isLoaded || asciiData.length === 0) return;

    const draw = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      if (shouldShowStatic || hasAnimated || !shouldStartAnimation) {
        drawCanvas(1);
        return;
      }

      const startTime = performance.now();
      const duration = Math.max(300, animationDuration * 1000);

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (animationStyle === 'matrix') {
          drawCanvas(1, progress);
        } else {
          drawCanvas(progress);
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          drawCanvas(1);
          setHasAnimated(true);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    const frameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    isLoaded,
    shouldStartAnimation,
    shouldShowStatic,
    hasAnimated,
    animationStyle,
    animationDuration,
    drawCanvas,
    asciiData,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (!isLoaded || asciiData.length === 0) return;
    if (shouldStartAnimation && !shouldShowStatic && !hasAnimated) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    drawCanvas(1);
  }, [isLoaded, asciiData, drawCanvas, shouldStartAnimation, shouldShowStatic, hasAnimated]);

  useEffect(() => {
    if (!isLoaded || asciiData.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      drawCanvas(1);
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [isLoaded, asciiData, drawCanvas]);

  if (error) {
    return (
      <div
        data-testid="ascii-art"
        data-src={src}
        data-loaded="error"
        className={cn('flex items-center justify-center text-red-500 text-sm font-mono', className)}
      >
        Error: {error}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        ref={containerRef}
        data-testid="ascii-art"
        data-src={src}
        data-loaded="false"
        className={cn(
          'flex items-center justify-center text-neutral-500 text-sm font-mono animate-pulse',
          className,
        )}
        style={{ backgroundColor }}
      >
        Loading...
      </div>
    );
  }

  const canvasElement = (
    <canvas
      key={uniqueId}
      id={`ascii-canvas-${uniqueId}`}
      ref={canvasRef}
      className="block h-full w-full"
      aria-label={alt}
      role="img"
    />
  );

  if (animationStyle === 'fade' && animated && !hasAnimated) {
    return (
      <motion.div
        ref={containerRef}
        data-testid="ascii-art"
        data-src={src}
        data-loaded="true"
        className={cn('overflow-hidden', className)}
        style={{ backgroundColor }}
        initial={{ opacity: 0 }}
        animate={shouldStartAnimation ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: animationDuration * 0.3 }}
      >
        {canvasElement}
      </motion.div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="ascii-art"
      data-src={src}
      data-loaded="true"
      className={cn('overflow-hidden', className)}
      style={{ backgroundColor }}
    >
      {canvasElement}
    </div>
  );
};

export const AsciiArtStatic: React.FC<Omit<AsciiArtProps, 'animated' | 'animationStyle'>> = (
  props,
) => {
  return <AsciiArt {...props} animated={false} animationStyle="none" />;
};
