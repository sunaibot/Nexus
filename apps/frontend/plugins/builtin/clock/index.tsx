/**
 * 时钟插件
 * 显示当前时间和日期
 */

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import type { PluginComponentProps } from '../../types'

export default function ClockPlugin({ config }: PluginComponentProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: config?.showSeconds ? '2-digit' : undefined,
      hour12: config?.use12Hour ?? false,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    })
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <Clock className="w-5 h-5 text-white/70" />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white tabular-nums">
          {formatTime(time)}
        </span>
        <span className="text-xs text-white/60">
          {formatDate(time)}
        </span>
      </div>
    </div>
  )
}
