'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Command } from 'lucide-react';

interface SearchPluginProps {
  plugin?: any;
  config?: any;
}

export function SearchPlugin({ config }: SearchPluginProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // 默认使用百度搜索，可以通过配置修改
      const searchEngine = config?.searchEngine || 'https://www.baidu.com/s?wd=';
      window.open(`${searchEngine}${encodeURIComponent(query)}`, '_blank');
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSearch} className="w-full max-w-xl">
        <div
          className={`relative flex items-center bg-white dark:bg-gray-800 rounded-full shadow-lg transition-all duration-300 ${
            isFocused ? 'ring-2 ring-blue-500 shadow-xl' : ''
          }`}
        >
          <Search className="absolute left-4 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={config?.placeholder || '搜索...'}
            className="w-full py-3 pl-12 pr-16 bg-transparent rounded-full outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
          />
          <div className="absolute right-4 flex items-center gap-1 text-xs text-gray-400">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {['百度', 'Google', 'Bing'].map((engine) => (
            <button
              key={engine}
              type="button"
              onClick={() => {
                const engines: Record<string, string> = {
                  百度: 'https://www.baidu.com/s?wd=',
                  Google: 'https://www.google.com/search?q=',
                  Bing: 'https://www.bing.com/search?q=',
                };
                if (query.trim()) {
                  window.open(`${engines[engine]}${encodeURIComponent(query)}`, '_blank');
                }
              }}
              className="px-3 py-1 text-sm text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
            >
              {engine}
            </button>
          ))}
        </div>
      </form>
    </motion.div>
  );
}
