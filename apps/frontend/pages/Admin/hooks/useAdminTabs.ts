import { useState, useCallback } from 'react'

export type AdminTabType = 
  | 'bookmarks' 
  | 'categories' 
  | 'quotes' 
  | 'icons' 
  | 'analytics' 
  | 'health-check' 
  | 'settings'

export function useAdminTabs(defaultTab: AdminTabType = 'bookmarks') {
  const [activeTab, setActiveTab] = useState<AdminTabType>(defaultTab)

  const navigateToTab = useCallback((tab: AdminTabType) => {
    setActiveTab(tab)
  }, [])

  return {
    activeTab,
    navigateToTab,
  }
}
