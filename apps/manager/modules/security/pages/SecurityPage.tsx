'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, AlertTriangle, Lock, Eye, Save, RefreshCw, Check, Info } from 'lucide-react'
import { useToast } from '../../../components/admin/Toast'
import { SSRFConfigPanel } from '../../../components/admin/SSRFConfig'
import {
  getSecurityConfig,
  updateCsrfConfig,
  getSecurityLogs,
  getSecurityStats,
  type SecurityConfig,
  type SecurityStats,
  type SecurityLog,
  type CsrfPathOption
} from '../../../lib/api-client/security'

export default function SecurityPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [config, setConfig] = useState<SecurityConfig | null>(null)
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'csrf' | 'ssrf' | 'logs' | 'alerts'>('csrf')
  const [csrfCategoryTab, setCsrfCategoryTab] = useState<string>('')
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null)
  const [showSmartConfigDialog, setShowSmartConfigDialog] = useState(false)
  const [logFilter, setLogFilter] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [configData, statsData, logsData] = await Promise.all([
        getSecurityConfig(),
        getSecurityStats(),
        getSecurityLogs(1, 20)
      ])
      setConfig(configData)
      setStats(statsData)
      setLogs(logsData.logs)
      
      // 初始化选中的路径
      if (configData.csrf.pathOptions) {
        const selected = new Set(
          configData.csrf.pathOptions.filter(opt => opt.selected).map(opt => opt.path)
        )
        setSelectedPaths(selected)
        
        // 设置默认选中的分类标签
        const categories = new Set(configData.csrf.pathOptions.map(opt => opt.category))
        const categoryList = Array.from(categories)
        if (categoryList.length > 0 && !csrfCategoryTab) {
          setCsrfCategoryTab(categoryList[0])
        }
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '获取安全数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCsrfConfig = async () => {
    try {
      setSaving(true)
      await updateCsrfConfig(Array.from(selectedPaths))
      showToast('success', 'CSRF 配置已更新，重启服务后生效')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '更新配置失败')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePath = (path: string) => {
    const newSelected = new Set(selectedPaths)
    if (newSelected.has(path)) {
      newSelected.delete(path)
    } else {
      newSelected.add(path)
    }
    setSelectedPaths(newSelected)
  }

  const handleSelectAllInCategory = (category: string, select: boolean) => {
    const categoryPaths = config?.csrf.pathOptions.filter(opt => opt.category === category) || []
    const newSelected = new Set(selectedPaths)
    categoryPaths.forEach(opt => {
      if (select) {
        newSelected.add(opt.path)
      } else {
        newSelected.delete(opt.path)
      }
    })
    setSelectedPaths(newSelected)
  }

  const handleResetToDefault = () => {
    if (!config) return
    const defaultPaths = new Set(config.csrf.defaultPaths)
    setSelectedPaths(defaultPaths)
    showToast('success', 'CSRF 忽略路径已恢复为默认值')
  }

  const handleSmartConfig = () => {
    if (!config) return
    
    // 智能配置逻辑：根据日志分析推荐配置
    const smartPaths = new Set<string>()
    
    // 1. 必须的基础路径（认证相关）
    const essentialPaths = [
      '/api/health-check',
      '/api/auth/login',
      '/api/auth/register',
      '/api/v2/users/login',
      '/api/v2/users/register',
      '/api/admin/login',
      '/api/v2/admin/login'
    ]
    essentialPaths.forEach(p => smartPaths.add(p))
    
    // 2. 根据日志分析添加常用路径
    const recentLogs = logs.slice(0, 100) // 最近100条日志
    const pathUsage: Record<string, number> = {}
    
    recentLogs.forEach(log => {
      const action = log.action
      if (action.includes('USER') || action.includes('LOGIN')) {
        pathUsage['/api/v2/users'] = (pathUsage['/api/v2/users'] || 0) + 1
      }
      if (action.includes('PLUGIN')) {
        pathUsage['/api/v2/plugins'] = (pathUsage['/api/v2/plugins'] || 0) + 1
      }
      if (action.includes('BOOKMARK') || action.includes('CATEGORY')) {
        pathUsage['/api/v2/system'] = (pathUsage['/api/v2/system'] || 0) + 1
      }
    })
    
    // 如果使用频率高，添加对应路径
    Object.entries(pathUsage).forEach(([path, count]) => {
      if (count >= 5) { // 使用5次以上
        smartPaths.add(path)
      }
    })
    
    // 3. 添加安全管理路径
    smartPaths.add('/api/v2/security')
    
    setSelectedPaths(smartPaths)
    setShowSmartConfigDialog(true)
  }

  // 按分类分组路径选项
  const groupedPaths = config?.csrf.pathOptions.reduce((acc, opt) => {
    if (!acc[opt.category]) acc[opt.category] = []
    acc[opt.category].push(opt)
    return acc
  }, {} as Record<string, CsrfPathOption[]>) || {}

  // 计算每个分类的选中状态
  const getCategoryStatus = (category: string) => {
    const paths = groupedPaths[category] || []
    const selectedCount = paths.filter(opt => selectedPaths.has(opt.path)).length
    if (selectedCount === 0) return 'none'
    if (selectedCount === paths.length) return 'all'
    return 'partial'
  }

  // 筛选后的日志
  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true
    return log.actionType === logFilter
  })

  // 获取严重级别颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444'
      case 'high': return '#f97316'
      case 'medium': return '#f59e0b'
      case 'low': return 'var(--color-primary)'
      default: return 'var(--color-primary)'
    }
  }

  // 获取严重级别背景色
  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'rgba(239, 68, 68, 0.2)'
      case 'high': return 'rgba(249, 115, 22, 0.2)'
      case 'medium': return 'rgba(245, 158, 11, 0.2)'
      case 'low': return 'rgba(34, 197, 94, 0.2)'
      default: return 'var(--color-glass)'
    }
  }

  // 获取严重级别文字颜色
  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444'
      case 'high': return '#f97316'
      case 'medium': return '#f59e0b'
      case 'low': return '#22c55e'
      default: return 'var(--color-text-secondary)'
    }
  }

  // 获取严重级别标签
  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return '严重'
      case 'high': return '高'
      case 'medium': return '中'
      case 'low': return '低'
      default: return '未知'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
            {t('admin.security.title')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('admin.security.subtitle')}
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{
            background: 'var(--color-glass)',
            border: '1px solid var(--color-glass-border)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.refresh')}
        </button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 rounded-xl" style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-glass-border)'
          }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: 'var(--color-text-muted)' }}>{t('admin.security.stats.today_requests')}</span>
              <Eye className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div className="text-2xl font-bold">{stats.todayRequests}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('admin.security.stats.total_requests')}</p>
          </div>
          <div className="p-6 rounded-xl" style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-glass-border)'
          }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: 'var(--color-text-muted)' }}>{t('admin.security.stats.failed_logins')}</span>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold">{stats.failedLogins}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('admin.security.stats.within_24h')}</p>
          </div>
          <div className="p-6 rounded-xl" style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-glass-border)'
          }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: 'var(--color-text-muted)' }}>{t('admin.security.stats.csrf_blocked')}</span>
              <Lock className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold">{stats.csrfBlocked}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('admin.security.stats.within_24h')}</p>
          </div>
          <div className="p-6 rounded-xl" style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-glass-border)'
          }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: 'var(--color-text-muted)' }}>{t('admin.security.stats.security_status')}</span>
              <Shield className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{t('admin.security.stats.normal')}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('admin.security.stats.system_running')}</p>
          </div>
        </div>
      )}

      {/* 标签页 */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
          {(['csrf', 'ssrf', 'logs', 'alerts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 font-medium transition-colors relative"
              style={{
                color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)'
              }}
            >
              {tab === 'csrf' && 'CSRF'}
              {tab === 'ssrf' && 'SSRF'}
              {tab === 'logs' && t('admin.security.tabs.logs')}
              {tab === 'alerts' && t('admin.security.tabs.alerts')}
              {activeTab === tab && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: 'var(--color-primary)' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* CSRF 配置 */}
        {activeTab === 'csrf' && (
          <div className="space-y-6">
            {/* 说明卡片 */}
            <div className="p-4 rounded-lg" style={{ 
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-glass-border)'
            }}>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                <div>
                  <h3 className="font-medium mb-1">什么是 CSRF 防护？</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    CSRF（跨站请求伪造）是一种网络攻击方式。系统默认会验证每个请求的 CSRF Token，
                    但某些公开接口（如登录、注册）需要跳过验证才能正常工作。下面列出了所有可配置的 API 路径，
                    勾选的路径将跳过 CSRF 验证。
                  </p>
                  <p className="text-sm mt-2 text-yellow-600">
                    注意：修改配置后需要重启后端服务才能生效
                  </p>
                </div>
              </div>
            </div>

            {/* 状态栏 */}
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ 
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-glass-border)'
            }}>
              <div className="flex items-center gap-4">
                <span>CSRF 防护状态：</span>
                <span
                  className="px-2 py-1 rounded text-sm font-medium"
                  style={{
                    background: config?.csrf.enabled ? 'var(--color-primary)' : 'var(--color-error)',
                    color: 'white'
                  }}
                >
                  {config?.csrf.enabled ? '已启用' : '已禁用'}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  已选择 {selectedPaths.size} 个忽略路径
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSmartConfig}
                  className="px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-primary)',
                    color: 'var(--color-primary)'
                  }}
                >
                  <span>🤖</span>
                  智能配置
                </button>
                <button
                  onClick={handleResetToDefault}
                  className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                  style={{
                    background: 'var(--color-glass)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  恢复默认
                </button>
                <button
                  onClick={handleSaveCsrfConfig}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm text-white transition-colors"
                  style={{ background: 'var(--color-primary)', opacity: saving ? 0.7 : 1 }}
                >
                  <Save className="w-4 h-4" />
                  {saving ? '保存中...' : '保存配置'}
                </button>
              </div>
            </div>

            {/* 分类标签页 */}
            <div className="flex gap-2 border-b mb-4" style={{ borderColor: 'var(--color-glass-border)' }}>
              {Object.entries(groupedPaths).map(([category, paths]) => {
                const status = getCategoryStatus(category)
                const selectedCount = paths.filter(p => selectedPaths.has(p.path)).length
                
                return (
                  <button
                    key={category}
                    onClick={() => setCsrfCategoryTab(category)}
                    className="px-4 py-2 font-medium transition-colors relative flex items-center gap-2"
                    style={{
                      color: csrfCategoryTab === category ? 'var(--color-primary)' : 'var(--color-text-muted)'
                    }}
                  >
                    <span>{category}</span>
                    <span 
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ 
                        background: status === 'all' ? 'var(--color-primary)' : status === 'partial' ? '#f59e0b' : 'var(--color-glass)',
                        color: status === 'all' || status === 'partial' ? 'white' : 'var(--color-text-muted)'
                      }}
                    >
                      {selectedCount}/{paths.length}
                    </span>
                    {csrfCategoryTab === category && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: 'var(--color-primary)' }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* 路径选择 - 当前选中的分类 */}
            {csrfCategoryTab && groupedPaths[csrfCategoryTab] && (
              <div 
                className="rounded-lg overflow-hidden"
                style={{ 
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-glass-border)'
                }}
              >
                {/* 分类标题和操作 */}
                <div 
                  className="flex items-center justify-between p-4"
                  style={{ background: 'var(--color-bg-tertiary)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{csrfCategoryTab}</span>
                    <span 
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ 
                        background: 'var(--color-glass)',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      {groupedPaths[csrfCategoryTab].filter(p => selectedPaths.has(p.path)).length}/{groupedPaths[csrfCategoryTab].length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSelectAllInCategory(csrfCategoryTab, getCategoryStatus(csrfCategoryTab) !== 'all')}
                    className="px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
                    style={{
                      background: 'var(--color-glass)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    {getCategoryStatus(csrfCategoryTab) === 'all' ? '取消全选' : '全选'}
                  </button>
                </div>

                {/* 路径列表 */}
                <div className="divide-y" style={{ borderColor: 'var(--color-glass-border)' }}>
                  {groupedPaths[csrfCategoryTab].map((pathOpt) => (
                    <div 
                      key={pathOpt.path}
                      className="flex items-start gap-3 p-4 hover:bg-white/5 transition-colors"
                    >
                      <button
                        onClick={() => handleTogglePath(pathOpt.path)}
                        className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                          selectedPaths.has(pathOpt.path)
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-400 hover:border-green-500'
                        }`}
                      >
                        {selectedPaths.has(pathOpt.path) && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm font-mono px-2 py-0.5 rounded bg-black/20">
                            {pathOpt.path}
                          </code>
                          <span className="text-sm font-medium">{pathOpt.description}</span>
                          {config?.csrf.defaultPaths.includes(pathOpt.path) && (
                            <span 
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{ 
                                background: 'var(--color-primary)',
                                color: 'white'
                              }}
                            >
                              默认
                            </span>
                          )}
                        </div>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                          {pathOpt.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SSRF 配置 */}
        {activeTab === 'ssrf' && (
          <SSRFConfigPanel />
        )}

        {/* 安全日志 */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* 筛选栏 */}
            <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg" style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-glass-border)'
            }}>
              <span className="text-sm font-medium">筛选：</span>
              {[
                { key: 'all', label: '全部' },
                { key: 'login', label: '登录' },
                { key: 'auth', label: '认证' },
                { key: 'bookmark', label: '书签' },
                { key: 'user', label: '用户' },
                { key: 'security', label: '安全' },
                { key: 'system', label: '系统错误' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setLogFilter(filter.key)}
                  className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                  style={{
                    background: logFilter === filter.key ? 'var(--color-primary)' : 'var(--color-glass)',
                    border: '1px solid var(--color-glass-border)',
                    color: logFilter === filter.key ? 'white' : 'var(--color-text-secondary)'
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* 日志表格 */}
            <div className="rounded-xl overflow-hidden" style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-glass-border)'
            }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: 'var(--color-bg-tertiary)' }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">时间</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">IP 地址 / 位置</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">设备 / 浏览器</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">级别</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr 
                        key={log.id} 
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                        style={{ borderTop: '1px solid var(--color-glass-border)' }}
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm">{log.timeAgo}</div>
                          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              background: getSeverityColor(log.severity),
                              color: 'white'
                            }}
                          >
                            {log.actionLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-sm">{log.ip}</div>
                          <div className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                            <span>📍</span>
                            {log.ipLocation?.display || '未知位置'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{log.userAgent?.device || '未知设备'}</div>
                          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {log.userAgent?.browser?.name} {log.userAgent?.browser?.version}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              background: getSeverityBgColor(log.severity),
                              color: getSeverityTextColor(log.severity)
                            }}
                          >
                            {getSeverityLabel(log.severity)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 分页 */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  共 {logs.length} 条记录
                </span>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                    style={{
                      background: 'var(--color-glass)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    上一页
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                    style={{
                      background: 'var(--color-glass)',
                      border: '1px solid var(--color-glass-border)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 异常告警 */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {/* 告警列表 */}
            <div className="p-6 rounded-xl" style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-glass-border)'
            }}>
              <h2 className="text-xl font-semibold mb-4">最近异常活动</h2>
              {logs.filter(log => ['high', 'critical'].includes(log.severity)).length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                  <Shield className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>暂无异常活动</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs
                    .filter(log => ['high', 'critical'].includes(log.severity))
                    .map((alert) => (
                      <div
                        key={alert.id}
                        className="p-4 rounded-lg border-l-4"
                        style={{ 
                          background: 'var(--color-bg-tertiary)',
                          borderLeftColor: alert.severity === 'critical' ? '#ef4444' : '#f59e0b'
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{alert.actionLabel}</span>
                              <span
                                className="px-2 py-0.5 rounded text-xs"
                                style={{
                                  background: alert.severity === 'critical' ? '#ef4444' : '#f59e0b',
                                  color: 'white'
                                }}
                              >
                                {alert.severity === 'critical' ? '严重' : '警告'}
                              </span>
                            </div>
                            <div className="text-sm space-y-1" style={{ color: 'var(--color-text-muted)' }}>
                              <div className="flex items-center gap-4">
                                <span>📍 {alert.ipLocation?.fullDisplay || alert.ip}</span>
                                <span>🌐 {alert.userAgent?.browser?.name} {alert.userAgent?.os?.name}</span>
                              </div>
                              <div>{new Date(alert.createdAt).toLocaleString()} ({alert.timeAgo})</div>
                            </div>
                          </div>
                          <button
                            className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                            style={{
                              background: 'var(--color-glass)',
                              border: '1px solid var(--color-glass-border)',
                              color: 'var(--color-text-secondary)'
                            }}
                            onClick={() => setSelectedLog(alert)}
                          >
                            查看详情
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 智能配置弹窗 */}
        {showSmartConfigDialog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowSmartConfigDialog(false)}
          >
            <div
              className="w-full max-w-lg p-6 rounded-xl"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-glass-border)'
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🤖</span>
                <h3 className="text-lg font-semibold">智能配置推荐</h3>
              </div>
              
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                系统根据您的使用日志分析，为您推荐以下 CSRF 忽略路径配置：
              </p>

              <div className="space-y-3 mb-6">
                {/* 基础路径 */}
                <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-500">✓</span>
                    <span className="font-medium text-sm">基础认证路径（必需）</span>
                  </div>
                  <div className="text-xs space-y-1 pl-6" style={{ color: 'var(--color-text-muted)' }}>
                    <div>• 登录/注册接口</div>
                    <div>• 健康检查接口</div>
                    <div>• 安全管理接口</div>
                  </div>
                </div>

                {/* 推荐路径 */}
                {selectedPaths.has('/api/v2/users') && (
                  <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-500">📊</span>
                      <span className="font-medium text-sm">用户管理 API</span>
                    </div>
                    <div className="text-xs pl-6" style={{ color: 'var(--color-text-muted)' }}>
                      根据日志分析，用户管理功能使用频繁，建议添加
                    </div>
                  </div>
                )}

                {selectedPaths.has('/api/v2/plugins') && (
                  <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-purple-500">🔌</span>
                      <span className="font-medium text-sm">插件系统 API</span>
                    </div>
                    <div className="text-xs pl-6" style={{ color: 'var(--color-text-muted)' }}>
                      检测到插件相关操作，建议添加
                    </div>
                  </div>
                )}

                {selectedPaths.has('/api/v2/system') && (
                  <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-orange-500">⚙️</span>
                      <span className="font-medium text-sm">系统信息 API</span>
                    </div>
                    <div className="text-xs pl-6" style={{ color: 'var(--color-text-muted)' }}>
                      书签/分类操作频繁，建议添加
                    </div>
                  </div>
                )}

                {/* 统计信息 */}
                <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    共推荐 <span className="font-medium text-white">{selectedPaths.size}</span> 个路径
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSmartConfigDialog(false)
                    handleResetToDefault()
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    background: 'var(--color-glass)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowSmartConfigDialog(false)
                    showToast('success', '已应用智能配置，请保存')
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm text-white transition-colors"
                  style={{ background: 'var(--color-primary)' }}
                >
                  应用推荐
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 日志详情弹窗 */}
        {selectedLog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSelectedLog(null)}
          >
            <div
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 rounded-xl"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-glass-border)'
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">日志详情</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>操作类型</div>
                    <div className="font-medium">{selectedLog.actionLabel}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>严重级别</div>
                    <span
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        background: getSeverityBgColor(selectedLog.severity),
                        color: getSeverityTextColor(selectedLog.severity)
                      }}
                    >
                      {getSeverityLabel(selectedLog.severity)}
                    </span>
                  </div>
                </div>

                {/* 时间信息 */}
                <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>时间</div>
                  <div className="font-mono">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                  <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{selectedLog.timeAgo}</div>
                </div>

                {/* IP 信息 */}
                <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                  <div className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>IP 地址信息</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="opacity-60">IP:</span> {selectedLog.ip}</div>
                    <div><span className="opacity-60">国家:</span> {selectedLog.ipLocation?.country}</div>
                    <div><span className="opacity-60">地区:</span> {selectedLog.ipLocation?.region}</div>
                    <div><span className="opacity-60">城市:</span> {selectedLog.ipLocation?.city}</div>
                    <div className="col-span-2"><span className="opacity-60">ISP:</span> {selectedLog.ipLocation?.isp}</div>
                  </div>
                </div>

                {/* 设备信息 */}
                <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                  <div className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>设备信息</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="opacity-60">设备:</span> {selectedLog.userAgent?.device}</div>
                    <div><span className="opacity-60">浏览器:</span> {selectedLog.userAgent?.browser?.name} {selectedLog.userAgent?.browser?.version}</div>
                    <div className="col-span-2"><span className="opacity-60">操作系统:</span> {selectedLog.userAgent?.os?.name} {selectedLog.userAgent?.os?.version}</div>
                  </div>
                </div>

                {/* 操作详情 */}
                {selectedLog.details && (
                  <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                    <div className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>操作详情</div>
                    <pre className="text-xs overflow-x-auto p-2 rounded" style={{ background: 'var(--color-bg-primary)' }}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}

                {/* User Agent */}
                <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>User Agent</div>
                  <div className="text-xs font-mono break-all opacity-60">{selectedLog.userAgent?.raw}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
