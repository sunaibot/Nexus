/**
 * 插件插槽组件
 * 渲染指定位置的所有插件
 */

import React from 'react'
import { motion } from 'framer-motion'
import { usePluginSlots } from '../hooks/usePluginSlots'
import type { SlotPosition } from '../types'

interface PluginSlotProps {
  slot: SlotPosition
  className?: string
  fallback?: React.ReactNode
}

export function PluginSlot({ slot, className = '', fallback }: PluginSlotProps) {
  const { plugins, isLoading, error } = usePluginSlots(slot)

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <motion.div
          className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  if (error) {
    console.error(`[PluginSlot ${slot}] Error:`, error)
    return null
  }

  if (plugins.length === 0) {
    return fallback || null
  }

  return (
    <div className={`plugin-slot plugin-slot-${slot} ${className}`}>
      {plugins.map(({ config, component: Component, plugin }) => (
        <motion.div
          key={config.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="plugin-item"
        >
          <Component 
            config={{ ...plugin?.defaultConfig, ...config.config }}
            plugin={plugin}
          />
        </motion.div>
      ))}
    </div>
  )
}

export default PluginSlot
