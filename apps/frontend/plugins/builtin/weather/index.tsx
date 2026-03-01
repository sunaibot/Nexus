/**
 * 天气插件
 * 显示当前天气信息
 */

import { useEffect, useState } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react'
import type { PluginComponentProps } from '../../types'

interface WeatherData {
  temperature: number
  condition: string
  location: string
  humidity?: number
  windSpeed?: number
}

export default function WeatherPlugin({ config }: PluginComponentProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟获取天气数据
    // 实际应用中应该调用天气 API
    const fetchWeather = async () => {
      try {
        // 这里可以接入真实的天气 API
        // const response = await fetch('/api/weather')
        // const data = await response.json()
        
        // 模拟数据
        setTimeout(() => {
          setWeather({
            temperature: 22,
            condition: 'sunny',
            location: config?.location || '北京',
            humidity: 45,
            windSpeed: 3,
          })
          setLoading(false)
        }, 500)
      } catch (error) {
        console.error('获取天气失败:', error)
        setLoading(false)
      }
    }

    fetchWeather()
  }, [config?.location])

  const getWeatherIcon = () => {
    switch (weather?.condition) {
      case 'sunny':
        return <Sun className="w-6 h-6 text-yellow-400" />
      case 'cloudy':
        return <Cloud className="w-6 h-6 text-gray-400" />
      case 'rainy':
        return <CloudRain className="w-6 h-6 text-blue-400" />
      case 'snowy':
        return <CloudSnow className="w-6 h-6 text-white" />
      case 'stormy':
        return <CloudLightning className="w-6 h-6 text-purple-400" />
      default:
        return <Sun className="w-6 h-6 text-yellow-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 animate-pulse">
        <div className="w-6 h-6 rounded-full bg-white/10" />
        <div className="w-16 h-4 rounded bg-white/10" />
      </div>
    )
  }

  if (!weather) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
      {getWeatherIcon()}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">
          {weather.temperature}°C
        </span>
        <span className="text-xs text-white/60">
          {weather.location}
        </span>
      </div>
    </div>
  )
}
