import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, Link2, FileText, Tag, Folder, Globe, User, Lock, Bookmark, Image as ImageIcon, ExternalLink, StickyNote, Upload, Link as LinkIcon, Grid3X3, Code2, Heart, Loader2 } from 'lucide-react'
import { Bookmark as BookmarkType, Category } from '../../../types/bookmark'
import { presetIcons } from '../../../lib/icons'
import { metadataApi } from '../../../lib/api-client/bookmarks'

interface SimpleBookmarkModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (bookmark: Partial<BookmarkType>) => void
  categories: Category[]
  editBookmark?: BookmarkType | null
}

export function SimpleBookmarkModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  editBookmark = null,
}: SimpleBookmarkModalProps) {
  // 基础字段
  const [url, setUrl] = useState('')
  const [internalUrl, setInternalUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  
  // 分类和标签
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  
  // 图标
  const [favicon, setFavicon] = useState('')
  const [icon, setIcon] = useState('')
  const [iconUrl, setIconUrl] = useState('')
  const [ogImage, setOgImage] = useState('')
  const [iconTab, setIconTab] = useState<'preset-common' | 'preset-tech' | 'preset-social' | 'preset-life' | 'upload' | 'url'>('preset-common')
  const [uploadedIconPreview, setUploadedIconPreview] = useState('')
  const [isUploadingIcon, setIsUploadingIcon] = useState(false)
  const [selectedPresetIcon, setSelectedPresetIcon] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 设置
  const [visibility, setVisibility] = useState<'public' | 'personal' | 'private'>('personal')
  const [isReadLater, setIsReadLater] = useState(false)

  // 当前激活的标签页
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic')

  // 自动获取元数据状态
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 编辑模式初始化
  useEffect(() => {
    if (editBookmark) {
      setUrl(editBookmark.url || '')
      setInternalUrl(editBookmark.internalUrl || '')
      setTitle(editBookmark.title || '')
      setDescription(editBookmark.description || '')
      setNotes(editBookmark.notes || '')
      setCategory(editBookmark.category || '')
      setTags(editBookmark.tags || [])
      setFavicon(editBookmark.favicon || '')
      setIcon(editBookmark.icon || '')
      setIconUrl(editBookmark.iconUrl || '')
      setOgImage(editBookmark.ogImage || '')
      setVisibility(editBookmark.visibility || 'personal')
      setIsReadLater(editBookmark.isReadLater || false)
      setUploadedIconPreview(editBookmark.iconUrl || '')
      // 判断是否为预设图标
      const isPreset = editBookmark.icon && presetIcons.some(p => p.name === editBookmark.icon)
      if (isPreset) {
        setSelectedPresetIcon(editBookmark.icon || '')
        setIconTab('preset-common')
      } else if (editBookmark.iconUrl) {
        setIconTab('upload')
      } else {
        setIconTab('preset-common')
        setSelectedPresetIcon('')
      }
    } else {
      // 重置表单
      setUrl('')
      setInternalUrl('')
      setTitle('')
      setDescription('')
      setNotes('')
      setCategory('')
      setTags([])
      setFavicon('')
      setIcon('')
      setIconUrl('')
      setOgImage('')
      setVisibility('personal')
      setIsReadLater(false)
      setActiveTab('basic')
      setIconTab('preset-common')
      setUploadedIconPreview('')
      setSelectedPresetIcon('')
    }
  }, [editBookmark, isOpen])

  // 自动获取网页元数据
  const fetchMetadata = useCallback(async (urlToFetch: string) => {
    // 自动补全 URL，如果用户输入的是 www.taobao.com，自动加上 https://
    let fullUrl = urlToFetch.trim()
    if (fullUrl && !fullUrl.startsWith('http')) {
      fullUrl = 'https://' + fullUrl
    }

    if (!fullUrl || !fullUrl.startsWith('http')) return

    setIsFetchingMetadata(true)
    try {
      const metadata = await metadataApi.fetch(fullUrl)
      if (metadata.title && !title) {
        setTitle(metadata.title)
      }
      if (metadata.description && !description) {
        setDescription(metadata.description)
      }
      if (metadata.favicon) {
        setFavicon(metadata.favicon)
        setIconUrl(metadata.favicon)
        setUploadedIconPreview(metadata.favicon)
        setIconTab('url')
      }
      if (metadata.ogImage) {
        setOgImage(metadata.ogImage)
      }
    } catch (error) {
      console.error('获取元数据失败:', error)
    } finally {
      setIsFetchingMetadata(false)
    }
  }, [title, description])

  // 处理 URL 输入变化
  const handleUrlChange = (value: string) => {
    setUrl(value)
  }

  // 处理 URL 输入框失去焦点 - 立即获取元数据
  const handleUrlBlur = () => {
    if (url && url.trim()) {
      fetchMetadata(url)
    }
  }

  // 添加标签
  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // 处理图标文件上传
  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 检查文件大小（限制 500KB）
    if (file.size > 500 * 1024) {
      alert('文件大小不能超过 500KB')
      return
    }

    setIsUploadingIcon(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setUploadedIconPreview(base64)
      setIconUrl(base64) // 使用 base64 作为 iconUrl
      setIsUploadingIcon(false)
    }
    reader.onerror = () => {
      alert('读取文件失败')
      setIsUploadingIcon(false)
    }
    reader.readAsDataURL(file)
  }

  // 处理图标 URL 输入
  const handleIconUrlChange = (url: string) => {
    setIconUrl(url)
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      setUploadedIconPreview(url)
    }
  }

  // 提交表单
  const handleSubmit = () => {
    if (!url || !title) {
      alert('URL 和标题不能为空')
      return
    }

    // 根据图标 Tab 确定保存的图标数据
    let finalIcon = ''
    let finalIconUrl = ''
    if (iconTab.startsWith('preset-') && selectedPresetIcon) {
      finalIcon = selectedPresetIcon
      finalIconUrl = ''
    } else if (iconTab === 'upload' || iconTab === 'url') {
      finalIcon = ''
      finalIconUrl = iconUrl
    }

    onSubmit({
      url,
      internalUrl: internalUrl || null,
      title,
      description: description || null,
      notes: notes || null,
      favicon: favicon || null,
      icon: finalIcon || null,
      iconUrl: finalIconUrl || null,
      ogImage: ogImage || null,
      category: category || null,
      tags: tags.length > 0 ? tags : undefined,
      isReadLater,
      visibility,
    })
    
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 模态框 */}
      <div 
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[520px] max-h-[80vh] overflow-hidden rounded-xl shadow-2xl"
        style={{ 
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-glass-border)'
        }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
            >
              <Bookmark className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {editBookmark ? '编辑书签' : '添加书签'}
              </h2>
              <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                {editBookmark ? '修改书签信息' : '添加新的书签到您的收藏'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-glass-hover)] transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 标签切换 */}
        <div className="flex gap-2 px-4 pt-3">
          <button
            onClick={() => setActiveTab('basic')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{ 
              background: activeTab === 'basic' ? 'var(--color-primary)' : 'var(--color-glass)',
              color: activeTab === 'basic' ? 'white' : 'var(--color-text-muted)',
            }}
          >
            <Link2 className="w-3.5 h-3.5" />
            基本信息
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{ 
              background: activeTab === 'advanced' ? 'var(--color-primary)' : 'var(--color-glass)',
              color: activeTab === 'advanced' ? 'white' : 'var(--color-text-muted)',
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            高级设置
          </button>
        </div>

        {/* 内容区域 */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {activeTab === 'basic' ? (
            <div className="space-y-3">
              {/* URL - 必填 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="flex items-center gap-1.5 text-sm font-medium flex-shrink-0" style={{ color: 'var(--color-text-secondary)', width: '70px' }}>
                  <Link2 className="w-4 h-4" />
                  URL <span className="text-red-500">*</span>
                </label>
                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    onBlur={handleUrlBlur}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all text-sm"
                    style={{
                      background: 'var(--color-glass)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-primary)',
                      paddingRight: isFetchingMetadata ? '32px' : '12px',
                    }}
                    placeholder="https://example.com"
                  />
                  {isFetchingMetadata && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-primary)' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* 标题 - 必填 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="flex items-center gap-1.5 text-sm font-medium flex-shrink-0" style={{ color: 'var(--color-text-secondary)', width: '70px' }}>
                  <FileText className="w-4 h-4" />
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg focus:outline-none transition-all text-sm"
                  style={{
                    background: 'var(--var(--color-glass)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="书签标题"
                />
              </div>

              {/* 描述 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <label className="flex items-center gap-1.5 text-sm font-medium flex-shrink-0 pt-2" style={{ color: 'var(--color-text-secondary)', width: '70px' }}>
                  <FileText className="w-4 h-4" />
                  描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-lg focus:outline-none transition-all resize-none text-sm"
                  style={{
                    background: 'var(--color-glass)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="书签描述（可选）"
                />
              </div>

              {/* 分类 & 内部URL 并排 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <label className="flex items-center gap-1.5 text-sm font-medium flex-shrink-0" style={{ color: 'var(--color-text-secondary)', width: '70px' }}>
                    <Folder className="w-4 h-4" />
                    分类
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg focus:outline-none transition-all appearance-none cursor-pointer text-sm"
                    style={{
                      background: 'var(--color-glass)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <option value="">选择分类</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 标签 */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <Tag className="w-4 h-4" />
                  标签
                </label>
                <div className="flex gap-2 mb-1.5">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="flex-1 px-3 py-2 rounded-lg focus:outline-none transition-all text-sm"
                    style={{
                      background: 'var(--color-glass)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="输入标签，按回车添加"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-2 rounded-lg font-medium transition-all text-sm"
                    style={{ background: 'var(--color-primary)', color: 'white' }}
                  >
                    添加
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                        style={{ background: 'var(--color-glass)', color: 'var(--color-text-primary)' }}
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 备注 */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <StickyNote className="w-4 h-4" />
                  备注
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all resize-none text-sm"
                  style={{
                    background: 'var(--color-glass)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="添加备注（可选）"
                />
              </div>

              {/* 图标上传/URL */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <ImageIcon className="w-4 h-4" />
                  图标
                </label>
                
                {/* Tab 切换 - 分为两行 */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    onClick={() => setIconTab('preset-common')}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
                    style={{
                      background: iconTab === 'preset-common' ? 'var(--color-primary)' : 'var(--color-glass)',
                      color: iconTab === 'preset-common' ? 'white' : 'var(--color-text-muted)',
                    }}
                  >
                    <Grid3X3 className="w-3 h-3" />
                    常用
                  </button>
                  <button
                    onClick={() => setIconTab('preset-tech')}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
                    style={{
                      background: iconTab === 'preset-tech' ? 'var(--color-primary)' : 'var(--color-glass)',
                      color: iconTab === 'preset-tech' ? 'white' : 'var(--color-text-muted)',
                    }}
                  >
                    <Code2 className="w-3 h-3" />
                    技术
                  </button>
                  <button
                    onClick={() => setIconTab('preset-social')}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
                    style={{
                      background: iconTab === 'preset-social' ? 'var(--color-primary)' : 'var(--color-glass)',
                      color: iconTab === 'preset-social' ? 'white' : 'var(--color-text-muted)',
                    }}
                  >
                    <Globe className="w-3 h-3" />
                    社交
                  </button>
                  <button
                    onClick={() => setIconTab('preset-life')}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
                    style={{
                      background: iconTab === 'preset-life' ? 'var(--color-primary)' : 'var(--color-glass)',
                      color: iconTab === 'preset-life' ? 'white' : 'var(--color-text-muted)',
                    }}
                  >
                    <Heart className="w-3 h-3" />
                    生活
                  </button>
                  <button
                    onClick={() => setIconTab('upload')}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
                    style={{
                      background: iconTab === 'upload' ? 'var(--color-primary)' : 'var(--color-glass)',
                      color: iconTab === 'upload' ? 'white' : 'var(--color-text-muted)',
                    }}
                  >
                    <Upload className="w-3 h-3" />
                    上传
                  </button>
                  <button
                    onClick={() => setIconTab('url')}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
                    style={{
                      background: iconTab === 'url' ? 'var(--color-primary)' : 'var(--color-glass)',
                      color: iconTab === 'url' ? 'white' : 'var(--color-text-muted)',
                    }}
                  >
                    <LinkIcon className="w-3 h-3" />
                    链接
                  </button>
                </div>

                {/* 预设图标区域 - 常用 */}
                {iconTab === 'preset-common' ? (
                  <div 
                    className="max-h-[80px] overflow-y-auto p-2 rounded-lg" 
                    style={{ background: 'var(--color-glass)' }}
                  >
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(10, 1fr)', 
                      gap: '5px' 
                    }}>
                      {presetIcons.filter(i => ['star', 'heart', 'bookmark', 'home', 'folder', 'file', 'link', 'search', 'settings', 'user', 'mail', 'bell', 'calendar', 'clock', 'flag', 'tag', 'key', 'lock', 'unlock', 'eye'].includes(i.name)).map(({ name, icon: Icon }) => (
                        <button
                          key={name}
                          onClick={() => setSelectedPresetIcon(name)}
                          className="rounded flex items-center justify-center transition-all hover:scale-110"
                          style={{
                            width: '26px',
                            height: '26px',
                            background: selectedPresetIcon === name ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                            color: selectedPresetIcon === name ? 'white' : 'var(--color-text-secondary)',
                            border: selectedPresetIcon === name ? '1px solid var(--color-primary)' : '1px solid transparent',
                          }}
                          title={name}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : iconTab === 'preset-tech' ? (
                  <div 
                    className="max-h-[80px] overflow-y-auto p-2 rounded-lg" 
                    style={{ background: 'var(--color-glass)' }}
                  >
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(10, 1fr)', 
                      gap: '5px' 
                    }}>
                      {presetIcons.filter(i => ['code', 'zap', 'cpu', 'database', 'terminal', 'github', 'laptop', 'smartphone', 'wifi', 'radio', 'plug', 'battery', 'cloud', 'server', 'monitor', 'mouse', 'keyboard', 'printer', 'scanner', 'webcam'].includes(i.name)).map(({ name, icon: Icon }) => (
                        <button
                          key={name}
                          onClick={() => setSelectedPresetIcon(name)}
                          className="rounded flex items-center justify-center transition-all hover:scale-110"
                          style={{
                            width: '26px',
                            height: '26px',
                            background: selectedPresetIcon === name ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                            color: selectedPresetIcon === name ? 'white' : 'var(--color-text-secondary)',
                            border: selectedPresetIcon === name ? '1px solid var(--color-primary)' : '1px solid transparent',
                          }}
                          title={name}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : iconTab === 'preset-social' ? (
                  <div 
                    className="max-h-[80px] overflow-y-auto p-2 rounded-lg" 
                    style={{ background: 'var(--color-glass)' }}
                  >
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(10, 1fr)', 
                      gap: '5px' 
                    }}>
                      {presetIcons.filter(i => ['facebook', 'twitter', 'instagram', 'youtube', 'github', 'linkedin', 'twitch', 'rss', 'share', 'message', 'mail', 'send', 'at-sign', 'hash', 'users', 'user-plus', 'user-minus', 'smile', 'thumbs-up', 'heart'].includes(i.name)).map(({ name, icon: Icon }) => (
                        <button
                          key={name}
                          onClick={() => setSelectedPresetIcon(name)}
                          className="rounded flex items-center justify-center transition-all hover:scale-110"
                          style={{
                            width: '26px',
                            height: '26px',
                            background: selectedPresetIcon === name ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                            color: selectedPresetIcon === name ? 'white' : 'var(--color-text-secondary)',
                            border: selectedPresetIcon === name ? '1px solid var(--color-primary)' : '1px solid transparent',
                          }}
                          title={name}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : iconTab === 'preset-life' ? (
                  <div 
                    className="max-h-[80px] overflow-y-auto p-2 rounded-lg" 
                    style={{ background: 'var(--color-glass)' }}
                  >
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(10, 1fr)', 
                      gap: '5px' 
                    }}>
                      {presetIcons.filter(i => ['coffee', 'music', 'video', 'image', 'camera', 'gamepad', 'gift', 'shopping', 'car', 'plane', 'bike', 'map', 'sun', 'moon', 'cloud', 'umbrella', 'thermometer', 'coffee', 'utensils', 'beer'].includes(i.name)).map(({ name, icon: Icon }) => (
                        <button
                          key={name}
                          onClick={() => setSelectedPresetIcon(name)}
                          className="rounded flex items-center justify-center transition-all hover:scale-110"
                          style={{
                            width: '26px',
                            height: '26px',
                            background: selectedPresetIcon === name ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                            color: selectedPresetIcon === name ? 'white' : 'var(--color-text-secondary)',
                            border: selectedPresetIcon === name ? '1px solid var(--color-primary)' : '1px solid transparent',
                          }}
                          title={name}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : iconTab === 'upload' ? (
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all hover:border-[var(--color-primary)]"
                      style={{ 
                        borderColor: uploadedIconPreview ? 'transparent' : 'var(--color-glass-border)',
                        background: 'var(--color-glass)'
                      }}
                    >
                      {uploadedIconPreview ? (
                        <img 
                          src={uploadedIconPreview} 
                          alt="Icon" 
                          className="w-full h-full object-contain rounded-lg p-1"
                        />
                      ) : isUploadingIcon ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                      ) : (
                        <Plus className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleIconFileChange}
                      className="hidden"
                    />
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <p>点击上传图标</p>
                      <p>支持 JPG、PNG、SVG</p>
                      <p>最大 500KB</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--color-glass)' }}
                    >
                      {uploadedIconPreview ? (
                        <img 
                          src={uploadedIconPreview} 
                          alt="Icon" 
                          className="w-full h-full object-contain rounded-lg p-1"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                      )}
                    </div>
                    <input
                      type="url"
                      value={iconUrl}
                      onChange={(e) => handleIconUrlChange(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-lg focus:outline-none transition-all"
                      style={{
                        background: 'var(--color-glass)',
                        border: '1px solid var(--color-glass-border)',
                        color: 'var(--color-text-primary)',
                      }}
                      placeholder="输入图标 URL"
                    />
                  </div>
                )}
              </div>

              {/* 可见性 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="flex items-center gap-1.5 text-sm font-medium flex-shrink-0" style={{ color: 'var(--color-text-secondary)', width: '70px' }}>
                  <Globe className="w-4 h-4" />
                  可见性
                </label>
                <div className="flex gap-2 flex-1">
                  {[
                    { value: 'public', label: '公开', icon: Globe, color: '#22c55e' },
                    { value: 'personal', label: '个人', icon: User, color: '#3b82f6' },
                    { value: 'private', label: '私密', icon: Lock, color: '#ef4444' },
                  ].map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      onClick={() => setVisibility(value as any)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: visibility === value ? color : 'var(--color-glass)',
                        color: visibility === value ? 'white' : 'var(--color-text-muted)',
                        border: `1px solid ${visibility === value ? color : 'var(--color-glass-border)'}`,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 稍后阅读 */}
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--color-glass)' }}>
                <input
                  type="checkbox"
                  id="isReadLater"
                  checked={isReadLater}
                  onChange={(e) => setIsReadLater(e.target.checked)}
                  className="w-3.5 h-3.5 rounded cursor-pointer"
                />
                <label htmlFor="isReadLater" className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                  <Bookmark className="w-3.5 h-3.5" />
                  添加到稍后阅读
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t" style={{ borderColor: 'var(--color-glass-border)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium transition-all text-sm"
            style={{ 
              background: 'var(--color-glass)', 
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-glass-border)'
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!url || !title}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 text-sm"
            style={{ 
              background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))',
              color: 'white',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            {editBookmark ? '保存修改' : '添加书签'}
          </button>
        </div>
      </div>
    </div>
  )
}
