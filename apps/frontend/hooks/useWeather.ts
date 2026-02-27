import { useState, useEffect, useCallback } from 'react'
import * as weatherApi from '../lib/api-client/weather'

// 天气数据接口
export interface WeatherData {
  temperature: number        // 温度 (°C)
  feelsLike: number         // 体感温度
  humidity: number          // 湿度 (%)
  description: string       // 天气描述
  icon: string              // 天气图标代码
  city: string              // 城市名
  windSpeed: number         // 风速 (m/s)
  windDirection: string     // 风向
  visibility: number        // 能见度 (km)
  pressure: number          // 气压 (hPa)
  sunrise: string           // 日出时间
  sunset: string           // 日落时间
  isDay: boolean            // 是否白天
}

// 天气图标映射（后端返回的emoji直接使用）
export function getWeatherIcon(icon: string): string {
  return icon || '🌤️'
}

export function useWeather(enabled: boolean = true) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await weatherApi.fetchWeather(lat, lon)
      setWeather(data)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取天气失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    if (!enabled) return
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude)
        },
        (err) => {
          // 定位失败，使用默认位置 (北京)
          console.warn('定位失败，使用默认位置:', err.message)
          fetchWeather(39.9042, 116.4074)
        },
        { timeout: 10000, enableHighAccuracy: false }
      )
    } else {
      // 不支持定位，使用默认位置
      fetchWeather(39.9042, 116.4074)
    }
  }, [enabled, fetchWeather])

  useEffect(() => {
    if (!enabled) {
      setWeather(null)
      return
    }
    
    // 初始获取
    refresh()
    
    // 每 30 分钟更新一次
    const interval = setInterval(refresh, 30 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [enabled, refresh])

  return {
    weather,
    loading,
    error,
    lastUpdate,
    refresh,
  }
}
