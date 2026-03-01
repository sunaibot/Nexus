/**
 * Todo List 后台管理模块
 */

import { Settings } from 'lucide-react'
import type { Module } from '@/core/module-system'
import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8787'

function TodoListManager() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      setLoading(true)
      // const res = await fetch(`${API_BASE}/api/v2/todo-list/data`, {
      //   credentials: 'include'
      // })
      // if (res.ok) {
      //   const result = await res.json()
      //   setData(result.data || [])
      // }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" />
          Todo List管理
        </h1>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-white/50">加载中...</div>
      ) : (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">Todo List 管理后台</p>
          <p className="text-sm text-white/30 mt-2">在这里实现你的管理功能</p>
        </div>
      )}
    </div>
  )
}

const TodoListModule: Module = {
  id: 'todo-list',
  name: 'Todo List管理',
  description: 'Todo List插件的后台管理',
  version: '1.0.0',
  icon: Settings,
  enabled: true,
  routes: [
    {
      path: '/todo-list',
      component: TodoListManager,
      exact: true
    }
  ],
  sidebarItem: {
    id: 'todo-list',
    label: 'Todo List管理',
    icon: Settings,
    order: 90
  }
}

export default TodoListModule
