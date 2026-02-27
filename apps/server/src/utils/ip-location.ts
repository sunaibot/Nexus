// IP 地理位置查询工具
// 使用简单的 IP 段映射来识别常见 IP 地址

interface IPLocation {
  country: string
  region: string
  city: string
  isp: string
}

// 私有 IP 地址段
const PRIVATE_IP_RANGES = [
  { start: [10, 0, 0, 0], end: [10, 255, 255, 255] },
  { start: [172, 16, 0, 0], end: [172, 31, 255, 255] },
  { start: [192, 168, 0, 0], end: [192, 168, 255, 255] },
  { start: [127, 0, 0, 0], end: [127, 255, 255, 255] },
]

// 检查是否是私有 IP
function isPrivateIP(ip: string): boolean {
  if (!ip) return false
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4) return false

  return PRIVATE_IP_RANGES.some(range => {
    const start = range.start
    const end = range.end
    for (let i = 0; i < 4; i++) {
      if (parts[i] < start[i] || parts[i] > end[i]) return false
    }
    return true
  })
}

// 获取 IP 地理位置
export function getIPLocation(ip: string): IPLocation {
  // 处理空值
  if (!ip) {
    return {
      country: '未知',
      region: '未知',
      city: '未知',
      isp: 'Unknown'
    }
  }
  // 本地/私有 IP
  if (isPrivateIP(ip) || ip === '::1' || ip === 'localhost') {
    return {
      country: '本地',
      region: '本地网络',
      city: '本机',
      isp: 'Local Network'
    }
  }

  // 根据 IP 段简单判断（实际项目中可以使用第三方 IP 库）
  const parts = ip.split('.').map(Number)
  
  // 中国大陆常见 IP 段（简化示例）
  if (parts[0] === 223 && parts[1] >= 0 && parts[1] <= 255) {
    return { country: '中国', region: '北京', city: '北京', isp: '阿里云' }
  }
  if (parts[0] === 183 && parts[1] >= 128 && parts[1] <= 191) {
    return { country: '中国', region: '广东', city: '深圳', isp: '腾讯云' }
  }
  if (parts[0] === 117 && parts[1] >= 0 && parts[1] <= 63) {
    return { country: '中国', region: '浙江', city: '杭州', isp: '阿里巴巴' }
  }
  if (parts[0] === 220 && parts[1] >= 160 && parts[1] <= 191) {
    return { country: '中国', region: '上海', city: '上海', isp: '中国电信' }
  }
  if (parts[0] === 61 && parts[1] >= 128 && parts[1] <= 191) {
    return { country: '中国', region: '北京', city: '北京', isp: '中国联通' }
  }

  // 美国常见 IP 段
  if (parts[0] === 8 || parts[0] === 9 || parts[0] === 11) {
    return { country: '美国', region: '加利福尼亚', city: '圣克拉拉', isp: 'AT&T' }
  }
  if (parts[0] === 35 || parts[0] === 52 || parts[0] === 54) {
    return { country: '美国', region: '俄勒冈', city: '波特兰', isp: 'AWS' }
  }
  if (parts[0] === 104 || parts[0] === 172) {
    return { country: '美国', region: '加利福尼亚', city: '山景城', isp: 'Google Cloud' }
  }

  // 欧洲
  if (parts[0] === 185 || parts[0] === 188) {
    return { country: '德国', region: '黑森州', city: '法兰克福', isp: 'Hetzner' }
  }
  if (parts[0] === 51) {
    return { country: '英国', region: '英格兰', city: '伦敦', isp: 'UK ISP' }
  }

  // 日本
  if (parts[0] === 133 || parts[0] === 153) {
    return { country: '日本', region: '东京', city: '东京', isp: 'NTT' }
  }

  // 韩国
  if (parts[0] === 14 || parts[0] === 27) {
    return { country: '韩国', region: '首尔', city: '首尔', isp: 'Korea Telecom' }
  }

  // 新加坡
  if (parts[0] === 52 && parts[1] === 220) {
    return { country: '新加坡', region: '新加坡', city: '新加坡', isp: 'AWS Singapore' }
  }

  // 默认
  return {
    country: '未知',
    region: '未知',
    city: '未知',
    isp: 'Unknown ISP'
  }
}

// 获取 IP 位置的简短描述
export function getIPLocationShort(ip: string): string {
  const location = getIPLocation(ip)
  if (location.country === '本地') {
    return '本机/局域网'
  }
  return `${location.country} ${location.city}`
}

// 获取 IP 位置的完整描述
export function getIPLocationFull(ip: string): string {
  const location = getIPLocation(ip)
  if (location.country === '本地') {
    return '本机/局域网'
  }
  return `${location.country} ${location.region} ${location.city} (${location.isp})`
}
