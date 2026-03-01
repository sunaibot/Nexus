/**
 * Todo List 前台组件
 */

import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import type { PluginComponentProps } from '../../types'

interface TodoListConfig {
  // 在这里定义插件配置
  title?: string
  refreshInterval?: number
}

export function TodoListWidget({ config, slot }: PluginComponentProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const pluginConfig: TodoListConfig = config || {}
  
  useEffect(() => {
    // 在这里加载数据
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      setLoading(true)
      // const response = await fetch('/api/v2/todo-list/data')
      // const result = await response.json()
      // setData(result.data)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-medium">{pluginConfig.title || 'Todo List'}</h3>
      </div>
      <p className="text-sm text-white/60">
        这是 Todo List 插件的前台组件
      </p>
    </div>
  )
}

export default TodoListWidget
