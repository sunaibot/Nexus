import { request } from './client'

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

// 获取天气数据（通过经纬度）
export async function fetchWeather(lat: number, lon: number, city?: string): Promise<WeatherData> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
  })
  if (city) {
    params.append('city', city)
  }
  return request<WeatherData>(`/v2/weather?${params.toString()}`, {
    requireAuth: false, // 天气数据可以公开访问
  })
}

// 根据城市名获取天气
export async function fetchWeatherByCity(city: string): Promise<WeatherData> {
  return request<WeatherData>(`/v2/weather/city?name=${encodeURIComponent(city)}`, {
    requireAuth: false,
  })
}
