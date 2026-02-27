import { useEffect } from 'react';
import { SiteSettings } from '../lib/api';
import { useSettingsStore } from '../stores/settingsStore';

// 默认站点设置
export const defaultSiteSettings: SiteSettings = {
  siteTitle: "NOWEN",
  siteFavicon: "",
  enableBeamAnimation: true,
  enableLiteMode: false,
  enableWeather: true,
  enableLunar: true,
  widgetVisibility: {
    systemMonitor: false,
    hardwareIdentity: false,
    vitalSigns: false,
    networkTelemetry: false,
    processMatrix: false,
    dockMiniMonitor: false,
    mobileTicker: false,
  },
  menuVisibility: {
    languageToggle: true,
    themeToggle: true,
  },
  wallpaper: {
    enabled: false,
    source: 'upload',
    imageData: '',
    imageUrl: '',
    blur: 0,
    overlay: 30,
  },
};

// 默认小部件可见性（加载前隐藏避免闪烁）
const hiddenWidgetVisibility = {
  systemMonitor: false,
  hardwareIdentity: false,
  vitalSigns: false,
  networkTelemetry: false,
  processMatrix: false,
  dockMiniMonitor: false,
  mobileTicker: false,
};

export function useSiteSettings() {
  const { siteSettings, isLoaded, fetchSettings, updateSettings } = useSettingsStore();

  // 初始加载 - 强制刷新以获取最新设置
  useEffect(() => {
    fetchSettings(true);
  }, []);

  // 快捷访问属性 - 确保类型为 boolean
  const isLiteMode = siteSettings.enableLiteMode ?? false;
  const showWeather = siteSettings.enableWeather ?? true;
  const showLunar = siteSettings.enableLunar ?? true;

  // 菜单可见性
  const menuVisibility = siteSettings.menuVisibility || {
    languageToggle: true,
    themeToggle: true,
  };

  // 小部件可见性 - 设置未加载完成时默认隐藏所有小部件避免闪烁
  const widgetVisibility = isLoaded
    ? siteSettings.widgetVisibility || defaultSiteSettings.widgetVisibility!
    : hiddenWidgetVisibility;

  return {
    siteSettings,
    setSiteSettings: updateSettings,
    settingsLoaded: isLoaded,
    isLiteMode,
    showWeather,
    showLunar,
    menuVisibility,
    widgetVisibility,
  };
}
