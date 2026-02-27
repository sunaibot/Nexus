import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, Check, BookmarkPlus, ChevronDown, Link2, Image, FolderPlus, Search, Network, Tag, FileText, Eye, EyeOff, Globe, User, Shield, Sparkles, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Bookmark, Category } from '../../../types/bookmark'
import { metadataApi, categoryApi } from '../../../lib/api'
import { cn } from '../../../lib/utils'
import { presetIcons } from '../../../lib/icons'
import { IconRenderer } from '../../../components/IconRenderer'

interface BookmarkFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (bookmark: Partial<Bookmark>) => void
  categories: Category[]
  initialUrl?: string
  editBookmark?: Bookmark | null
}

// 骨架屏组件
function FieldSkeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

// 表单分区块标题
function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
      <Icon className="w-4 h-4" />
      {title}
    </div>
  )
}

export function BookmarkFormModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialUrl = '',
  editBookmark = null,
}: BookmarkFormModalProps) {
  const { t, i18n } = useTranslation()
  
  // 基础信息
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  
  // 扩展信息
  const [internalUrl, setInternalUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  
  // 图标和分类
  const [favicon, setFavicon] = useState('')
  const [icon, setIcon] = useState('')
  const [iconUrl, setIconUrl] = useState('')
  const [category, setCategory] = useState('')
  const [showIconPicker, setShowIconPicker] = useState(false)
  
  // 设置
  const [visibility, setVisibility] = useState<'public' | 'personal' | 'private'>('personal')
  const [isReadLater, setIsReadLater] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  
  // UI状态
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [activeSection, setActiveSection] = useState<'basic' | 'advanced'>('basic')
  
  // 新增分类
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  
  // 预设颜色
  const categoryColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]
  const [selectedColor, setSelectedColor] = useState(categoryColors[0])

  const inputRef = useRef<HTMLInputElement>(null)
  const iconPickerRef = useRef<HTMLDivElement>(null)

  // 编辑模式初始化
  useEffect(() => {
    if (editBookmark) {
      setUrl(editBookmark.url)
      setTitle(editBookmark.title)
      setDescription(editBookmark.description || '')
      setInternalUrl(editBookmark.internalUrl || '')
      setNotes(editBookmark.notes || '')
      setTags(editBookmark.tags || [])
      setFavicon(editBookmark.favicon || '')
      setIcon(editBookmark.icon || '')
      setIconUrl(editBookmark.iconUrl || '')
      setCategory(editBookmark.category || '')
      setVisibility(editBookmark.visibility || 'personal')
      setIsReadLater(editBookmark.isReadLater || false)
      setIsPinned(editBookmark.isPinned || false)
      setHasAnalyzed(true)
    } else if (initialUrl) {
      setUrl(initialUrl)
      analyzeUrl(initialUrl)
    }
  }, [editBookmark, initialUrl])

  // 打开时聚焦
  useEffect(() => {
    if (isOpen && !editBookmark) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, editBookmark])

  // 重置表单
  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setUrl('')
    setTitle('')
    setDescription('')
    setInternalUrl('')
    setNotes('')
    setTags([])
    setTagInput('')
    setFavicon('')
    setIcon('')
    setIconUrl('')
    setCategory('')
    setVisibility('personal')
    setIsReadLater(false)
    setIsPinned(false)
    setError('')
    setHasAnalyzed(false)
    setShowIconPicker(false)
    setActiveSection('basic')
    setShowAddCategory(false)
    setNewCategoryName('')
  }

  // 点击外部关闭图标选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setShowIconPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 智能抓取元数据
  const analyzeUrl = async (inputUrl: string) => {
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      return
    }

    setIsAnalyzing(true)
    setHasAnalyzed(false)
    setError('')
    setTitle('')
    setDescription('')
    setFavicon('')

    try {
      const metadata = await metadataApi.parse(inputUrl, i18n.language)
      
      if (metadata.error) {
        throw new Error(metadata.error)
      }

      setTitle(metadata.title || '')
      setDescription(metadata.description || '')
      setFavicon(metadata.favicon || '')
      setHasAnalyzed(true)
    } catch (err) {
      console.error('抓取失败:', err)
      try {
        const urlObj = new URL(inputUrl)
        const domain = urlObj.hostname.replace('www.', '')
        setTitle(domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0])
        setFavicon(`https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`)
        setHasAnalyzed(true)
        setShake(true)
        setTimeout(() => setShake(false), 500)
      } catch {
        setError(t('bookmark.modal.url_parse_error'))
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 监听粘贴事件
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text')
    if (pastedText.startsWith('http://') || pastedText.startsWith('https://')) {
      setTimeout(() => analyzeUrl(pastedText), 100)
    }
  }

  const handleUrlBlur = () => {
    if (url && !hasAnalyzed) {
      analyzeUrl(url)
    }
  }

  // 添加标签
  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }, [tagInput, tags])

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // 递归渲染分类选项（支持多级目录）
  const renderCategoryOptions = (cats: Category[], level = 0, parentId: string | null = null): JSX.Element[] => {
    const filteredCats = cats.filter(c => c.parentId === parentId)
    const result: JSX.Element[] = []

    filteredCats.forEach(cat => {
      const indent = level > 0 ? '  '.repeat(level) + '├── ' : ''
      result.push(
        <option key={cat.id} value={cat.id}>
          {indent}{cat.name}
        </option>
      )
      // 递归添加子分类
      const children = renderCategoryOptions(cats, level + 1, cat.id)
      result.push(...children)
    })

    return result
  }

  // 添加新分类
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    
    setIsAddingCategory(true)
    try {
      const newCategory = await categoryApi.create({
        name: newCategoryName.trim(),
        color: selectedColor,
      })
      setCategory(newCategory.id)
      setShowAddCategory(false)
      setNewCategoryName('')
    } catch (err) {
      console.error('Failed to add category:', err)
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleSubmit = () => {
    if (!url || !title) {
      setError(t('bookmark.modal.required_error'))
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    onSubmit({
      url,
      internalUrl: internalUrl || null,
      title,
      description: description || null,
      notes: notes || null,
      favicon: favicon || null,
      icon: icon || null,
      iconUrl: iconUrl || null,
      category: category || null,
      tags,
      isReadLater,
      isPinned,
      visibility,
    })

    onClose()
  }

  const visibilityOptions = [
    { value: 'public', label: '公开', icon: Globe, color: '#22c55e', desc: '所有人可见' },
    { value: 'personal', label: '个人', icon: User, color: '#3b82f6', desc: '仅自己可见' },
    { value: 'private', label: '私密', icon: Shield, color: '#ef4444', desc: '需要密码访问' },
  ] as const

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 模态框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0,
              x: shake ? [0, -10, 10, -10, 10, 0] : 0,
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              x: { duration: 0.4 }
            }}
            className="fixed z-50 inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[700px] md:max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl"
            style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)' }}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
                  <BookmarkPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {editBookmark ? '编辑书签' : '添加书签'}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {editBookmark ? '修改书签信息' : '添加新的书签到您的收藏'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容区域 */}
            <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
              {/* 标签切换 */}
              <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                <button
                  onClick={() => setActiveSection('basic')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    activeSection === 'basic' ? 'text-white shadow-lg' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  )}
                  style={{ 
                    background: activeSection === 'basic' ? 'var(--color-primary)' : 'transparent',
                  }}
                >
                  <Link2 className="w-4 h-4" />
                  基本信息
                </button>
                <button
                  onClick={() => setActiveSection('advanced')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    activeSection === 'advanced' ? 'text-white shadow-lg' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  )}
                  style={{ 
                    background: activeSection === 'advanced' ? 'var(--color-primary)' : 'transparent',
                  }}
                >
                  <FileText className="w-4 h-4" />
                  高级设置
                </button>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* 基本信息 */}
              {activeSection === 'basic' && (
                <div className="space-y-5">
                  {/* URL 输入 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      网址 URL <span className="text-red-400">*</span>
                      {isAnalyzing && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs" style={{ color: 'var(--color-primary)' }}>
                          <Sparkles className="w-3 h-3 animate-pulse" />
                          智能解析中...
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onBlur={handleUrlBlur}
                        onPaste={handlePaste}
                        placeholder="https://example.com"
                        disabled={!!editBookmark}
                        className="w-full pl-11 pr-4 py-3 rounded-xl transition-all focus:outline-none disabled:opacity-60"
                        style={{
                          background: 'var(--color-glass)',
                          border: '1px solid var(--color-glass-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                      {isAnalyzing && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-primary)' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 标题 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      标题 <span className="text-red-400">*</span>
                    </label>
                    {isAnalyzing ? (
                      <FieldSkeleton className="h-12 w-full" />
                    ) : (
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="书签标题"
                        className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none"
                        style={{
                          background: 'var(--color-glass)',
                          border: '1px solid var(--color-glass-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    )}
                  </div>

                  {/* 描述 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      描述
                    </label>
                    {isAnalyzing ? (
                      <FieldSkeleton className="h-24 w-full" />
                    ) : (
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="添加描述帮助您记住这个书签的用途..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none resize-none"
                        style={{
                          background: 'var(--color-glass)',
                          border: '1px solid var(--color-glass-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    )}
                  </div>

                  {/* 分类选择 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      分类
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl transition-all focus:outline-none cursor-pointer"
                          style={{
                            background: 'var(--color-glass)',
                            border: '1px solid var(--color-glass-border)',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          <option value="">选择分类</option>
                          {renderCategoryOptions(categories)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                      <button
                        onClick={() => setShowAddCategory(!showAddCategory)}
                        className="px-3 py-3 rounded-xl transition-all hover:opacity-80"
                        style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', color: 'var(--color-primary)' }}
                        title="新建分类"
                      >
                        <FolderPlus className="w-5 h-5" />
                      </button>
                    </div>

                    {/* 新建分类表单 */}
                    <AnimatePresence>
                      {showAddCategory && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 p-4 rounded-xl space-y-3" style={{ background: 'var(--color-bg-tertiary)' }}>
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="分类名称"
                              className="w-full px-3 py-2 rounded-lg text-sm"
                              style={{
                                background: 'var(--color-glass)',
                                border: '1px solid var(--color-glass-border)',
                                color: 'var(--color-text-primary)',
                              }}
                            />
                            <div className="flex gap-2">
                              {categoryColors.map(color => (
                                <button
                                  key={color}
                                  onClick={() => setSelectedColor(color)}
                                  className={cn(
                                    'w-6 h-6 rounded-full transition-all',
                                    selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-tertiary)]' : ''
                                  )}
                                  style={{ background: color, '--tw-ring-color': color } as React.CSSProperties}
                                />
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleAddCategory}
                                disabled={isAddingCategory || !newCategoryName.trim()}
                                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                                style={{ background: 'var(--color-primary)' }}
                              >
                                {isAddingCategory ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '添加'}
                              </button>
                              <button
                                onClick={() => setShowAddCategory(false)}
                                className="px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--color-glass)', color: 'var(--color-text-secondary)' }}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 图标选择 */}
                  <div ref={iconPickerRef} className="relative">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      图标
                    </label>
                    <button
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      className="w-full px-4 py-3 rounded-xl transition-all flex items-center justify-between"
                      style={{
                        background: 'var(--color-glass)',
                        border: '1px solid var(--color-glass-border)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {iconUrl ? (
                          <img src={iconUrl} alt="" className="w-6 h-6 rounded object-contain" />
                        ) : icon ? (
                          <IconRenderer icon={icon} className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                        ) : favicon ? (
                          <img src={favicon} alt="" className="w-6 h-6 rounded" />
                        ) : (
                          <Image className="w-6 h-6" style={{ color: 'var(--color-text-muted)' }} />
                        )}
                        <span style={{ color: 'var(--color-text-primary)' }}>
                          {iconUrl ? '自定义图标' : icon ? `预设: ${icon}` : favicon ? '网站图标' : '使用网站默认图标'}
                        </span>
                      </div>
                      <ChevronDown className={cn('w-4 h-4 transition-transform', showIconPicker && 'rotate-180')} style={{ color: 'var(--color-text-muted)' }} />
                    </button>

                    {/* 图标选择器 */}
                    <AnimatePresence>
                      {showIconPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute z-50 left-0 right-0 top-full mt-2 p-4 rounded-xl shadow-xl border"
                          style={{
                            background: 'var(--color-bg-secondary)',
                            borderColor: 'var(--color-glass-border)',
                          }}
                        >
                          <div className="space-y-4">
                            {/* 使用网站图标 */}
                            <button
                              onClick={() => {
                                setIcon('')
                                setIconUrl('')
                                setShowIconPicker(false)
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-[var(--color-glass-hover)]"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              <Image className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                              <span className="text-sm">使用网站默认图标</span>
                            </button>

                            <div className="border-t" style={{ borderColor: 'var(--color-glass-border)' }} />

                            {/* 预设图标 */}
                            <div>
                              <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>预设图标</p>
                              <div className="grid grid-cols-8 gap-2">
                                {presetIcons.slice(0, 16).map(({ name, icon: IconComp }) => (
                                  <button
                                    key={name}
                                    onClick={() => {
                                      setIcon(name)
                                      setIconUrl('')
                                      setShowIconPicker(false)
                                    }}
                                    className={cn(
                                      'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                                      icon === name ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-glass-hover)]'
                                    )}
                                  >
                                    <IconComp className="w-4 h-4" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* 高级设置 */}
              {activeSection === 'advanced' && (
                <div className="space-y-5">
                  {/* 内网链接 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      内网链接
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={internalUrl}
                        onChange={(e) => setInternalUrl(e.target.value)}
                        placeholder="http://192.168.1.1:8080"
                        className="w-full pl-11 pr-4 py-3 rounded-xl transition-all focus:outline-none"
                        style={{
                          background: 'var(--color-glass)',
                          border: '1px solid var(--color-glass-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                      <Network className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      如果该服务在内网可访问，可以添加内网地址
                    </p>
                  </div>

                  {/* 标签 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      标签
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          placeholder="输入标签按回车添加"
                          className="w-full pl-10 pr-4 py-3 rounded-xl transition-all focus:outline-none"
                          style={{
                            background: 'var(--color-glass)',
                            border: '1px solid var(--color-glass-border)',
                            color: 'var(--color-text-primary)',
                          }}
                        />
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                      <button
                        onClick={handleAddTag}
                        disabled={!tagInput.trim()}
                        className="px-4 py-3 rounded-xl font-medium text-white disabled:opacity-50 transition-all"
                        style={{ background: 'var(--color-primary)' }}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm"
                            style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="hover:text-red-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 笔记 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      笔记
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="添加关于这个书签的笔记..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none resize-none"
                      style={{
                        background: 'var(--color-glass)',
                        border: '1px solid var(--color-glass-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>

                  {/* 可见性 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      可见性
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {visibilityOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setVisibility(option.value)}
                          className={cn(
                            'flex flex-col items-center gap-2 p-4 rounded-xl transition-all border-2',
                            visibility === option.value 
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' 
                              : 'border-transparent hover:border-[var(--color-glass-border)]'
                          )}
                          style={{ background: visibility === option.value ? undefined : 'var(--color-glass)' }}
                        >
                          <option.icon className="w-6 h-6" style={{ color: option.color }} />
                          <div className="text-center">
                            <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{option.label}</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{option.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 选项开关 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      选项
                    </label>
                    
                    {/* 稍后读 */}
                    <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors hover:bg-[var(--color-glass-hover)]" style={{ background: 'var(--color-glass)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249, 115, 22, 0.1)' }}>
                          <BookmarkPlus className="w-4 h-4" style={{ color: '#f97316' }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>稍后阅读</div>
                          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>添加到稍后阅读列表</div>
                        </div>
                      </div>
                      <div 
                        className={cn(
                          'w-11 h-6 rounded-full transition-colors relative',
                          isReadLater ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-bg-tertiary)]'
                        )}
                        onClick={() => setIsReadLater(!isReadLater)}
                      >
                        <div className={cn(
                          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                          isReadLater ? 'left-6' : 'left-1'
                        )} />
                      </div>
                    </label>

                    {/* 置顶 */}
                    <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors hover:bg-[var(--color-glass-hover)]" style={{ background: 'var(--color-glass)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
                          <Check className="w-4 h-4" style={{ color: '#eab308' }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>置顶显示</div>
                          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>在列表中优先显示</div>
                        </div>
                      </div>
                      <div 
                        className={cn(
                          'w-11 h-6 rounded-full transition-colors relative',
                          isPinned ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-bg-tertiary)]'
                        )}
                        onClick={() => setIsPinned(!isPinned)}
                      >
                        <div className={cn(
                          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                          isPinned ? 'left-6' : 'left-1'
                        )} />
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--color-glass-border)' }}>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ color: 'var(--color-text-secondary)', background: 'var(--color-glass)' }}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!url || !title || isAnalyzing}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' }}
              >
                {editBookmark ? '保存修改' : '添加书签'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

