'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import {
  GridPosition,
  PluginLayer,
  StyleConfig,
  InteractionConfig,
} from '../../lib/plugin-display-config-api';

interface PluginSlotProps {
  pluginId: string;
  gridPosition: GridPosition;
  layer: PluginLayer;
  zIndex: number;
  styleConfig?: StyleConfig;
  interactionConfig?: InteractionConfig;
  children: ReactNode;
  className?: string;
}

// 层级对应的 z-index 基础值
const LAYER_Z_INDEX: Record<PluginLayer, number> = {
  background: 0,
  base: 100,
  content: 200,
  overlay: 300,
  modal: 400,
};

export function PluginSlot({
  pluginId,
  gridPosition,
  layer,
  zIndex,
  styleConfig = {},
  interactionConfig = { draggable: false, resizable: false, clickable: true },
  children,
  className = '',
}: PluginSlotProps) {
  // 生成网格样式
  const gridStyle: React.CSSProperties = {
    gridColumnStart: gridPosition.colStart,
    gridColumnEnd: gridPosition.colEnd,
    gridRowStart: gridPosition.rowStart,
    gridRowEnd: gridPosition.rowEnd,
  };

  // 生成层级样式
  const layerStyle: React.CSSProperties = {
    zIndex: LAYER_Z_INDEX[layer] + zIndex,
  };

  // 生成样式配置
  const styleConfigCSS: React.CSSProperties = {};

  if (styleConfig.colors) {
    if (styleConfig.colors.background) {
      styleConfigCSS.backgroundColor = styleConfig.colors.background;
    }
    if (styleConfig.colors.text) {
      styleConfigCSS.color = styleConfig.colors.text;
    }
    if (styleConfig.colors.border) {
      styleConfigCSS.borderColor = styleConfig.colors.border;
    }
  }

  if (styleConfig.typography) {
    if (styleConfig.typography.fontSize) {
      styleConfigCSS.fontSize = styleConfig.typography.fontSize;
    }
    if (styleConfig.typography.fontFamily) {
      styleConfigCSS.fontFamily = styleConfig.typography.fontFamily;
    }
    if (styleConfig.typography.fontWeight) {
      styleConfigCSS.fontWeight = styleConfig.typography.fontWeight;
    }
  }

  if (styleConfig.spacing) {
    if (styleConfig.spacing.padding) {
      styleConfigCSS.padding = styleConfig.spacing.padding;
    }
    if (styleConfig.spacing.margin) {
      styleConfigCSS.margin = styleConfig.spacing.margin;
    }
  }

  if (styleConfig.effects) {
    if (styleConfig.effects.opacity !== undefined) {
      styleConfigCSS.opacity = styleConfig.effects.opacity;
    }
    if (styleConfig.effects.blur) {
      styleConfigCSS.filter = `blur(${styleConfig.effects.blur}px)`;
    }
    if (styleConfig.effects.shadow) {
      styleConfigCSS.boxShadow = styleConfig.effects.shadow;
    }
  }

  // 交互样式
  const interactionStyle: React.CSSProperties = {
    cursor: interactionConfig.clickable ? 'pointer' : 'default',
    pointerEvents: interactionConfig.clickable ? 'auto' : 'none',
    resize: interactionConfig.resizable ? 'both' : 'none',
  };

  return (
    <motion.div
      data-plugin-id={pluginId}
      data-plugin-layer={layer}
      className={`relative ${className}`}
      style={{
        ...gridStyle,
        ...layerStyle,
        ...styleConfigCSS,
        ...interactionStyle,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={interactionConfig.clickable ? { scale: 1.02 } : undefined}
    >
      {children}
    </motion.div>
  );
}
