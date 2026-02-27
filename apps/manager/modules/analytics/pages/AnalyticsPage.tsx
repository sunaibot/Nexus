export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          数据分析
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          查看书签访问统计和趋势分析
        </p>
      </div>
      
      <div className="rounded-xl p-6" style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          数据分析
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          数据分析模块开发中...
        </p>
      </div>
    </div>
  )
}
