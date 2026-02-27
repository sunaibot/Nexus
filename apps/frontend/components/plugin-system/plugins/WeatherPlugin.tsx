'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, CloudSnow, Wind } from 'lucide-react';

interface WeatherData {
  city: string;
  temperature: number;
  weather: string;
  humidity: number;
  windSpeed: number;
}

interface WeatherPluginProps {
  plugin?: any;
  config?: any;
}

export function WeatherPlugin({ config }: WeatherPluginProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      setIsLoading(true);
      // 模拟天气数据（实际项目中应该调用真实的天气API）
      // 这里使用模拟数据演示
      setTimeout(() => {
        setWeather({
          city: config?.city || '北京',
          temperature: 22,
          weather: '晴',
          humidity: 45,
          windSpeed: 3,
        });
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('获取天气失败:', error);
      setIsLoading(false);
    }
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case '晴':
        return <Sun className="w-12 h-12 text-yellow-500" />;
      case '多云':
        return <Cloud className="w-12 h-12 text-gray-400" />;
      case '雨':
        return <CloudRain className="w-12 h-12 text-blue-400" />;
      case '雪':
        return <CloudSnow className="w-12 h-12 text-blue-200" />;
      default:
        return <Sun className="w-12 h-12 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[100px]">
        <motion.div
          className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">无法获取天气信息</p>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-4">
        {getWeatherIcon(weather.weather)}
        <div>
          <div className="text-3xl font-bold">{weather.temperature}°C</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{weather.weather}</div>
        </div>
      </div>
      <div className="mt-4 text-center">
        <div className="text-lg font-medium">{weather.city}</div>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Wind className="w-4 h-4" />
            {weather.windSpeed}m/s
          </span>
          <span>湿度 {weather.humidity}%</span>
        </div>
      </div>
    </motion.div>
  );
}
