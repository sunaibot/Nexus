import { z } from 'zod'

const envSchema = z.object({
  PORT: z.string().default('8787').transform(val => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().optional(),
  FILTER_SENSITIVE_INFO: z.enum(['true', 'false']).default('true').transform(val => val === 'true'),
  ENABLE_SYSTEM_AUDIT: z.enum(['true', 'false']).default('true').transform(val => val === 'true'),
  ALLOW_DOCKER_INFO: z.enum(['true', 'false']).default('true').transform(val => val === 'true'),
  ENABLE_RATE_LIMIT: z.enum(['true', 'false']).default('true').transform(val => val === 'true'),
  MAX_SYSTEM_MONITOR_REQUESTS: z.string().default('20').transform(val => parseInt(val, 10)),
  MAX_STATIC_INFO_REQUESTS: z.string().default('10').transform(val => parseInt(val, 10)),
  ENABLE_IP_FILTER: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),
  PROC_PATH: z.string().optional(),
  SYS_PATH: z.string().optional(),
  SI_FILESYSTEM_DISK_PREFIX: z.string().optional(),
})

type Env = z.infer<typeof envSchema>

let validatedEnv: Env | null = null

export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv
  }

  try {
    validatedEnv = envSchema.parse(process.env)
    console.log('[EnvValidator] Environment variables validated successfully')
    return validatedEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[EnvValidator] Invalid environment variables:', (error as any).issues)
      throw new Error(`Invalid environment variables: ${(error as any).issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')}`)
    }
    throw error
  }
}

export function getEnv(): Env {
  return validatedEnv || validateEnv()
}

export function getSystemSecurityConfig() {
  const env = getEnv()
  return {
    filterSensitiveInfo: env.FILTER_SENSITIVE_INFO,
    enableAuditLog: env.ENABLE_SYSTEM_AUDIT,
    allowDockerInfo: env.ALLOW_DOCKER_INFO,
    enableRateLimit: env.ENABLE_RATE_LIMIT,
    maxSystemMonitorRequests: env.MAX_SYSTEM_MONITOR_REQUESTS,
    maxStaticInfoRequests: env.MAX_STATIC_INFO_REQUESTS,
    enableIpFilter: env.ENABLE_IP_FILTER,
  }
}
