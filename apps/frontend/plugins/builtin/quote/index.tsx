/**
 * 名言插件
 * 显示每日名言
 */

import { useEffect, useState } from 'react'
import { Quote as QuoteIcon } from 'lucide-react'
import type { PluginComponentProps } from '../../types'

interface QuoteData {
  content: string
  author: string
  source?: string
}

const defaultQuotes: QuoteData[] = [
  { content: '知之者不如好之者，好之者不如乐之者。', author: '孔子' },
  { content: '生活不是等待风暴过去，而是学会在雨中翩翩起舞。', author: '维维安·格林' },
  { content: '未经过审视的人生是不值得过的。', author: '苏格拉底' },
  { content: '千里之行，始于足下。', author: '老子' },
  { content: '成功不是终点，失败也不是末日，继续前进的勇气才最可贵。', author: '温斯顿·丘吉尔' },
]

export default function QuotePlugin({ config }: PluginComponentProps) {
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟获取名言
    const fetchQuote = async () => {
      try {
        // 这里可以接入真实的 API
        // const response = await fetch('/api/quotes/random')
        // const data = await response.json()
        
        // 使用默认名言
        const randomIndex = Math.floor(Math.random() * defaultQuotes.length)
        setTimeout(() => {
          setQuote(defaultQuotes[randomIndex])
          setLoading(false)
        }, 300)
      } catch (error) {
        console.error('获取名言失败:', error)
        setLoading(false)
      }
    }

    fetchQuote()
  }, [])

  if (loading) {
    return (
      <div className="px-4 py-3 rounded-lg bg-white/5 animate-pulse">
        <div className="h-4 w-3/4 rounded bg-white/10 mb-2" />
        <div className="h-3 w-1/4 rounded bg-white/10" />
      </div>
    )
  }

  if (!quote) {
    return null
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <QuoteIcon className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
      <div className="flex flex-col gap-1">
        <p className="text-sm text-white/90 leading-relaxed">
          {quote.content}
        </p>
        <span className="text-xs text-white/50">
          —— {quote.author}
        </span>
      </div>
    </div>
  )
}
