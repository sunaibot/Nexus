/**
 * 置顶书签悬浮卡片组件
 * 放在页面流中，不固定定位，避免与书签列表重叠
 */

import React from 'react'
import { HeroCard } from '../../../components/HeroCard'
import type { Bookmark } from '../../../types/bookmark'

interface PinnedBookmarkProps {
  bookmark: Bookmark | null
  onMarkRead: (id: string) => void
}

export function PinnedBookmark({ bookmark, onMarkRead }: PinnedBookmarkProps) {
  if (!bookmark) return null

  return (
    <div className="mt-8 mb-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center">
          <HeroCard
            bookmark={bookmark}
            onArchive={onMarkRead}
            onMarkRead={onMarkRead}
          />
        </div>
      </div>
    </div>
  )
}
