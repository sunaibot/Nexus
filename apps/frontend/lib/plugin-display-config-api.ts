/**
 * 插件前台显示配置 API 客户端
 * 提供插件位置、层级、样式等配置的获取和更新功能
 */

import { getApiBase } from './env';
const API_BASE = getApiBase();

// 层级类型
export type PluginLayer = 'background' | 'base' | 'content' | 'overlay' | 'modal';

// 网格位置类型
export interface GridPosition {
  colStart: number; // 1-13
  colEnd: number; // 1-13
  rowStart: number; // 1-100
  rowEnd: number; // 1-100
}

// 响应式配置
export interface ResponsiveConfig {
  mobile?: Partial<GridPosition>;
  tablet?: Partial<GridPosition>;
  desktop?: Partial<GridPosition>;
}

// 显示配置
export interface DisplayConfig {
  visible: boolean;
  responsive?: ResponsiveConfig;
}

// 样式配置
export interface StyleConfig {
  colors?: {
    background?: string;
    text?: string;
    border?: string;
  };
  typography?: {
    fontSize?: string;
    fontFamily?: string;
    fontWeight?: string;
  };
  spacing?: {
    padding?: string;
    margin?: string;
  };
  effects?: {
    opacity?: number;
    blur?: number;
    shadow?: string;
    animation?: string;
  };
}

// 交互配置
export interface InteractionConfig {
  draggable?: boolean;
  resizable?: boolean;
  clickable?: boolean;
}

// 插件显示配置完整类型
export interface PluginDisplayConfig {
  id: string;
  pluginId: string;
  pluginName?: string;
  pluginIsEnabled?: boolean;
  gridPosition: GridPosition;
  layer: PluginLayer;
  zIndex: number;
  displayConfig: DisplayConfig;
  styleConfig: StyleConfig;
  interactionConfig: InteractionConfig;
  createdAt: string;
  updatedAt: string;
}

// 插件信息
export interface Plugin {
  id: string;
  name: string;
  description?: string;
  version?: string;
  author?: string;
  icon?: string;
  isEnabled: boolean;
  config?: any;
}

// 获取所有插件显示配置
export async function fetchPluginDisplayConfigs(): Promise<PluginDisplayConfig[]> {
  const res = await fetch(`${API_BASE}/api/v2/plugin-display-configs`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('获取插件显示配置失败');
  }

  const data = await res.json();
  return data.data || [];
}

// 获取单个插件显示配置
export async function fetchPluginDisplayConfig(pluginId: string): Promise<PluginDisplayConfig> {
  const res = await fetch(`${API_BASE}/api/v2/plugin-display-configs/${pluginId}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('获取插件显示配置失败');
  }

  const data = await res.json();
  return data.data;
}

// 获取所有启用的插件（公开接口，无需认证）
export async function fetchEnabledPlugins(): Promise<Plugin[]> {
  const res = await fetch(`${API_BASE}/api/v2/plugins/public/list`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('获取插件列表失败');
  }

  const data = await res.json();
  return data.data || [];
}

// 默认网格位置
export const DEFAULT_GRID_POSITION: GridPosition = {
  colStart: 1,
  colEnd: 13,
  rowStart: 1,
  rowEnd: 2,
};

// 默认显示配置
export const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  visible: true,
  responsive: {
    mobile: { colStart: 1, colEnd: 13 },
    tablet: { colStart: 1, colEnd: 13 },
    desktop: { colStart: 1, colEnd: 13 },
  },
};

// 默认样式配置
export const DEFAULT_STYLE_CONFIG: StyleConfig = {
  colors: {
    background: 'transparent',
    text: '',
    border: '',
  },
  typography: {
    fontSize: '',
    fontFamily: '',
    fontWeight: '',
  },
  spacing: {
    padding: '',
    margin: '',
  },
  effects: {
    opacity: 1,
    blur: 0,
    shadow: '',
    animation: '',
  },
};

// 默认交互配置
export const DEFAULT_INTERACTION_CONFIG: InteractionConfig = {
  draggable: false,
  resizable: false,
  clickable: true,
};

// 层级选项
export const LAYER_OPTIONS: { value: PluginLayer; label: string; description: string }[] = [
  { value: 'background', label: '背景层', description: '最底层，用于背景效果' },
  { value: 'base', label: '基础层', description: '页面基础内容层' },
  { value: 'content', label: '内容层', description: '主要内容展示层（默认）' },
  { value: 'overlay', label: '遮罩层', description: '覆盖在内容之上的层' },
  { value: 'modal', label: '弹窗层', description: '最高层，用于弹窗和对话框' },
];

// 生成网格位置CSS
export function generateGridStyle(gridPosition: GridPosition): React.CSSProperties {
  return {
    gridColumnStart: gridPosition.colStart,
    gridColumnEnd: gridPosition.colEnd,
    gridRowStart: gridPosition.rowStart,
    gridRowEnd: gridPosition.rowEnd,
  };
}

// 生成样式配置CSS
export function generateStyleConfigCSS(styleConfig: StyleConfig): React.CSSProperties {
  const styles: React.CSSProperties = {};

  if (styleConfig.colors) {
    if (styleConfig.colors.background) {
      styles.backgroundColor = styleConfig.colors.background;
    }
    if (styleConfig.colors.text) {
      styles.color = styleConfig.colors.text;
    }
    if (styleConfig.colors.border) {
      styles.borderColor = styleConfig.colors.border;
    }
  }

  if (styleConfig.typography) {
    if (styleConfig.typography.fontSize) {
      styles.fontSize = styleConfig.typography.fontSize;
    }
    if (styleConfig.typography.fontFamily) {
      styles.fontFamily = styleConfig.typography.fontFamily;
    }
    if (styleConfig.typography.fontWeight) {
      styles.fontWeight = styleConfig.typography.fontWeight;
    }
  }

  if (styleConfig.spacing) {
    if (styleConfig.spacing.padding) {
      styles.padding = styleConfig.spacing.padding;
    }
    if (styleConfig.spacing.margin) {
      styles.margin = styleConfig.spacing.margin;
    }
  }

  if (styleConfig.effects) {
    if (styleConfig.effects.opacity !== undefined) {
      styles.opacity = styleConfig.effects.opacity;
    }
    if (styleConfig.effects.blur) {
      styles.filter = `blur(${styleConfig.effects.blur}px)`;
    }
    if (styleConfig.effects.shadow) {
      styles.boxShadow = styleConfig.effects.shadow;
    }
  }

  return styles;
}
