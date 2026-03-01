/**
 * 天气路由 - V2版本
 * 后端代理天气API，避免前端直接暴露用户IP
 */

import { Router, Request, Response } from 'express'
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/index.js'
import { successResponse, errorResponse } from '../utils/routeHelpers.js'

const router = Router()

// 天气数据接口
export interface WeatherData {
  temperature: number
  feelsLike: number
  humidity: number
  description: string
  icon: string
  city: string
  windSpeed: number
  windDirection: string
  visibility: number
  pressure: number
  sunrise: string
  sunset: string
  isDay: boolean
}

// 天气图标映射
const weatherIcons: Record<string, string> = {
  '0': '☀️',   // 晴天
  '1': '🌤️',  // 少云
  '2': '⛅',  // 多云
  '3': '☁️',  // 阴天
  '45': '🌫️', // 雾
  '48': '🌫️', // 雾凇
  '51': '🌧️', // 毛毛雨
  '53': '🌧️', // 中度毛毛雨
  '55': '🌧️', // 大毛毛雨
  '61': '🌧️', // 小雨
  '63': '🌧️', // 中雨
  '65': '🌧️', // 大雨
  '71': '❄️',  // 小雪
  '73': '❄️',  // 中雪
  '75': '❄️',  // 大雪
  '77': '❄️',  // 雪粒
  '80': '🌦️', // 阵雨
  '81': '🌦️', // 强阵雨
  '82': '🌦️', // 暴雨
  '85': '🌨️', // 阵雪
  '86': '🌨️', // 强阵雪
  '95': '⛈️', // 雷雨
  '96': '⛈️', // 雷雨伴冰雹
  '99': '⛈️', // 强雷雨伴冰雹
}

// 天气描述映射
const weatherDescriptions: Record<string, string> = {
  '0': '晴',
  '1': '少云',
  '2': '多云',
  '3': '阴',
  '45': '雾',
  '48': '雾凇',
  '51': '毛毛雨',
  '53': '中度毛毛雨',
  '55': '大毛毛雨',
  '61': '小雨',
  '63': '中雨',
  '65': '大雨',
  '71': '小雪',
  '73': '中雪',
  '75': '大雪',
  '77': '雪粒',
  '80': '阵雨',
  '81': '强阵雨',
  '82': '暴雨',
  '85': '阵雪',
  '86': '强阵雪',
  '95': '雷雨',
  '96': '雷雨伴冰雹',
  '99': '强雷雨伴冰雹',
}

// 风向转换
function getWindDirection(deg: number): string {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const index = Math.round(deg / 45) % 8
  return directions[index] + '风'
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 获取天气数据
router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { lat, lon, city } = req.query
    
    if (!lat || !lon) {
      return errorResponse(res, '缺少经纬度参数', 400)
    }
    
    const latitude = parseFloat(lat as string)
    const longitude = parseFloat(lon as string)
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return errorResponse(res, '经纬度参数无效', 400)
    }
    
    // 使用 Open-Meteo 免费 API (无需 API Key)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility&daily=sunrise,sunset&timezone=auto`
    )
    
    if (!response.ok) {
      throw new Error(`天气API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    
    const current = data.current
    const daily = data.daily
    const weatherCode = String(current.weather_code)
    
    const weatherData: WeatherData = {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      description: weatherDescriptions[weatherCode] || '未知天气',
      icon: weatherIcons[weatherCode] || '🌤️',
      city: (city as string) || '当前位置',
      windSpeed: current.wind_speed_10m,
      windDirection: getWindDirection(current.wind_direction_10m),
      visibility: current.visibility ? current.visibility / 1000 : 10,
      pressure: current.surface_pressure,
      sunrise: formatTime(daily.sunrise[0]),
      sunset: formatTime(daily.sunset[0]),
      isDay: current.is_day === 1,
    }
    
    return successResponse(res, weatherData)
  } catch (error) {
    console.error('获取天气数据失败:', error)
    return errorResponse(res, '获取天气数据失败')
  }
})

// 根据城市名获取天气（使用地理编码）
router.get('/city', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name } = req.query
    
    if (!name) {
      return errorResponse(res, '缺少城市名称', 400)
    }
    
    // 使用 Open-Meteo 地理编码API获取城市坐标
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name as string)}&count=1&language=zh&format=json`
    )
    
    if (!geoResponse.ok) {
      throw new Error(`地理编码API请求失败: ${geoResponse.status}`)
    }
    
    const geoData = await geoResponse.json()
    
    if (!geoData.results || geoData.results.length === 0) {
      return errorResponse(res, '未找到该城市', 404)
    }
    
    const city = geoData.results[0]
    
    // 使用获取到的坐标请求天气数据
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility&daily=sunrise,sunset&timezone=auto`
    )
    
    if (!weatherResponse.ok) {
      throw new Error(`天气API请求失败: ${weatherResponse.status}`)
    }
    
    const data = await weatherResponse.json()
    
    const current = data.current
    const daily = data.daily
    const weatherCode = String(current.weather_code)
    
    const weatherData: WeatherData = {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      description: weatherDescriptions[weatherCode] || '未知天气',
      icon: weatherIcons[weatherCode] || '🌤️',
      city: city.name,
      windSpeed: current.wind_speed_10m,
      windDirection: getWindDirection(current.wind_direction_10m),
      visibility: current.visibility ? current.visibility / 1000 : 10,
      pressure: current.surface_pressure,
      sunrise: formatTime(daily.sunrise[0]),
      sunset: formatTime(daily.sunset[0]),
      isDay: current.is_day === 1,
    }
    
    return successResponse(res, weatherData)
  } catch (error) {
    console.error('获取城市天气数据失败:', error)
    return errorResponse(res, '获取城市天气数据失败')
  }
})

export default router
