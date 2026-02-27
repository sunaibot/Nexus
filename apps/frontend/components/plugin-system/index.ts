/**
 * 插件系统导出
 * 提供插件网格系统、渲染器和注册功能
 */

export { PluginGridContainer } from './PluginGridContainer';
export { PluginSlot } from './PluginSlot';
export { PluginRenderer, registerFrontendPlugin } from './PluginRenderer';

// 导出类型
export type {
  PluginDisplayConfig,
  Plugin,
  GridPosition,
  PluginLayer,
  DisplayConfig,
  StyleConfig,
  InteractionConfig,
} from '../../lib/plugin-display-config-api';
