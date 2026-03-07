/**
 * 壁纸源管理组件
 * 管理自定义壁纸源，支持 Bing、Unsplash、Pexels 等
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  ExternalLink,
  Image,
  Camera,
  Video,
  Shuffle,
  Monitor,
  Globe,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Play,
  Settings,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { WallpaperProvider, BuiltinProviderPreset, ProviderWallpaper } from '../types'
import {
  fetchProviders,
  fetchProviderPresets,
  createProvider,
  updateProvider,
  deleteProvider,
  createProviderFromPreset,
  fetchProviderWallpapers,
} from '../api/providers'

interface WallpaperProviderManagerProps {
  onSelectWallpaper?: (wallpaper: ProviderWallpaper) => void
}

export function WallpaperProviderManager({ onSelectWallpaper }: WallpaperProviderManagerProps) {
  const { t } = useTranslation()
  const [providers, setProviders] = useState<WallpaperProvider[]>([])
  const [presets, setPresets] = useState<BuiltinProviderPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<WallpaperProvider | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null)
  const [providerWallpapers, setProviderWallpapers] = useState<Record<string, ProviderWallpaper[]>>({})
  const [loadingWallpapers, setLoadingWallpapers] = useState<Record<string, boolean>>({})

  // 表单数据
  const [formData, setFormData] = useState<Partial<WallpaperProvider>>({
    name: '',
    description: '',
    type: 'api',
    enabled: true,
    apiUrl: '',
    apiKey: '',
    method: 'GET',
    headers: {},
    params: {},
    parser: { imageUrlPath: '' },
    cacheDuration: 60,
    maxResults: 20,
  })

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [providersData, presetsData] = await Promise.all([
        fetchProviders(),
        fetchProviderPresets(),
      ])
      setProviders(providersData)
      setPresets(presetsData)
    } catch (err) {
      setError('加载壁纸源失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 加载壁纸源的壁纸
  const loadProviderWallpapers = async (providerId: string, refresh = false) => {
    if (loadingWallpapers[providerId]) return

    try {
      setLoadingWallpapers(prev => ({ ...prev, [providerId]: true }))
      const wallpapers = await fetchProviderWallpapers(providerId, { refresh })
      setProviderWallpapers(prev => ({ ...prev, [providerId]: wallpapers }))
    } catch (err) {
      console.error('加载壁纸失败:', err)
    } finally {
      setLoadingWallpapers(prev => ({ ...prev, [providerId]: false }))
    }
  }

  // 切换展开状态
  const toggleExpand = async (providerId: string) => {
    if (expandedProvider === providerId) {
      setExpandedProvider(null)
    } else {
      setExpandedProvider(providerId)
      if (!providerWallpapers[providerId]) {
        await loadProviderWallpapers(providerId)
      }
    }
  }

  // 打开创建弹窗
  const handleCreate = () => {
    setEditingProvider(null)
    setSelectedPreset('')
    setFormData({
      name: '',
      description: '',
      type: 'api',
      enabled: true,
      apiUrl: '',
      apiKey: '',
      method: 'GET',
      headers: {},
      params: {},
      parser: { imageUrlPath: '' },
      cacheDuration: 60,
      maxResults: 20,
    })
    setIsModalOpen(true)
  }

  // 快速添加预设
  const handleQuickAdd = (presetId: string) => {
    console.log('handleQuickAdd called with:', presetId)
    console.log('Available presets:', presets)
    const preset = presets.find(p => p.id === presetId)
    if (!preset) {
      console.error('Preset not found:', presetId)
      return
    }

    console.log('Found preset:', preset)
    setEditingProvider(null)
    setSelectedPreset(presetId)
    setFormData({
      name: preset.name,
      description: preset.description,
      type: preset.type as any,
      enabled: true,
      apiUrl: preset.defaultApiUrl,
      apiKey: '',
      method: 'GET',
      headers: preset.defaultHeaders || {},
      params: preset.defaultParams || {},
      parser: preset.defaultParser || { imageUrlPath: '' },
      cacheDuration: 60,
      maxResults: 20,
    })
    setIsModalOpen(true)
  }

  // 打开编辑弹窗
  const handleEdit = (provider: WallpaperProvider) => {
    setEditingProvider(provider)
    setSelectedPreset('')
    setFormData({ ...provider })
    setIsModalOpen(true)
  }

  // 选择预设
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId)
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      setFormData({
        ...formData,
        name: preset.name,
        description: preset.description,
        type: preset.type as any,
        apiUrl: preset.defaultApiUrl,
        headers: preset.defaultHeaders || {},
        params: preset.defaultParams || {},
        parser: preset.defaultParser || { imageUrlPath: '' },
      })
    }
  }

  // 保存
  const handleSave = async () => {
    try {
      if (editingProvider) {
        await updateProvider(editingProvider.id, formData)
      } else if (selectedPreset) {
        await createProviderFromPreset(selectedPreset, {
          apiKey: formData.apiKey,
          customParams: formData.params,
        })
      } else {
        await createProvider(formData as Omit<WallpaperProvider, 'id' | 'createdAt' | 'updatedAt'>)
      }
      await loadData()
      setIsModalOpen(false)
    } catch (err) {
      console.error('保存失败:', err)
      alert('保存失败')
    }
  }

  // 删除
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个壁纸源吗？')) return
    try {
      await deleteProvider(id)
      await loadData()
    } catch (err) {
      console.error('删除失败:', err)
      alert('删除失败')
    }
  }

  // 切换启用状态
  const handleToggleEnabled = async (provider: WallpaperProvider) => {
    try {
      await updateProvider(provider.id, { enabled: !provider.enabled })
      await loadData()
    } catch (err) {
      console.error('更新失败:', err)
    }
  }

  // 获取预设图标
  const getPresetIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Image: <Image className="w-5 h-5" />,
      Camera: <Camera className="w-5 h-5" />,
      Video: <Video className="w-5 h-5" />,
      Shuffle: <Shuffle className="w-5 h-5" />,
      Monitor: <Monitor className="w-5 h-5" />,
    }
    return icons[iconName] || <Globe className="w-5 h-5" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-400">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p>{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">壁纸源管理</h3>
          <p className="text-sm text-gray-400 mt-1">
            添加和管理自定义壁纸源，支持 Bing、Unsplash、Pexels 等
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加壁纸源
        </button>
      </div>

      {/* 预设快速添加 */}
      <div className="bg-white/5 rounded-xl p-4">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Image className="w-4 h-4 text-blue-400" />
          快速添加预设源
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleQuickAdd(preset.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                {getPresetIcon(preset.icon)}
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">{preset.name}</div>
                <div className="text-xs text-gray-400 line-clamp-1">{preset.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 已配置的壁纸源 */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-400" />
          已配置的壁纸源 ({providers.length})
        </h4>

        {providers.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl">
            <Image className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">还没有配置壁纸源</p>
            <p className="text-sm text-gray-500 mt-1">点击上方按钮或选择预设来添加</p>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map(provider => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-xl overflow-hidden"
              >
                {/* 头部信息 */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      provider.enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {getPresetIcon(provider.icon || 'Globe')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{provider.name}</span>
                        {provider.enabled ? (
                          <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                            已启用
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded-full">
                            已禁用
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{provider.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{provider.apiUrl}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEnabled(provider)}
                      className={`p-2 rounded-lg transition-colors ${
                        provider.enabled
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      }`}
                      title={provider.enabled ? '禁用' : '启用'}
                    >
                      {provider.enabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => toggleExpand(provider.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      title="查看壁纸"
                    >
                      {expandedProvider === provider.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(provider)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 展开的壁纸列表 */}
                <AnimatePresence>
                  {expandedProvider === provider.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-400">
                            壁纸列表 ({providerWallpapers[provider.id]?.length || 0})
                          </span>
                          <button
                            onClick={() => loadProviderWallpapers(provider.id, true)}
                            disabled={loadingWallpapers[provider.id]}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-4 h-4 ${loadingWallpapers[provider.id] ? 'animate-spin' : ''}`} />
                            刷新
                          </button>
                        </div>

                        {loadingWallpapers[provider.id] ? (
                          <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                          </div>
                        ) : providerWallpapers[provider.id]?.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {providerWallpapers[provider.id].map((wallpaper, index) => (
                              <motion.div
                                key={wallpaper.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative aspect-video rounded-lg overflow-hidden bg-white/5 cursor-pointer"
                                onClick={() => onSelectWallpaper?.(wallpaper)}
                              >
                                <img
                                  src={wallpaper.thumbnail || wallpaper.url}
                                  alt={wallpaper.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Play className="w-8 h-8 text-white" />
                                </div>
                                {wallpaper.title && (
                                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-xs text-white truncate">{wallpaper.title}</p>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Image className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">暂无壁纸</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 创建/编辑弹窗 */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-slate-800 rounded-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {editingProvider ? '编辑壁纸源' : '添加壁纸源'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* 选择预设 */}
                {!editingProvider && (
                  <div>
                    <label className="block text-sm font-medium mb-2">选择预设（可选）</label>
                    <select
                      value={selectedPreset}
                      onChange={e => handleSelectPreset(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">自定义配置</option>
                      {presets.map(preset => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name} - {preset.description}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">名称 *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="例如：Bing 每日壁纸"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">类型</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="api">API</option>
                      <option value="rss">RSS</option>
                      <option value="json">JSON</option>
                      <option value="html">HTML</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">描述</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="简短描述这个壁纸源"
                  />
                </div>

                {/* API 配置 */}
                <div>
                  <label className="block text-sm font-medium mb-2">API 地址 *</label>
                  <input
                    type="text"
                    value={formData.apiUrl}
                    onChange={e => setFormData({ ...formData, apiUrl: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="https://api.example.com/wallpapers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">API Key（可选）</label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="如果需要认证，请输入 API Key"
                  />
                </div>

                {/* 解析配置 */}
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    数据解析配置
                  </h4>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      图片 URL 路径 *
                      <span className="text-gray-500 text-xs ml-2">JSONPath，如：images[].url</span>
                    </label>
                    <input
                      type="text"
                      value={formData.parser?.imageUrlPath || ''}
                      onChange={e => setFormData({
                        ...formData,
                        parser: { ...formData.parser, imageUrlPath: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="images[].url"
                    />
                  </div>
                </div>

                {/* 高级配置 */}
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-sm font-medium mb-3">高级配置</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">缓存时间（分钟）</label>
                      <input
                        type="number"
                        value={formData.cacheDuration}
                        onChange={e => setFormData({ ...formData, cacheDuration: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                        min={5}
                        max={1440}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">最大结果数</label>
                      <input
                        type="number"
                        value={formData.maxResults}
                        onChange={e => setFormData({ ...formData, maxResults: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                        min={1}
                        max={100}
                      />
                    </div>
                  </div>
                </div>

                {/* 启用状态 */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="enabled" className="text-sm">启用此壁纸源</label>
                </div>
              </div>

              <div className="p-6 border-t border-white/10">
                {(!formData.name || !formData.apiUrl) && (
                  <p className="text-sm text-amber-400 mb-3 text-center">
                    请填写名称和 API 地址
                  </p>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!formData.name || !formData.apiUrl}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingProvider ? '保存' : '创建'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
