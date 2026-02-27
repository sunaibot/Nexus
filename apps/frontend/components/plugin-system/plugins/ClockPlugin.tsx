'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface ClockPluginProps {
  plugin?: any;
  config?: any;
}

export function ClockPlugin({ config }: ClockPluginProps) {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted || !time) {
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

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const year = time.getFullYear();
  const month = (time.getMonth() + 1).toString().padStart(2, '0');
  const day = time.getDate().toString().padStart(2, '0');
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[time.getDay()];

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full p-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-blue-500" />
        <span className="text-sm text-gray-500 dark:text-gray-400">当前时间</span>
      </div>
      <div className="text-4xl md:text-5xl font-bold font-mono tracking-wider">
        {hours}:{minutes}:{seconds}
      </div>
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {year}年{month}月{day}日 {weekDay}
      </div>
    </motion.div>
  );
}
