/**
 * 统一插件管理组件
 * 使用新的统一插件API
 */

import { useState, useEffect } from 'react'
import { 
  Puzzle, Plus, Trash2, Settings, Eye, EyeOff, 
  LayoutGrid, CheckCircle2, XCircle, Box, Monitor,
  Quote, StickyNote, FileText, Rss, Cloud, Shield,
  Bell, Gauge, Calendar, Image, Link2, Hash,
  Server, Database, Lock, Globe, Cpu, Radio, Wifi,
  Sun, Moon, Star, Heart, Music, Video, Camera,
  Mail, MessageSquare, Phone, MapPin, Navigation,
  Clock, Timer, Zap, Flame, Snowflake, Droplets,
  Target, Flag, Bookmark, Award, Trophy, Medal,
  User, Users, Home, Building, Map, Compass,
  Search, Filter, Grid, List, Edit, Copy, Scissors,
  Share2, Download, Upload, ExternalLink, RefreshCw,
  Save, Folder, FolderOpen, File, Menu, X, Check,
  CheckSquare, Circle, Play, Pause, Volume, Mic,
  Headphones, Smartphone, Laptop, Battery, Thermometer,
  Wind, CloudRain, Umbrella, ShoppingCart, CreditCard,
  Wallet, Package, Truck, Ship, Plane, Car, Bus, Train,
  Bike, AlertCircle, AlertTriangle, Info, HelpCircle,
  MessageCircle, BarChart, PieChart, LineChart, Activity,
  TrendingUp, TrendingDown, DollarSign, Euro, Bitcoin,
  PiggyBank, Coins, Clipboard, PenTool, Pencil, Brush,
  Palette, Wrench, Hammer, School, GraduationCap, Book,
  BookOpen, Library, Newspaper
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { UnifiedPlugin } from '../../api-unified'
import * as api from '../../api-unified'

// 图标映射表 - 将字符串图标名称映射到 Lucide 图标组件
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Quote,
  StickyNote,
  FileText,
  Rss,
  Cloud,
  Shield,
  Bell,
  Gauge,
  Calendar,
  Image,
  Link2,
  Hash,
  Server,
  Database,
  Lock,
  Globe,
  Cpu,
  Radio,
  Wifi,
  Sun,
  Moon,
  Star,
  Heart,
  Music,
  Video,
  Camera,
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Navigation,
  Clock,
  Timer,
  Zap,
  Flame,
  Snowflake,
  Droplets,
  Target,
  Flag,
  Bookmark,
  Award,
  Trophy,
  Medal,
  User,
  Users,
  Home,
  Building,
  Map,
  Compass,
  Search,
  Filter,
  Grid,
  List,
  Edit,
  Copy,
  Scissors,
  Share2,
  Download,
  Upload,
  ExternalLink,
  RefreshCw,
  Save,
  Folder,
  File,
  Menu,
  X,
  Check,
  CheckSquare,
  Circle,
  Play,
  Pause,
  Volume,
  Mic,
  Headphones,
  Monitor,
  Smartphone,
  Laptop,
  Battery,
  Thermometer,
  Wind,
  CloudRain,
  Umbrella,
  ShoppingCart,
  CreditCard,
  Wallet,
  Package,
  Truck,
  Plane,
  Car,
  Bus,
  Train,
  Bike,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  MessageCircle,
  BarChart,
  PieChart,
  LineChart,
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Euro,
  Bitcoin,
  PiggyBank,
  Coins,
  Clipboard,
  PenTool,
  Pencil,
  Brush,
  Palette,
  Wrench,
  Hammer,
  School,
  GraduationCap,
  Book,
  BookOpen,
  Library,
  Newspaper,
  Puzzle,
  Settings,
  EyeOff,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  Box,
  Plus,
  Trash2,
}

// 获取图标组件
function getPluginIcon(iconName?: string) {
  if (!iconName) return Puzzle
  return iconMap[iconName] || Puzzle
}

const SLOT_OPTIONS = [
  { value: 'header-left', label: 'Header 左侧' },
  { value: 'header-center', label: 'Header 中间' },
  { value: 'header-right', label: 'Header 右侧' },
  { value: 'hero-before', label: 'Hero 区域前' },
  { value: 'hero-after', label: 'Hero 区域后' },
  { value: 'content-sidebar', label: '内容侧边栏' },
  { value: 'content-before', label: '内容区前' },
  { value: 'content-after', label: '内容区后' },
  { value: 'floating', label: '浮动按钮' },
]

interface UnifiedPluginManagerProps {
  onManagePlugin?: (plugin: UnifiedPlugin) => void
}

export function UnifiedPluginManager({ onManagePlugin }: UnifiedPluginManagerProps = {}) {
  const [plugins, setPlugins] = useState<UnifiedPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'list' | 'slots'>('list')

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    try {
      setLoading(true)
      const data = await api.fetchAllPlugins()
      setPlugins(data)
    } catch (error) {
      console.error('加载插件失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnable = async (plugin: UnifiedPlugin) => {
    try {
      await api.togglePlugin(plugin.id, !plugin.isEnabled)
      loadPlugins()
    } catch (error) {
      alert('操作失败')
    }
  }

  const handleDelete = async (plugin: UnifiedPlugin) => {
    if (plugin.isBuiltin) {
      alert('内置插件不能删除')
      return
    }
    if (!confirm(`确定要删除插件 "${plugin.name}" 吗？`)) return
    try {
      await api.deletePlugin(plugin.id)
      loadPlugins()
    } catch (error) {
      alert('删除失败')
    }
  }

  const handleUpdateSlot = async (pluginId: string, slot: string) => {
    try {
      await api.updatePluginSlotConfig(pluginId, { slot })
      loadPlugins()
    } catch (error) {
      alert('更新插槽失败')
    }
  }

  const builtinPlugins = plugins.filter(p => p.isBuiltin)
  const customPlugins = plugins.filter(p => !p.isBuiltin)

  return (
    <div className="space-y-6">
      {/* 标签页切换 */}
      <div 
        className="flex items-center gap-2 p-1 rounded-xl border"
        style={{ background: 'var(--color-glass)', borderColor: 'var(--color-glass-border)' }}
      >
        <button
          onClick={() => setActiveTab('list')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'list'
              ? 'shadow-sm'
              : 'hover:bg-white/5'
          )}
          style={{
            background: activeTab === 'list' ? 'var(--color-glass-hover)' : 'transparent',
            color: activeTab === 'list' ? 'var(--color-text)' : 'var(--color-text-muted)'
          }}
        >
          <Box className="w-4 h-4" />
          插件列表
        </button>
        <button
          onClick={() => setActiveTab('slots')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'slots'
              ? 'shadow-sm'
              : 'hover:bg-white/5'
          )}
          style={{
            background: activeTab === 'slots' ? 'var(--color-glass-hover)' : 'transparent',
            color: activeTab === 'slots' ? 'var(--color-text)' : 'var(--color-text-muted)'
          }}
        >
          <LayoutGrid className="w-4 h-4" />
          插槽配置
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>加载中...</div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 内置插件 */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                  内置插件 ({builtinPlugins.length})
                </h3>
                <div className="grid gap-3">
                  {builtinPlugins.map(plugin => (
                    <PluginCard
                      key={plugin.id}
                      plugin={plugin}
                      onToggle={() => handleToggleEnable(plugin)}
                      onDelete={() => handleDelete(plugin)}
                      onConfigure={onManagePlugin ? () => onManagePlugin(plugin) : undefined}
                      onManageData={onManagePlugin ? () => onManagePlugin(plugin) : undefined}
                    />
                  ))}
                </div>
              </div>

              {/* 自定义插件 */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                  <Puzzle className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                  自定义插件 ({customPlugins.length})
                </h3>
                {customPlugins.length === 0 ? (
                  <div className="text-center py-8 rounded-lg border border-dashed" style={{ borderColor: 'var(--color-glass-border)' }}>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>暂无自定义插件</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {customPlugins.map(plugin => (
                      <PluginCard
                      key={plugin.id}
                      plugin={plugin}
                      onToggle={() => handleToggleEnable(plugin)}
                      onDelete={() => handleDelete(plugin)}
                      onConfigure={onManagePlugin ? () => onManagePlugin(plugin) : undefined}
                      onManageData={onManagePlugin ? () => onManagePlugin(plugin) : undefined}
                    />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="slots"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {SLOT_OPTIONS.map(slot => {
                const slotPlugins = plugins.filter(
                  p => p.isEnabled && p.defaultSlot === slot.value
                )
                return (
                  <div
                    key={slot.value}
                    className="p-4 rounded-lg border"
                    style={{ 
                      background: 'var(--color-glass)',
                      borderColor: 'var(--color-glass-border)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium" style={{ color: 'var(--color-text)' }}>{slot.label}</h4>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {slotPlugins.length} 个插件
                      </span>
                    </div>
                    <div className="space-y-2">
                      {slotPlugins.map(plugin => (
                        <div
                          key={plugin.id}
                          className="flex items-center justify-between p-2 rounded"
                          style={{ background: 'var(--color-glass-hover)' }}
                        >
                          <span className="text-sm" style={{ color: 'var(--color-text)' }}>{plugin.name}</span>
                          <select
                            value={plugin.defaultSlot || ''}
                            onChange={e => handleUpdateSlot(plugin.id, e.target.value)}
                            className="text-xs rounded px-2 py-1"
                            style={{ 
                              background: 'var(--color-glass)',
                              borderColor: 'var(--color-glass-border)',
                              color: 'var(--color-text)'
                            }}
                          >
                            {SLOT_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

interface PluginCardProps {
  plugin: UnifiedPlugin
  onToggle: () => void
  onDelete: () => void
  onConfigure?: () => void
  onManageData?: () => void
}

function PluginIcon({ iconName, className, style }: { iconName?: string; className?: string; style?: React.CSSProperties }) {
  switch (iconName) {
    case 'Quote': return <Quote className={className} style={style} />
    case 'Upload': return <Upload className={className} style={style} />
    case 'Rss': return <Rss className={className} style={style} />
    case 'StickyNote': return <StickyNote className={className} style={style} />
    case 'BarChart': return <BarChart className={className} style={style} />
    default: return <Puzzle className={className} style={style} />
  }
}

function PluginCard({ plugin, onToggle, onDelete, onConfigure, onManageData }: PluginCardProps) {
  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg border transition-colors"
      style={{ 
        background: 'var(--color-glass)',
        borderColor: 'var(--color-glass-border)'
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: plugin.isEnabled ? 'var(--color-primary-bg)' : 'var(--color-glass-hover)' }}
        >
          <PluginIcon 
            iconName={plugin.icon} 
            className="w-5 h-5"
            style={{ color: 'var(--color-primary)' }}
          />
        </div>
        <div>
          <h4 className="font-medium flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            {plugin.name}
            {plugin.isBuiltin && (
              <span 
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}
              >
                内置
              </span>
            )}
          </h4>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{plugin.description}</p>
          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span>v{plugin.version}</span>
            {plugin.hasFrontend && plugin.defaultSlot && (
              <span>插槽: {plugin.defaultSlot}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onManageData && (
          <button
            onClick={onManageData}
            className="px-3 py-2 rounded-lg transition-colors text-sm"
            style={{ 
              background: 'var(--color-primary-bg)', 
              color: 'var(--color-primary)'
            }}
            title="管理数据"
          >
            管理数据
          </button>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg transition-colors"
          style={{
            background: plugin.isEnabled ? 'var(--color-success-bg)' : 'var(--color-glass-hover)',
            color: plugin.isEnabled ? 'var(--color-success)' : 'var(--color-text-muted)'
          }}
          title={plugin.isEnabled ? '禁用' : '启用'}
        >
          {plugin.isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        {onConfigure && (
          <button
            onClick={onConfigure}
            className="p-2 rounded-lg transition-colors"
            style={{
              background: 'var(--color-glass-hover)',
              color: 'var(--color-text-muted)'
            }}
            title="配置"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
        {!plugin.isBuiltin && (
          <button
            onClick={onDelete}
            className="p-2 rounded-lg transition-colors"
            style={{
              background: 'var(--color-glass-hover)',
              color: 'var(--color-text-muted)'
            }}
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
