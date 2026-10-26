import React, { useEffect, useState, useRef } from 'react';

const CIPHER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%#@*';

interface ScrambleTextProps {
  text: string;
  className?: string;
  duration?: number;
  triggerKey?: any;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  className = '',
  duration = 450,
  triggerKey,
}) => {
  const [displayText, setDisplayText] = useState('');
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!text) {
      setDisplayText('');
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayText(text);
      return;
    }

    const startTime = performance.now();
    const length = text.length;

    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Linear reveal of actual letters from left to right, remainder scrambled
      const revealedCount = Math.floor(progress * length);

      let scrambled = '';
      for (let i = 0; i < length; i++) {
        const char = text[i];
        if (char === ' ' || char === '\n' || char === '\t') {
          scrambled += char;
        } else if (i < revealedCount) {
          scrambled += char;
        } else {
          scrambled += CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
        }
      }

      setDisplayText(scrambled);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(update);
      } else {
        setDisplayText(text);
      }
    };

    frameRef.current = requestAnimationFrame(update);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [text, duration, triggerKey]);

  return <span className={className}>{displayText || text}</span>;
};
