/**
 * 小部件区域组件
 * 展示系统监控、硬件信息等小部件
 */

import React from 'react'
import { SystemMonitorCard } from '../../../components/features/system-monitor'
import { HardwareIdentityCard } from '../../../components/HardwareIdentityCard'
import { VitalSignsCard } from '../../../components/VitalSignsCard'
import { NetworkTelemetryCard } from '../../../components/NetworkTelemetryCard'

interface WidgetVisibility {
  systemMonitor?: boolean
  hardwareIdentity?: boolean
  vitalSigns?: boolean
  networkTelemetry?: boolean
}

interface WidgetSectionProps {
  isLiteMode: boolean
  widgetVisibility?: WidgetVisibility
}

export function WidgetSection({ isLiteMode, widgetVisibility }: WidgetSectionProps) {
  if (isLiteMode) return null

  const hasVisibleWidgets = 
    widgetVisibility?.systemMonitor ||
    widgetVisibility?.hardwareIdentity ||
    widgetVisibility?.vitalSigns ||
    widgetVisibility?.networkTelemetry

  if (!hasVisibleWidgets) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {widgetVisibility?.systemMonitor && <SystemMonitorCard />}
      {widgetVisibility?.hardwareIdentity && <HardwareIdentityCard />}
      {widgetVisibility?.vitalSigns && <VitalSignsCard />}
      {widgetVisibility?.networkTelemetry && <NetworkTelemetryCard />}
    </div>
  )
}
