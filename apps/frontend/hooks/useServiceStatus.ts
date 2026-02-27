import { useState, useEffect, useCallback } from 'react'
import { getApiBase } from '../lib/env'

export interface ServiceStatus {
  backend: boolean
  manager: boolean
  frontend: boolean
}

// 从环境变量或配置中获取服务地址
const getBackendUrl = (): string => {
  // 优先使用环境变量
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL
  }
  // 根据当前页面协议自动判断
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  return `${protocol}//${hostname}:8787`
}

const getManagerUrl = (): string => {
  // 优先使用环境变量
  if (import.meta.env.VITE_MANAGER_URL) {
    return import.meta.env.VITE_MANAGER_URL
  }
  // 根据当前页面协议自动判断
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  return `${protocol}//${hostname}:5174`
}

export function useServiceStatus() {
  const [status, setStatus] = useState<ServiceStatus>({
    backend: false,
    manager: false,
    frontend: true, // 前台服务自己就是，默认可用
  })
  const [isChecking, setIsChecking] = useState(false)

  const checkServices = useCallback(async () => {
    setIsChecking(true)
    
    const backendUrl = getBackendUrl()
    const managerUrl = getManagerUrl()
    
    // 检查后端服务（使用公开接口）
    let backendOnline = false
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      const res = await fetch(`${backendUrl}/api/v2/categories/public`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      backendOnline = res.ok
    } catch {
      backendOnline = false
    }
    
    // 检查管理服务（通过检查是否能访问）
    let managerOnline = false
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      // 尝试访问管理服务的 favicon.svg 或健康检查端点
      const res = await fetch(`${managerUrl}/favicon.svg`, {
        signal: controller.signal,
        method: 'HEAD',
      })
      clearTimeout(timeoutId)
      managerOnline = res.ok || res.status === 404 // 404 也表示服务在线
    } catch {
      managerOnline = false
    }
    
    setStatus({
      backend: backendOnline,
      manager: managerOnline,
      frontend: true,
    })
    setIsChecking(false)
  }, []) // 移除 status 依赖，避免无限循环

  // 初始检查和定时检查
  useEffect(() => {
    checkServices()
    
    // 每 30 秒检查一次
    const interval = setInterval(checkServices, 30000)
    
    return () => clearInterval(interval)
  }, [checkServices])

  return { status, isChecking, checkServices }
}
