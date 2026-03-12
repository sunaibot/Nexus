'use client'

import { useState, useEffect, useCallback } from 'react'
import { wallpaperApi } from '@/lib/api-client'
import type {
  WallpaperSettings,
  WallpaperLibraryItem,
  WallpaperOperationResult,
  UploadResult,
  WallpaperCategory,
  UnsplashPhoto,
  PexelsPhoto
} from '../types'

// 默认设置
const DEFAULT_SETTINGS: WallpaperSettings = {
  enabled: false,
  mode: 'single',
  source: 'upload',
  blur: 0,
  overlay: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  display: {
    fit: 'cover',
    attachment: 'fixed',
    position: 'center'
  },
  slideshow: {
    enabled: false,
    interval: 60,
    transition: 'fade',
    transitionDuration: 1000,
    shuffle: false,
    pauseOnHover: true,
    wallpapers: []
  },
  dynamic: {
    enabled: false,
    muted: true,
    playbackSpeed: 1
  },
  daily: {
    enabled: false,
    source: 'unsplash',
    updateTime: '08:00',
    saveToLibrary: true
  },
  effects: {
    vignette: {
      enabled: false,
      intensity: 50,
      size: 50
    },
    colorFilter: {
      enabled: false,
      type: 'none',
      intensity: 50
    },
    gradient: {
      enabled: false,
      type: 'linear',
      angle: 180,
      colors: [
        { color: '#000000', position: 0 },
        { color: 'transparent', position: 100 }
      ],
      opacity: 50
    },
    particles: {
      enabled: false,
      type: 'snow',
      density: 50,
      speed: 50,
      color: '#ffffff'
    },
    animation: {
      enabled: false,
      type: 'ken-burns',
      speed: 50
    }
  },
  schedule: {
    enabled: false,
    type: 'interval',
    interval: 60
  },
  homeComponent: {
    showTime: true,
    timeFormat: '24h',
    timeStyle: 'large',
    showDate: true,
    showLunar: true,
    showFestival: true,
    showJieQi: true,
    showWeather: true,
    weatherStyle: 'simple',
    layout: 'vertical',
    cardBackground: 'rgba(0,0,0,0.3)',
    cardOpacity: 80,
    cardBlur: 10,
    cardBorderRadius: '16px'
  },
  solarTerm: {
    enabled: false,
    autoSwitch: true,
    wallpapers: {},
    transition: 'fade',
    transitionDuration: 1000
  },
  multiScreen: {
    enabled: false,
    screens: []
  }
}

// 模拟壁纸库数据
const MOCK_WALLPAPERS: WallpaperLibraryItem[] = [
  {
    id: '1',
    name: '山脉日出',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    source: 'unsplash',
    category: 'nature',
    tags: ['mountain', 'sunrise', 'landscape'],
    isFavorite: true,
    createdAt: '2024-01-01',
    usedAt: '2024-01-15',
    useCount: 5
  },
  {
    id: '2',
    name: '城市夜景',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400',
    source: 'unsplash',
    category: 'city',
    tags: ['city', 'night', 'lights'],
    isFavorite: false,
    createdAt: '2024-01-02',
    useCount: 3
  },
  {
    id: '3',
    name: '抽象几何',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400',
    source: 'unsplash',
    category: 'abstract',
    tags: ['abstract', 'geometric', 'colorful'],
    isFavorite: true,
    createdAt: '2024-01-03',
    usedAt: '2024-01-10',
    useCount: 8
  },
  {
    id: '4',
    name: '极简白',
    url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400',
    source: 'unsplash',
    category: 'minimal',
    tags: ['minimal', 'white', 'clean'],
    isFavorite: false,
    createdAt: '2024-01-04',
    useCount: 2
  },
  {
    id: '5',
    name: '星空',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400',
    source: 'unsplash',
    category: 'space',
    tags: ['space', 'stars', 'night'],
    isFavorite: true,
    createdAt: '2024-01-05',
    usedAt: '2024-01-20',
    useCount: 10
  }
]

export function useWallpaper() {
  const [settings, setSettings] = useState<WallpaperSettings>(DEFAULT_SETTINGS)
  const [wallpapers, setWallpapers] = useState<WallpaperLibraryItem[]>(MOCK_WALLPAPERS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshingDaily, setIsRefreshingDaily] = useState(false)

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        // 从后端 API 加载壁纸设置
        const serverSettings = await wallpaperApi.settings.get()
        if (serverSettings) {
          setSettings({ ...DEFAULT_SETTINGS, ...serverSettings })
        } else {
          // 从 localStorage 加载作为后备
          const saved = localStorage.getItem('wallpaper-settings')
          if (saved) {
            const parsed = JSON.parse(saved)
            setSettings({ ...DEFAULT_SETTINGS, ...parsed })
          }
        }
        
        // 从后端 API 加载壁纸库
        try {
          const libraryData = await wallpaperApi.library.getAll()
          if (libraryData && libraryData.length > 0) {
            setWallpapers(libraryData)
          } else {
            // 从 localStorage 加载作为后备
            const savedWallpapers = localStorage.getItem('wallpaper-library')
            if (savedWallpapers) {
              setWallpapers(JSON.parse(savedWallpapers))
            }
          }
        } catch {
          // 从 localStorage 加载作为后备
          const savedWallpapers = localStorage.getItem('wallpaper-library')
          if (savedWallpapers) {
            setWallpapers(JSON.parse(savedWallpapers))
          }
        }
      } catch (err) {
        setError('加载设置失败')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  // 保存设置
  const saveSettings = useCallback(async (newSettings: Partial<WallpaperSettings>) => {
    try {
      setIsSaving(true)
      const updated = { ...settings, ...newSettings }
      setSettings(updated)
      
      // 保存到后端 API
      try {
        await wallpaperApi.settings.update(newSettings)
      } catch {
        // 后端失败时保存到 localStorage 作为后备
        localStorage.setItem('wallpaper-settings', JSON.stringify(updated))
      }
      
      return { success: true }
    } catch (err) {
      setError('保存设置失败')
      return { success: false, message: '保存失败' }
    } finally {
      setIsSaving(false)
    }
  }, [settings])

  // 上传图片
  const uploadImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        
        // 添加到壁纸库
        const newWallpaper: WallpaperLibraryItem = {
          id: Date.now().toString(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: dataUrl,
          thumbnail: dataUrl,
          source: 'upload',
          category: 'other',
          tags: [],
          isFavorite: false,
          createdAt: new Date().toISOString(),
          useCount: 0
        }
        
        const updated = [newWallpaper, ...wallpapers]
        setWallpapers(updated)
        
        // 同步到后端 API
        try {
          await wallpaperApi.library.add(newWallpaper)
        } catch {
          // 后端失败时保存到 localStorage 作为后备
          localStorage.setItem('wallpaper-library', JSON.stringify(updated))
        }
        
        resolve(dataUrl)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [wallpapers])

  // 设置图片URL
  const setImageUrl = useCallback(async (url: string): Promise<WallpaperOperationResult> => {
    await saveSettings({ imageUrl: url, source: 'url' })
    return { success: true }
  }, [saveSettings])

  // 选择预设
  const selectPreset = useCallback(async (preset: { id: string; url: string }): Promise<WallpaperOperationResult> => {
    await saveSettings({ presetId: preset.id, imageUrl: preset.url, source: 'preset' })
    return { success: true }
  }, [saveSettings])

  // 清除壁纸
  const clearWallpaper = useCallback(async (): Promise<WallpaperOperationResult> => {
    await saveSettings({
      imageData: null,
      imageUrl: null,
      presetId: null,
      videoUrl: undefined,
      gifUrl: undefined
    })
    return { success: true }
  }, [saveSettings])

  // 设置模糊度
  const setBlur = useCallback(async (value: number) => {
    await saveSettings({ blur: value })
  }, [saveSettings])

  // 设置遮罩
  const setOverlay = useCallback(async (value: number) => {
    await saveSettings({ overlay: value })
  }, [saveSettings])

  // 设置亮度
  const setBrightness = useCallback(async (value: number) => {
    await saveSettings({ brightness: value })
  }, [saveSettings])

  // 设置对比度
  const setContrast = useCallback(async (value: number) => {
    await saveSettings({ contrast: value })
  }, [saveSettings])

  // 设置饱和度
  const setSaturation = useCallback(async (value: number) => {
    await saveSettings({ saturation: value })
  }, [saveSettings])

  // 设置启用状态
  const setEnabled = useCallback(async (enabled: boolean) => {
    await saveSettings({ enabled })
  }, [saveSettings])

  // 设置模式
  const setMode = useCallback(async (mode: WallpaperSettings['mode']) => {
    await saveSettings({ mode })
  }, [saveSettings])

  // 设置显示选项
  const setDisplay = useCallback(async (display: WallpaperSettings['display']) => {
    await saveSettings({ display })
  }, [saveSettings])

  // 设置轮播
  const setSlideshow = useCallback(async (slideshow: WallpaperSettings['slideshow']) => {
    await saveSettings({ slideshow })
  }, [saveSettings])

  // 设置动态壁纸
  const setDynamic = useCallback(async (dynamic: WallpaperSettings['dynamic']) => {
    await saveSettings({ dynamic })
  }, [saveSettings])

  // 设置每日壁纸
  const setDaily = useCallback(async (daily: WallpaperSettings['daily']) => {
    await saveSettings({ daily })
  }, [saveSettings])

  // 设置高级效果
  const setEffects = useCallback(async (effects: WallpaperSettings['effects']) => {
    await saveSettings({ effects })
  }, [saveSettings])

  // 设置定时
  const setSchedule = useCallback(async (schedule: WallpaperSettings['schedule']) => {
    await saveSettings({ schedule })
  }, [saveSettings])

  // 设置首页组件
  const setHomeComponent = useCallback(async (homeComponent: WallpaperSettings['homeComponent']) => {
    await saveSettings({ homeComponent })
  }, [saveSettings])

  // 设置节气背景
  const setSolarTerm = useCallback(async (solarTerm: WallpaperSettings['solarTerm']) => {
    await saveSettings({ solarTerm })
  }, [saveSettings])

  // 刷新每日壁纸
  const refreshDailyWallpaper = useCallback(async (): Promise<void> => {
    try {
      setIsRefreshingDaily(true)
      
      const { source, category, keywords } = settings.daily
      
      // 使用后端 API 获取每日壁纸
      let imageUrl = ''
      try {
        imageUrl = await wallpaperApi.daily.get({ source, category, keywords: keywords?.join(',') })
      } catch {
        // 后端失败时使用前端获取
        switch (source) {
          case 'unsplash':
            imageUrl = await fetchUnsplashImage(category, keywords)
            break
          case 'pexels':
            imageUrl = await fetchPexelsImage(category, keywords)
            break
          case 'picsum':
            imageUrl = `https://picsum.photos/1920/1080?random=${Date.now()}`
            break
          case 'bing':
            imageUrl = await fetchBingImage()
            break
        }
      }
      
      if (imageUrl) {
        await saveSettings({ imageUrl, source: source as any })
        
        // 如果开启保存到库
        if (settings.daily.saveToLibrary) {
          const newWallpaper: WallpaperLibraryItem = {
            id: Date.now().toString(),
            name: `每日壁纸 ${new Date().toLocaleDateString()}`,
            url: imageUrl,
            thumbnail: imageUrl,
            source: source as any,
            category: (category as WallpaperCategory) || 'other',
            tags: keywords || [],
            isFavorite: false,
            createdAt: new Date().toISOString(),
            useCount: 1
          }
          const updated = [newWallpaper, ...wallpapers]
          setWallpapers(updated)
          
          // 同步到后端 API
          try {
            await wallpaperApi.library.add(newWallpaper)
          } catch {
            // 后端失败时保存到 localStorage 作为后备
            localStorage.setItem('wallpaper-library', JSON.stringify(updated))
          }
        }
      }
    } catch (err) {
      setError('获取每日壁纸失败')
    } finally {
      setIsRefreshingDaily(false)
    }
  }, [settings.daily, wallpapers, saveSettings])

  // 切换收藏
  const toggleFavorite = useCallback(async (id: string) => {
    const wallpaper = wallpapers.find(w => w.id === id)
    if (!wallpaper) return
    
    const newFavorite = !wallpaper.isFavorite
    const updated = wallpapers.map(w =>
      w.id === id ? { ...w, isFavorite: newFavorite } : w
    )
    setWallpapers(updated)
    
    // 同步到后端 API
    try {
      await wallpaperApi.library.toggleFavorite(id, newFavorite)
    } catch {
      // 后端失败时保存到 localStorage 作为后备
      localStorage.setItem('wallpaper-library', JSON.stringify(updated))
    }
  }, [wallpapers])

  // 删除壁纸
  const deleteWallpaper = useCallback(async (id: string) => {
    const updated = wallpapers.filter(w => w.id !== id)
    setWallpapers(updated)
    
    // 同步到后端 API
    try {
      await wallpaperApi.library.delete(id)
    } catch {
      // 后端失败时保存到 localStorage 作为后备
      localStorage.setItem('wallpaper-library', JSON.stringify(updated))
    }
  }, [wallpapers])

  // 使用壁纸
  const useWallpaper = useCallback(async (wallpaper: WallpaperLibraryItem) => {
    const updated = wallpapers.map(w =>
      w.id === wallpaper.id
        ? { ...w, useCount: w.useCount + 1, usedAt: new Date().toISOString() }
        : w
    )
    setWallpapers(updated)
    
    // 同步到后端 API
    try {
      await wallpaperApi.library.use(wallpaper.id)
    } catch {
      // 后端失败时保存到 localStorage 作为后备
      localStorage.setItem('wallpaper-library', JSON.stringify(updated))
    }
    
    await saveSettings({
      imageUrl: wallpaper.url,
      source: wallpaper.source
    })
  }, [wallpapers, saveSettings])

  return {
    settings,
    wallpapers,
    isLoading,
    isSaving,
    error,
    isRefreshingDaily,
    uploadImage,
    setImageUrl,
    selectPreset,
    clearWallpaper,
    setBlur,
    setOverlay,
    setBrightness,
    setContrast,
    setSaturation,
    setEnabled,
    setMode,
    setDisplay,
    setSlideshow,
    setDynamic,
    setDaily,
    setEffects,
    setSchedule,
    setHomeComponent,
    setSolarTerm,
    refreshDailyWallpaper,
    toggleFavorite,
    deleteWallpaper,
    useWallpaper
  }
}

// 获取 Unsplash 图片
async function fetchUnsplashImage(category?: string, keywords?: string[]): Promise<string> {
  // 注意：实际使用时需要替换为真实的 API key
  const query = keywords?.join(',') || category || 'nature'
  // 模拟返回
  return `https://source.unsplash.com/1920x1080/?${encodeURIComponent(query)}&sig=${Date.now()}`
}

// 获取 Pexels 图片
async function fetchPexelsImage(category?: string, keywords?: string[]): Promise<string> {
  // 注意：实际使用时需要替换为真实的 API key
  const query = keywords?.join(' ') || category || 'nature'
  // 模拟返回
  return `https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg?auto=compress&cs=tinysrgb&w=1920`
}

// 获取 Bing 每日图片
async function fetchBingImage(): Promise<string> {
  try {
    const response = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN')
    const data = await response.json()
    return `https://www.bing.com${data.images[0].url}`
  } catch {
    return 'https://www.bing.com/th?id=OHR.AncientOrkney_ROW1151325237_1920x1080.jpg'
  }
}
