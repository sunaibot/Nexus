'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, Info, Save, Check, Globe, Lock } from 'lucide-react'
import { useToast } from './Toast'

interface SSRFConfig {
  allowPrivateIPs: boolean
}

const API_BASE_URL = '/api'

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

export function SSRFConfigPanel() {
  const { showToast } = useToast()
  const [config, setConfig] = useState<SSRFConfig>({ allowPrivateIPs: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/v2/system/security/ssrf`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken() || ''}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setConfig(data.data)
      }
    } catch (error) {
      console.error('加载SSRF配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/v2/system/security/ssrf`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken() || ''}`,
        },
        body: JSON.stringify(config),
      })
      const data = await response.json()
      if (data.success) {
        showToast('success', 'SSRF配置已保存')
      } else {
        throw new Error(data.error || '保存失败')
      }
    } catch (error: any) {
      showToast('error', error.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 说明卡片 */}
      <div className="p-4 rounded-lg" style={{ 
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-glass-border)'
      }}>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
          <div>
            <h3 className="font-medium mb-1">什么是 SSRF 防护？</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              SSRF（服务器端请求伪造）是一种安全漏洞，攻击者可能利用服务器发起对内部网络的请求。
              本系统采用分层防护策略，默认禁止访问内网地址以确保公网部署安全。
            </p>
          </div>
        </div>
      </div>

      {/* 配置卡片 */}
      <div className="p-6 rounded-lg space-y-6" style={{ 
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-glass-border)'
      }}>
        {/* 内网访问开关 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
              {config.allowPrivateIPs ? (
                <Globe className="w-5 h-5 text-amber-500" />
              ) : (
                <Lock className="w-5 h-5 text-emerald-500" />
              )}
            </div>
            <div>
              <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                允许访问内网地址
              </h4>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                允许服务监控访问私有IP（10.x.x.x, 172.16-31.x.x, 192.168.x.x）
              </p>
            </div>
          </div>
          <button
            onClick={() => setConfig(prev => ({ ...prev, allowPrivateIPs: !prev.allowPrivateIPs }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              config.allowPrivateIPs ? 'bg-emerald-500' : 'bg-gray-400'
            }`}
          >
            <motion.div
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
              animate={{ left: config.allowPrivateIPs ? '32px' : '4px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {/* 状态提示 */}
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          config.allowPrivateIPs 
            ? 'bg-amber-500/10 border border-amber-500/20' 
            : 'bg-emerald-500/10 border border-emerald-500/20'
        }`}>
          {config.allowPrivateIPs ? (
            <>
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" />
              <div>
                <strong className="text-amber-700">当前配置：允许内网访问</strong>
                <p className="text-sm mt-1 text-amber-600">
                  可以监控内网服务，但如果服务暴露在公网，攻击者可能利用此功能探测您的内网。
                  建议仅在纯内网部署时开启。
                </p>
              </div>
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
              <div>
                <strong className="text-emerald-700">当前配置：禁止内网访问</strong>
                <p className="text-sm mt-1 text-emerald-600">
                  服务监控无法访问内网地址，这是更安全的配置。
                  如果您需要监控内网服务（如路由器），请开启此选项。
                </p>
              </div>
            </>
          )}
        </div>

        {/* 始终禁止的地址 */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
          <h5 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
            <Shield className="w-4 h-4" />
            以下地址始终禁止访问（无法通过配置更改）
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              'localhost',
              '127.0.0.1',
              '169.254.169.254',
              'metadata.google.internal',
              '0.0.0.0',
              '::1'
            ].map(ip => (
              <span 
                key={ip}
                className="px-3 py-1.5 rounded text-xs font-mono text-center"
                style={{ 
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-glass-border)'
                }}
              >
                {ip}
              </span>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
            这些地址涉及本地回环和云服务商元数据服务，必须始终阻止以防止安全风险。
          </p>
        </div>

        {/* 部署建议 */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
          <h5 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            部署场景建议
          </h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                <strong>纯内网NAS部署：</strong>建议开启，以便监控路由器、其他Docker容器等内网服务
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                <strong>公网暴露部署：</strong>必须关闭，防止攻击者利用SSRF探测您的内网
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                <strong>反向代理部署：</strong>根据代理位置决定，通常保持关闭更安全
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <motion.button
          onClick={handleSave}
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-2.5 rounded-xl text-white font-medium flex items-center gap-2 disabled:opacity-50"
          style={{ background: 'var(--color-primary)' }}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存配置
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
