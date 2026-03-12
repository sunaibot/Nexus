'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun,
  CloudRain,
  Snowflake,
  Wind,
  Leaf,
  Flower2,
  Upload,
  Check,
  Trash2,
  Calendar,
  Settings2,
  Image,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { wallpaperLibraryApi } from '../../../lib/api-client/wallpaper'
import type { SolarTermSettings, SolarTerm } from '../types'

interface SolarTermSettingsProps {
  settings: SolarTermSettings
  onChange: (settings: SolarTermSettings) => void
}

// 24节气数据
const SOLAR_TERMS: { id: SolarTerm; name: string; month: number; icon: typeof Sun; season: string }[] = [
  // 春季
  { id: 'lichun', name: '立春', month: 2, icon: Sun, season: 'spring' },
  { id: 'yushui', name: '雨水', month: 2, icon: CloudRain, season: 'spring' },
  { id: 'jingzhe', name: '惊蛰', month: 3, icon: Wind, season: 'spring' },
  { id: 'chunfen', name: '春分', month: 3, icon: Sun, season: 'spring' },
  { id: 'qingming', name: '清明', month: 4, icon: Leaf, season: 'spring' },
  { id: 'guyu', name: '谷雨', month: 4, icon: CloudRain, season: 'spring' },
  // 夏季
  { id: 'lixia', name: '立夏', month: 5, icon: Sun, season: 'summer' },
  { id: 'xiaoman', name: '小满', month: 5, icon: Flower2, season: 'summer' },
  { id: 'mangzhong', name: '芒种', month: 6, icon: Sun, season: 'summer' },
  { id: 'xiazhi', name: '夏至', month: 6, icon: Sun, season: 'summer' },
  { id: 'xiaoshu', name: '小暑', month: 7, icon: Sun, season: 'summer' },
  { id: 'dashu', name: '大暑', month: 7, icon: Sun, season: 'summer' },
  // 秋季
  { id: 'liqiu', name: '立秋', month: 8, icon: Leaf, season: 'autumn' },
  { id: 'chushu', name: '处暑', month: 8, icon: Wind, season: 'autumn' },
  { id: 'bailu', name: '白露', month: 9, icon: CloudRain, season: 'autumn' },
  { id: 'qiufen', name: '秋分', month: 9, icon: Leaf, season: 'autumn' },
  { id: 'hanlu', name: '寒露', month: 10, icon: CloudRain, season: 'autumn' },
  { id: 'shuangjiang', name: '霜降', month: 10, icon: Snowflake, season: 'autumn' },
  // 冬季
  { id: 'lidong', name: '立冬', month: 11, icon: Snowflake, season: 'winter' },
  { id: 'xiaoxue', name: '小雪', month: 11, icon: Snowflake, season: 'winter' },
  { id: 'daxue', name: '大雪', month: 12, icon: Snowflake, season: 'winter' },
  { id: 'dongzhi', name: '冬至', month: 12, icon: Snowflake, season: 'winter' },
  { id: 'xiaohan', name: '小寒', month: 1, icon: Snowflake, season: 'winter' },
  { id: 'dahan', name: '大寒', month: 1, icon: Snowflake, season: 'winter' },
]

const SEASONS = {
  spring: { name: '春季', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  summer: { name: '夏季', color: 'text-red-400', bgColor: 'bg-red-500/10' },
  autumn: { name: '秋季', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  winter: { name: '冬季', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
}

const TRANSITION_OPTIONS = [
  { id: 'fade', label: '淡入淡出' },
  { id: 'slide', label: '滑动' },
  { id: 'zoom', label: '缩放' },
]

export function SolarTermSettingsPanel({ settings, onChange }: SolarTermSettingsProps) {
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null)
  const [uploadingTerm, setUploadingTerm] = useState<SolarTerm | null>(null)

  const updateSetting = <K extends keyof SolarTermSettings>(
    key: K,
    value: SolarTermSettings[K]
  ) => {
    onChange({ ...settings, [key]: value })
  }

  const updateWallpaper = (term: SolarTerm, url: string) => {
    onChange({
      ...settings,
      wallpapers: { ...settings.wallpapers, [term]: url }
    })
  }

  const removeWallpaper = (term: SolarTerm) => {
    const newWallpapers = { ...settings.wallpapers }
    delete newWallpapers[term]
    onChange({ ...settings, wallpapers: newWallpapers })
  }

  const handleFileUpload = async (term: SolarTerm, file: File) => {
    setUploadingTerm(term)
    try {
      // 读取文件为 base64 用于预览
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        
        // 上传到壁纸库
        try {
          const wallpaper = await wallpaperLibraryApi.add({
            name: `${term}节气背景`,
            url: dataUrl,
            thumbnail: dataUrl,
            source: 'upload',
            category: 'solar-term',
            tags: ['solar-term', term],
            isFavorite: false,
          })
          // 使用服务器返回的 URL
          updateWallpaper(term, wallpaper.url)
        } catch (error) {
          console.error('Upload to library failed:', error)
          // 如果上传失败，使用本地 base64 作为后备
          updateWallpaper(term, dataUrl)
        }
        setUploadingTerm(null)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadingTerm(null)
    }
  }

  const getSeasonTerms = (season: string) => 
    SOLAR_TERMS.filter(term => term.season === season)

  const SeasonSection = ({ season }: { season: string }) => {
    const seasonData = SEASONS[season as keyof typeof SEASONS]
    const terms = getSeasonTerms(season)
    const isExpanded = expandedSeason === season

    return (
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setExpandedSeason(isExpanded ? null : season)}
          className={cn(
            'w-full flex items-center justify-between p-4 transition-colors',
            seasonData.bgColor
          )}
        >
          <div className="flex items-center gap-3">
            <span className={cn('font-medium', seasonData.color)}>
              {seasonData.name}
            </span>
            <span className="text-xs text-white/50">
              {terms.filter(t => settings.wallpapers[t.id]).length}/{terms.length} 已设置
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/50" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/50" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {terms.map((term) => {
                  const Icon = term.icon
                  const hasWallpaper = !!settings.wallpapers[term.id]

                  return (
                    <div
                      key={term.id}
                      className={cn(
                        'relative p-3 rounded-xl border transition-all',
                        hasWallpaper
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-white/10 hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={cn('w-4 h-4', seasonData.color)} />
                        <span className="font-medium text-sm">{term.name}</span>
                        {hasWallpaper && (
                          <Check className="w-3 h-3 text-green-400 ml-auto" />
                        )}
                      </div>

                      {hasWallpaper ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden group">
                          <img
                            src={settings.wallpapers[term.id]}
                            alt={term.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="p-2 rounded-lg bg-white/20 cursor-pointer hover:bg-white/30 transition-colors">
                              <Upload className="w-4 h-4" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(term.id, e.target.files[0])}
                              />
                            </label>
                            <button
                              onClick={() => removeWallpaper(term.id)}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center aspect-video rounded-lg border border-dashed border-white/20 cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all">
                          {uploadingTerm === term.id ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-white/30 mb-1" />
                              <span className="text-xs text-white/30">点击上传</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(term.id, e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 开关控制 */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="font-medium">启用节气背景</div>
            <div className="text-sm text-white/50">根据当前节气自动切换背景</div>
          </div>
        </div>
        <button
          onClick={() => updateSetting('enabled', !settings.enabled)}
          className={cn(
            'w-12 h-6 rounded-full transition-colors relative',
            settings.enabled ? 'bg-blue-500' : 'bg-gray-400 dark:bg-white/20'
          )}
        >
          <div
            className={cn(
              'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
              settings.enabled ? 'left-7' : 'left-1'
            )}
          />
        </button>
      </div>

      {settings.enabled && (
        <>
          {/* 自动切换 */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Settings2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="font-medium">自动切换</div>
                <div className="text-sm text-white/50">节气到来时自动更换背景</div>
              </div>
            </div>
            <button
              onClick={() => updateSetting('autoSwitch', !settings.autoSwitch)}
              className={cn(
                'w-12 h-6 rounded-full transition-colors relative',
                settings.autoSwitch ? 'bg-green-500' : 'bg-gray-400 dark:bg-white/20'
              )}
            >
              <div
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                  settings.autoSwitch ? 'left-7' : 'left-1'
                )}
              />
            </button>
          </div>

          {/* 过渡效果 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Image className="w-4 h-4" />
              过渡效果
            </h3>
            <div className="flex gap-2">
              {TRANSITION_OPTIONS.map((transition) => (
                <button
                  key={transition.id}
                  onClick={() => updateSetting('transition', transition.id as any)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm transition-all',
                    settings.transition === transition.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 hover:bg-white/10'
                  )}
                >
                  {transition.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/50">
                过渡时长: {settings.transitionDuration}ms
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={settings.transitionDuration}
                onChange={(e) => updateSetting('transitionDuration', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* 节气图片设置 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Image className="w-4 h-4" />
              节气背景图片
            </h3>
            <div className="space-y-2">
              {['spring', 'summer', 'autumn', 'winter'].map((season) => (
                <SeasonSection key={season} season={season} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
