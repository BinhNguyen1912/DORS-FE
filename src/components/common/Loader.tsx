import React from 'react';
import { cn } from '../../lib/utils';

export interface LoaderProps {
  /**
   * Layout mode:
   * - 'inline': rendered inline-block with height of surrounding text
   * - 'block': centered inside its current block/container
   * - 'fullPage': rendered in a fixed overlay with glassmorphism backdrop
   * @default 'block'
   */
  layout?: 'inline' | 'block' | 'fullPage';
  
  /**
   * Predefined loader sizes
   * - 'sm': 24px width
   * - 'md': 45px width (original)
   * - 'lg': 80px width
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Tailwind text color class to apply to the loader.
   * e.g., 'text-amber-500', 'text-indigo-650', 'text-white'
   * Defaults to inheriting current text color from parent.
   */
  colorClass?: string;
  
  /**
   * Custom style object (e.g. override width or background manually)
   */
  style?: React.CSSProperties;
  
  /**
   * Optional loading text to display alongside or under the loader
   */
  text?: string;
  
  /**
   * Tailwind class styling for the optional loading text
   */
  textClass?: string;
  
  /**
   * Extra classes for the outer wrapper container
   */
  className?: string;
}

export default function Loader({
  layout = 'block',
  size = 'md',
  colorClass = '',
  style,
  text,
  textClass = '',
  className,
}: LoaderProps) {
  // Determine width based on size prop
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { width: '24px' },
    md: { width: '45px' },
    lg: { width: '80px' },
  };

  const loaderElement = (
    <div
      className={cn('loader', colorClass)}
      style={{
        ...sizeStyles[size],
        ...style,
      }}
      role="status"
      aria-live="polite"
    />
  );

  if (layout === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-2 select-none', className)}>
        {loaderElement}
        {text && (
          <span className={cn('text-xs font-semibold text-gray-500 dark:text-gray-400', textClass)}>
            {text}
          </span>
        )}
      </span>
    );
  }

  if (layout === 'fullPage') {
    return (
      <div
        className={cn(
          'fixed inset-0 flex flex-col items-center justify-center z-[9999]',
          'bg-slate-950/60 backdrop-blur-md transition-all duration-350 ease-in-out',
          className
        )}
      >
        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/5 dark:bg-slate-900/40 border border-white/10 shadow-2xl animate-fade-in">
          {loaderElement}
          {text && (
            <p
              className={cn(
                'text-sm font-bold tracking-wide text-indigo-500 dark:text-indigo-400 animate-pulse text-center',
                textClass
              )}
            >
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default block layout
  return (
    <div className={cn('flex flex-col items-center justify-center p-4 gap-3 select-none', className)}>
      {loaderElement}
      {text && (
        <p className={cn('text-xs font-bold text-gray-500 dark:text-gray-400 text-center', textClass)}>
          {text}
        </p>
      )}
    </div>
  );
}
