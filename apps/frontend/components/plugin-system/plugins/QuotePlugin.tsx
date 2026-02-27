'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

interface QuoteData {
  content: string;
  author: string;
}

interface QuotePluginProps {
  plugin?: any;
  config?: any;
}

export function QuotePlugin({ config }: QuotePluginProps) {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQuote();
  }, []);

  const loadQuote = async () => {
    try {
      setIsLoading(true);
      // 使用一言API获取每日名言
      const response = await fetch('https://v1.hitokoto.cn?c=i&c=d');
      const data = await response.json();
      setQuote({
        content: data.hitokoto,
        author: data.from_who || data.from || '未知',
      });
    } catch (error) {
      console.error('获取名言失败:', error);
      // 使用默认名言
      setQuote({
        content: '生活不是等待风暴过去，而是学会在雨中跳舞。',
        author: '维维安·格林',
      });
    } finally {
      setIsLoading(false);
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

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full p-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Quote className="w-8 h-8 mb-4 text-blue-500 opacity-50" />
      <blockquote className="text-lg md:text-xl font-medium leading-relaxed mb-4">
        &ldquo;{quote?.content}&rdquo;
      </blockquote>
      <cite className="text-sm text-gray-500 dark:text-gray-400 not-italic">
        —— {quote?.author}
      </cite>
      <button
        onClick={loadQuote}
        className="mt-4 px-4 py-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
      >
        换一句
      </button>
    </motion.div>
  );
}
