'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  Shield,
  Upload,
  FileText,
  Bell,
  Activity,
  Gauge,
  Save,
  RotateCcw,
  RefreshCw,
  Check,
  AlertCircle,
  Info,
  Lock,
  Clock,
  FileUp,
  FileType,
  Folder,
  Zap,
  Timer,
  RotateCcw as RetryIcon
} from 'lucide-react'
import { useToast } from '../../../components/admin/Toast'
import {
  getAllSystemConfigs,
  updateSecuritySystemConfig,
  updateFileTransferSystemConfig,
  updateUploadSystemConfig,
  updateNotificationSystemConfig,
  resetSystemConfigsToDefaults,
  type SystemConfigs,
  type SecurityConfig,
  type FileTransferConfig,
  type UploadConfig,
  type NotificationConfig
} from '../../../lib/api-client/system-configs'

// 配置类别
 type ConfigCategory = 'security' | 'fileTransfer' | 'upload' | 'notification' | 'healthCheck' | 'rateLimit'

// 类别配置
const categories = [
  {
    id: 'security' as ConfigCategory,
    title: '安全配置',
    desc: '登录安全、会话管理、密码策略',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    bgColor: 'from-red-500/10 to-orange-500/10'
  },
  {
    id: 'fileTransfer' as ConfigCategory,
    title: '文件传输',
    desc: '文件大小限制、类型限制、存储路径',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-500/10 to-cyan-500/10'
  },
  {
    id: 'upload' as ConfigCategory,
    title: '上传配置',
    desc: '分片上传、并发控制、临时文件',
    icon: Upload,
    color: 'from-violet-500 to-purple-500',
    bgColor: 'from-violet-500/10 to-purple-500/10'
  },
  {
    id: 'notification' as ConfigCategory,
    title: '通知配置',
    desc: '冷却时间、重试策略',
    icon: Bell,
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'from-amber-500/10 to-yellow-500/10'
  }
]

export default function SystemConfigsPage() {
  const { showToast } = useToast()
  const [configs, setConfigs] = useState<SystemConfigs | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<ConfigCategory | null>(null)
  const [activeCategory, setActiveCategory] = useState<ConfigCategory>('security')
  const [editedConfigs, setEditedConfigs] = useState<Partial<SystemConfigs>>({})
  const [hasChanges, setHasChanges] = useState<Record<ConfigCategory, boolean>>({
    security: false,
    fileTransfer: false,
    upload: false,
    notification: false,
    healthCheck: false,
    rateLimit: false
  })

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const data = await getAllSystemConfigs()
      setConfigs(data)
      setEditedConfigs({})
      setHasChanges({
        security: false,
        fileTransfer: false,
        upload: false,
        notification: false,
        healthCheck: false,
        rateLimit: false
      })
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '获取系统配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigChange = (category: ConfigCategory, key: string, value: any) => {
    setEditedConfigs(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...configs?.[category],
        ...prev[category],
        [key]: value
      }
    }))
    setHasChanges(prev => ({ ...prev, [category]: true }))
  }

  const handleSave = async (category: ConfigCategory) => {
    try {
      setSaving(category)
      const configData = editedConfigs[category]
      
      switch (category) {
        case 'security':
          await updateSecuritySystemConfig(configData as Partial<SecurityConfig>)
          break
        case 'fileTransfer':
          await updateFileTransferSystemConfig(configData as Partial<FileTransferConfig>)
          break
        case 'upload':
          await updateUploadSystemConfig(configData as Partial<UploadConfig>)
          break
        case 'notification':
          await updateNotificationSystemConfig(configData as Partial<NotificationConfig>)
          break
      }
      
      showToast('success', '配置已保存')
      setHasChanges(prev => ({ ...prev, [category]: false }))
      await loadConfigs()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '保存配置失败')
    } finally {
      setSaving(null)
    }
  }

  const handleReset = async () => {
    if (!confirm('确定要重置所有配置为默认值吗？此操作不可恢复。')) {
      return
    }
    
    try {
      setLoading(true)
      await resetSystemConfigsToDefaults()
      showToast('success', '配置已重置为默认值')
      await loadConfigs()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '重置配置失败')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentConfig = (category: ConfigCategory) => {
    return editedConfigs[category] || configs?.[category] || {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>加载配置中...</span>
        </div>
      </div>
    )
  }

  const currentCategory = categories.find(c => c.id === activeCategory)
  const CategoryIcon = currentCategory?.icon || Settings

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Settings className="w-7 h-7 text-indigo-400" />
            系统配置管理
          </h1>
          <p className="text-slate-400 mt-1">管理系统运行参数和安全策略</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 
                     bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg
                     transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4" />
          重置为默认
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧导航 */}
        <div className="col-span-3 space-y-3">
          {categories.map((category) => {
            const Icon = category.icon
            const isActive = activeCategory === category.id
            const hasChange = hasChanges[category.id]
            
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r ' + category.bgColor + ' border-' + category.color.split('-')[1] + '-500/30' 
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>
                        {category.title}
                      </h3>
                      {hasChange && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{category.desc}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* 右侧配置面板 */}
        <div className="col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
            >
              {/* 面板头部 */}
              <div className={`px-6 py-4 border-b border-slate-800 bg-gradient-to-r ${currentCategory?.bgColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${currentCategory?.color} text-white`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-100">{currentCategory?.title}</h2>
                      <p className="text-sm text-slate-400">{currentCategory?.desc}</p>
                    </div>
                  </div>
                  {hasChanges[activeCategory] && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadConfigs()}
                        className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 
                                   border border-slate-700 rounded-lg transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleSave(activeCategory)}
                        disabled={saving === activeCategory}
                        className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white
                                   bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving === activeCategory ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        保存
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 配置表单 */}
              <div className="p-6 space-y-6">
                {activeCategory === 'security' && (
                  <SecurityConfigForm 
                    config={getCurrentConfig('security') as SecurityConfig}
                    onChange={(key, value) => handleConfigChange('security', key, value)}
                  />
                )}
                {activeCategory === 'fileTransfer' && (
                  <FileTransferConfigForm 
                    config={getCurrentConfig('fileTransfer') as FileTransferConfig}
                    onChange={(key, value) => handleConfigChange('fileTransfer', key, value)}
                  />
                )}
                {activeCategory === 'upload' && (
                  <UploadConfigForm 
                    config={getCurrentConfig('upload') as UploadConfig}
                    onChange={(key, value) => handleConfigChange('upload', key, value)}
                  />
                )}
                {activeCategory === 'notification' && (
                  <NotificationConfigForm 
                    config={getCurrentConfig('notification') as NotificationConfig}
                    onChange={(key, value) => handleConfigChange('notification', key, value)}
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// 安全配置表单
function SecurityConfigForm({ config, onChange }: { config: SecurityConfig; onChange: (key: string, value: any) => void }) {
  return (
    <div className="space-y-6">
      <ConfigSection title="登录安全" icon={Lock}>
        <div className="grid grid-cols-2 gap-4">
          <ConfigNumberInput
            label="最大登录尝试次数"
            value={config.maxLoginAttempts}
            onChange={(v) => onChange('maxLoginAttempts', v)}
            min={1}
            max={10}
            unit="次"
            description="超过此次数将锁定账户"
          />
          <ConfigNumberInput
            label="锁定时间"
            value={config.lockDurationMinutes}
            onChange={(v) => onChange('lockDurationMinutes', v)}
            min={1}
            max={60}
            unit="分钟"
            description="登录失败后的锁定时长"
          />
        </div>
      </ConfigSection>

      <ConfigSection title="会话管理" icon={Clock}>
        <ConfigNumberInput
          label="会话超时时间"
          value={config.sessionTimeoutHours}
          onChange={(v) => onChange('sessionTimeoutHours', v)}
          min={1}
          max={168}
          unit="小时"
          description="用户登录后的会话有效期"
        />
      </ConfigSection>

      <ConfigSection title="密码策略" icon={Shield}>
        <div className="space-y-4">
          <ConfigNumberInput
            label="密码最小长度"
            value={config.passwordMinLength}
            onChange={(v) => onChange('passwordMinLength', v)}
            min={4}
            max={32}
            unit="位"
            description="用户密码的最小长度要求"
          />
          <ConfigToggle
            label="要求强密码"
            checked={config.requireStrongPassword}
            onChange={(v) => onChange('requireStrongPassword', v)}
            description="密码必须包含大小写字母、数字和特殊字符"
          />
        </div>
      </ConfigSection>

      <ConfigSection title="功能开关" icon={Zap}>
        <div className="space-y-4">
          <ConfigToggle
            label="启用IP过滤"
            checked={config.enableIpFilter}
            onChange={(v) => onChange('enableIpFilter', v)}
            description="启用IP黑白名单过滤功能"
          />
          <ConfigToggle
            label="启用审计日志"
            checked={config.enableAuditLog}
            onChange={(v) => onChange('enableAuditLog', v)}
            description="记录所有管理员操作日志"
          />
        </div>
      </ConfigSection>
    </div>
  )
}

// 文件传输配置表单
function FileTransferConfigForm({ config, onChange }: { config: FileTransferConfig; onChange: (key: string, value: any) => void }) {
  return (
    <div className="space-y-6">
      <ConfigSection title="文件限制" icon={FileUp}>
        <div className="grid grid-cols-2 gap-4">
          <ConfigNumberInput
            label="最大文件大小"
            value={config.maxFileSizeMB}
            onChange={(v) => onChange('maxFileSizeMB', v)}
            min={1}
            max={1024}
            unit="MB"
            description="单个文件的最大允许大小"
          />
          <ConfigNumberInput
            label="最大过期时间"
            value={config.maxExpiryHours}
            onChange={(v) => onChange('maxExpiryHours', v)}
            min={1}
            max={720}
            unit="小时"
            description="文件分享的最大有效期"
          />
          <ConfigNumberInput
            label="最大下载次数"
            value={config.maxDownloads}
            onChange={(v) => onChange('maxDownloads', v)}
            min={1}
            max={100}
            unit="次"
            description="文件最多可被下载的次数"
          />
        </div>
      </ConfigSection>

      <ConfigSection title="文件类型" icon={FileType}>
        <div className="space-y-4">
          <ConfigTextArea
            label="允许的文件类型"
            value={config.allowedFileTypes?.join(', ') || ''}
            onChange={(v) => onChange('allowedFileTypes', v.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="jpg, png, pdf, docx..."
            description="允许上传的文件扩展名，用逗号分隔"
          />
          <ConfigTextArea
            label="禁止的文件类型"
            value={config.blockedFileTypes?.join(', ') || ''}
            onChange={(v) => onChange('blockedFileTypes', v.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="exe, bat, sh..."
            description="禁止上传的文件扩展名，用逗号分隔"
          />
        </div>
      </ConfigSection>

      <ConfigSection title="存储设置" icon={Folder}>
        <div className="space-y-4">
          <ConfigTextInput
            label="上传目录"
            value={config.uploadPath}
            onChange={(v) => onChange('uploadPath', v)}
            placeholder="./uploads"
            description="文件上传的存储路径"
          />
          <ConfigToggle
            label="启用病毒扫描"
            checked={config.enableVirusScan}
            onChange={(v) => onChange('enableVirusScan', v)}
            description="上传文件时进行病毒扫描（需要安装杀毒软件）"
          />
        </div>
      </ConfigSection>
    </div>
  )
}

// 上传配置表单
function UploadConfigForm({ config, onChange }: { config: UploadConfig; onChange: (key: string, value: any) => void }) {
  return (
    <div className="space-y-6">
      <ConfigSection title="分片上传" icon={Upload}>
        <div className="grid grid-cols-2 gap-4">
          <ConfigNumberInput
            label="分片大小"
            value={config.chunkSizeMB}
            onChange={(v) => onChange('chunkSizeMB', v)}
            min={1}
            max={50}
            unit="MB"
            description="每个分片的大小"
          />
          <ConfigNumberInput
            label="最大并发数"
            value={config.maxConcurrent}
            onChange={(v) => onChange('maxConcurrent', v)}
            min={1}
            max={10}
            unit="个"
            description="同时上传的分片数量"
          />
        </div>
      </ConfigSection>

      <ConfigSection title="临时文件" icon={Folder}>
        <div className="space-y-4">
          <ConfigTextInput
            label="临时目录"
            value={config.tempDir}
            onChange={(v) => onChange('tempDir', v)}
            placeholder="uploads/temp"
            description="分片上传的临时存储目录"
          />
          <div className="grid grid-cols-2 gap-4">
            <ConfigNumberInput
              label="会话过期时间"
              value={config.expireTimeHours}
              onChange={(v) => onChange('expireTimeHours', v)}
              min={1}
              max={72}
              unit="小时"
              description="未完成上传的会话保留时间"
            />
            <ConfigNumberInput
              label="清理间隔"
              value={config.cleanupIntervalMinutes}
              onChange={(v) => onChange('cleanupIntervalMinutes', v)}
              min={5}
              max={1440}
              unit="分钟"
              description="自动清理临时文件的间隔"
            />
          </div>
        </div>
      </ConfigSection>
    </div>
  )
}

// 通知配置表单
function NotificationConfigForm({ config, onChange }: { config: NotificationConfig; onChange: (key: string, value: any) => void }) {
  return (
    <div className="space-y-6">
      <ConfigSection title="通知策略" icon={Bell}>
        <ConfigNumberInput
          label="冷却时间"
          value={config.cooldownMinutes}
          onChange={(v) => onChange('cooldownMinutes', v)}
          min={1}
          max={60}
          unit="分钟"
          description="相同类型通知的最小发送间隔"
        />
      </ConfigSection>

      <ConfigSection title="重试策略" icon={RetryIcon}>
        <div className="grid grid-cols-2 gap-4">
          <ConfigNumberInput
            label="最大重试次数"
            value={config.maxRetries}
            onChange={(v) => onChange('maxRetries', v)}
            min={0}
            max={10}
            unit="次"
            description="发送失败后的最大重试次数"
          />
          <ConfigNumberInput
            label="重试间隔"
            value={config.retryIntervalMinutes}
            onChange={(v) => onChange('retryIntervalMinutes', v)}
            min={1}
            max={60}
            unit="分钟"
            description="每次重试之间的间隔"
          />
        </div>
      </ConfigSection>
    </div>
  )
}

// 配置区块组件
function ConfigSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-200">
        <Icon className="w-4 h-4 text-indigo-400" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="pl-6 space-y-4">
        {children}
      </div>
    </div>
  )
}

// 数字输入组件
function ConfigNumberInput({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  unit,
  description 
}: { 
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  unit: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={value || 0}
          onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
          min={min}
          max={max}
          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200
                     focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30
                     transition-all"
        />
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  )
}

// 文本输入组件
function ConfigTextInput({ 
  label, 
  value, 
  onChange, 
  placeholder,
  description 
}: { 
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200
                   focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30
                   transition-all"
      />
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  )
}

// 文本域组件
function ConfigTextArea({ 
  label, 
  value, 
  onChange, 
  placeholder,
  description 
}: { 
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200
                   focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30
                   transition-all resize-none"
      />
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  )
}

// 开关组件
function ConfigToggle({ 
  label, 
  checked, 
  onChange, 
  description 
}: { 
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200
          ${checked ? 'bg-indigo-500' : 'bg-slate-700'}`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-300">{label}</div>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}
