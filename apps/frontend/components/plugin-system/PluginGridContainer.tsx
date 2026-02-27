'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PluginGridContainerProps {
  children: ReactNode;
  className?: string;
  gap?: number;
  minRowHeight?: string;
}

export function PluginGridContainer({
  children,
  className = '',
  gap = 16,
  minRowHeight = 'auto',
}: PluginGridContainerProps) {
  return (
    <motion.div
      className={`w-full ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: `${gap}px`,
        gridAutoRows: minRowHeight,
        minHeight: '100vh',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
