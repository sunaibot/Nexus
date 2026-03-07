/**
 * 全局 Provider 组合
 * 集中管理所有全局上下文 Provider
 */

import React from 'react'
import { ThemeProvider } from '../hooks/useTheme'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { ThemeColorProvider } from './ThemeColorProvider'

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ThemeColorProvider>
          {children}
        </ThemeColorProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
