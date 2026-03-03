/**
 * 自定义插件列表
 * 显示所有启用的自定义插件
 */

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import CustomPluginRenderer from './CustomPluginRenderer'
import { getEnabledCustomPlugins, type CustomPluginContent } from '../../lib/api-client/custom-plugins'

interface CustomPluginListProps {
  className?: string
}

export default function CustomPluginList({ className }: CustomPluginListProps) {
  const [plugins, setPlugins] = useState<CustomPluginContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlugins = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getEnabledCustomPlugins()
      setPlugins(data)
    } catch (err) {
      console.error('加载自定义插件列表失败:', err)
      setError('加载插件列表失败')
      setPlugins([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlugins()
  }, [loadPlugins])

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        {error}
      </div>
    )
  }

  if (plugins.length === 0) {
    return null
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {plugins.map((plugin, index) => (
        <motion.div
          key={plugin.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800"
        >
          {/* 插件标题 */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <span className="text-2xl">{plugin.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {plugin.name}
              </h3>
              {plugin.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {plugin.description}
                </p>
              )}
            </div>
          </div>
          
          {/* 插件内容 */}
          <div className="p-4">
            <CustomPluginRenderer pluginId={plugin.id} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
