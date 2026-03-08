import React from 'react';
import { motion } from 'framer-motion';
import { Bookmark as BookmarkIcon, Compass } from 'lucide-react';
import { Sparkles } from '../ui/effects';

interface EmptyStateProps {
  isLiteMode?: boolean;
  onAddBookmark: () => void;
  isLoggedIn?: boolean;
}

export function EmptyState({ isLiteMode, onAddBookmark, isLoggedIn = false }: EmptyStateProps) {
  return (
    <motion.div
      className="text-center py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-nebula-purple/20 to-nebula-pink/20 flex items-center justify-center">
        {isLiteMode ? (
          <BookmarkIcon className="w-10 h-10" style={{ color: 'var(--color-text-muted)' }} />
        ) : (
          <Sparkles>
            <BookmarkIcon className="w-10 h-10" style={{ color: 'var(--color-text-muted)' }} />
          </Sparkles>
        )}
      </div>
      <h3 className="text-2xl font-serif mb-4" style={{ color: 'var(--color-text-primary)' }}>
        {isLoggedIn ? '开启你的星云之旅' : '探索精彩世界'}
      </h3>
      <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
        {isLoggedIn ? (
          <>
            按{' '}
            <kbd className="px-2 py-1 rounded text-xs" style={{ background: 'var(--color-bg-tertiary)' }}>
              ⌘K
            </kbd>{' '}
            打开命令面板，粘贴链接即可添加第一个书签
          </>
        ) : (
          <>
            登录后可添加和管理书签，打造属于你的个性化导航页
          </>
        )}
      </p>
      {isLoggedIn ? (
        <motion.button
          onClick={onAddBookmark}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-nebula-purple to-nebula-pink text-white font-medium shadow-glow-md"
          whileHover={{ scale: isLiteMode ? 1.02 : 1.05 }}
          whileTap={{ scale: isLiteMode ? 0.98 : 0.95 }}
        >
          添加第一个书签
        </motion.button>
      ) : (
        <motion.div
          className="flex items-center justify-center gap-2 text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Compass className="w-4 h-4" />
          <span>浏览公开书签或登录以开始</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export default EmptyState;
