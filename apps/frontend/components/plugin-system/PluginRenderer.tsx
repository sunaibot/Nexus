'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchPluginDisplayConfigs,
  fetchEnabledPlugins,
  PluginDisplayConfig,
  Plugin,
} from '../../lib/plugin-display-config-api';
import { PluginGridContainer } from './PluginGridContainer';
import { PluginSlot } from './PluginSlot';

// 动态导入插件组件
const pluginComponents: Record<string, React.ComponentType<any>> = {};

// 插件注册函数
export function registerPlugin(name: string, component: React.ComponentType<any>) {
  pluginComponents[name] = component;
}

// 获取插件组件
function getPluginComponent(pluginName: string): React.ComponentType<any> | null {
  // 尝试直接匹配
  if (pluginComponents[pluginName]) {
    return pluginComponents[pluginName];
  }

  // 尝试小写匹配
  const lowerName = pluginName.toLowerCase();
  for (const [key, component] of Object.entries(pluginComponents)) {
    if (key.toLowerCase() === lowerName) {
      return component;
    }
  }

  return null;
}

interface PluginRendererProps {
  className?: string;
}

export function PluginRenderer({ className = '' }: PluginRendererProps) {
  const [displayConfigs, setDisplayConfigs] = useState<PluginDisplayConfig[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 并行获取插件列表和显示配置
      const [pluginsData, configsData] = await Promise.all([
        fetchEnabledPlugins(),
        fetchPluginDisplayConfigs(),
      ]);

      setPlugins(pluginsData);
      setDisplayConfigs(configsData);
    } catch (err) {
      console.error('加载插件失败:', err);
      setError('加载插件失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 按层级分组
  const groupedByLayer = displayConfigs.reduce((acc, config) => {
    if (!config.displayConfig.visible) return acc;

    const layer = config.layer;
    if (!acc[layer]) {
      acc[layer] = [];
    }
    acc[layer].push(config);
    return acc;
  }, {} as Record<string, PluginDisplayConfig[]>);

  // 层级顺序
  const layerOrder = ['background', 'base', 'content', 'overlay', 'modal'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 按层级渲染 */}
      {layerOrder.map((layer) => {
        const layerConfigs = groupedByLayer[layer];
        if (!layerConfigs || layerConfigs.length === 0) return null;

        return (
          <PluginGridContainer
            key={layer}
            className="absolute inset-0"
          >
            <AnimatePresence>
              {layerConfigs.map((config) => {
                const plugin = plugins.find((p) => p.id === config.pluginId);
                const PluginComponent = plugin
                  ? getPluginComponent(plugin.name)
                  : null;

                return (
                  <PluginSlot
                    key={config.id}
                    pluginId={config.pluginId}
                    gridPosition={config.gridPosition}
                    layer={config.layer}
                    zIndex={config.zIndex}
                    styleConfig={config.styleConfig}
                    interactionConfig={config.interactionConfig}
                  >
                    {PluginComponent ? (
                      <PluginComponent
                        plugin={plugin}
                        config={plugin?.config}
                        displayConfig={config}
                      />
                    ) : (
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          插件 &quot;{plugin?.name || config.pluginId}&quot; 未找到对应的组件
                        </p>
                      </div>
                    )}
                  </PluginSlot>
                );
              })}
            </AnimatePresence>
          </PluginGridContainer>
        );
      })}
    </div>
  );
}

// 导出注册函数供其他模块使用
export { registerPlugin as registerFrontendPlugin };
