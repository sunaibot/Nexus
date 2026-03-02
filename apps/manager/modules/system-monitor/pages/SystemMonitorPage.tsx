import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network, 
  Server,
  Clock,
  RefreshCw
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface SystemStats {
  cpu: {
    usage: number
    temperature: number | null
    count: number
    model: string
  }
  memory: {
    usedPercent: number
    total: string
    used: string
    free: string
  }
  disk: {
    usedPercent: number
    total: string
    used: string
    free: string
  }
  network: {
    rx_sec: number
    tx_sec: number
    rx_formatted: string
    tx_formatted: string
  }
  containers: {
    running: number
    total: number
  } | null
  uptime: string
  timestamp: number
}

interface HardwareInfo {
  cpu: {
    brand: string
    manufacturer: string
    speed: number
    cores: number
    physicalCores: number
  }
  system: {
    manufacturer: string
    model: string
    version: string
  }
  os: {
    platform: string
    distro: string
    release: string
    arch: string
    hostname: string
  }
  memory: {
    total: string
  }
}

export default function SystemMonitorPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [hardware, setHardware] = useState<HardwareInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const [pulseRes, hardwareRes] = await Promise.all([
        fetch('/api/v2/system/pulse', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/v2/system/hardware', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const pulseData = await pulseRes.json()
      const hardwareData = await hardwareRes.json()

      if (pulseData.success) {
        setStats(pulseData.data)
      }
      if (hardwareData.success) {
        setHardware(hardwareData.data)
      }
      
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError('获取系统数据失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemData()
    const interval = setInterval(fetchSystemData, 5000) // 每5秒刷新
    return () => clearInterval(interval)
  }, [])

  const StatCard = ({ 
    title, 
    icon: Icon, 
    children, 
    color = 'blue' 
  }: { 
    title: string
    icon: any
    children: React.ReactNode
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  }) => {
    const colorClasses = {
      blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
      green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
      purple: 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
      orange: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
      red: 'from-red-500/20 to-rose-500/20 border-red-500/30',
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorClasses[color]} p-6 backdrop-blur-sm`}
        style={{ borderColor: 'var(--color-glass-border)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg bg-${color}-500/20`}>
            <Icon className={`w-5 h-5 text-${color}-400`} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h3>
        </div>
        {children}
      </motion.div>
    )
  }

  const ProgressBar = ({ 
    value, 
    color = 'blue' 
  }: { 
    value: number
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  }) => {
    const colorClasses = {
      blue: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      green: 'bg-gradient-to-r from-green-500 to-emerald-500',
      purple: 'bg-gradient-to-r from-purple-500 to-violet-500',
      orange: 'bg-gradient-to-r from-orange-500 to-amber-500',
      red: 'bg-gradient-to-r from-red-500 to-rose-500',
    }

    return (
      <div className="h-2 rounded-full bg-gray-700/50 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    )
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ background: 'var(--color-glass)' }}>
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchSystemData}
          className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            系统监控
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            实时监控系统资源使用情况
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            最后更新: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchSystemData}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CPU 状态 */}
        <StatCard title="CPU 状态" icon={Cpu} color="blue">
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-blue-400">
                {stats?.cpu.usage || 0}%
              </span>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {hardware?.cpu.cores || '-'} 核心
              </span>
            </div>
            <ProgressBar value={stats?.cpu.usage || 0} color="blue" />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {hardware?.cpu.brand || 'Unknown'}
            </p>
          </div>
        </StatCard>

        {/* 内存状态 */}
        <StatCard title="内存状态" icon={MemoryStick} color="purple">
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-purple-400">
                {stats?.memory.usedPercent || 0}%
              </span>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {stats?.memory.used || '-'} / {stats?.memory.total || '-'}
              </span>
            </div>
            <ProgressBar value={stats?.memory.usedPercent || 0} color="purple" />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              可用: {stats?.memory.free || '-'}
            </p>
          </div>
        </StatCard>

        {/* 系统运行时间 */}
        <StatCard title="运行时间" icon={Clock} color="green">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-green-400">
                {stats?.uptime || '-'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <Server className="w-4 h-4" />
              <span>{hardware?.os.hostname || 'Unknown'}</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {hardware?.os.platform} {hardware?.os.release}
            </p>
          </div>
        </StatCard>

        {/* 网络状态 */}
        <StatCard title="网络状态" icon={Network} color="orange">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>下载</p>
                <p className="text-lg font-semibold text-green-400">
                  {stats?.network.rx_formatted || '0 B/s'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>上传</p>
                <p className="text-lg font-semibold text-blue-400">
                  {stats?.network.tx_formatted || '0 B/s'}
                </p>
              </div>
            </div>
          </div>
        </StatCard>

        {/* Docker 容器 */}
        {stats?.containers && (
          <StatCard title="Docker 容器" icon={Server} color="blue">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {stats.containers.running}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>运行中</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {stats.containers.total}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>总计</p>
                </div>
              </div>
            </div>
          </StatCard>
        )}

        {/* 系统信息 */}
        <StatCard title="系统信息" icon={Activity} color="purple">
          <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <p>平台: {hardware?.os.platform || '-'}</p>
            <p>架构: {hardware?.os.arch || '-'}</p>
            <p>发行版: {hardware?.os.distro || '-'}</p>
            <p>版本: {hardware?.os.release || '-'}</p>
          </div>
        </StatCard>
      </div>
    </div>
  )
}
