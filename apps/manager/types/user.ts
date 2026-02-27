export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface LoginResponse {
  success: boolean
  token: string
  user: { id: string; username: string; role: 'admin' | 'user' }
  requirePasswordChange?: boolean
}

export interface VerifyResponse {
  valid: boolean
  user: { id: string; username: string; role: 'admin' | 'user' }
}

export interface AuthStatus {
  isValid: boolean
  username: string | null
  requirePasswordChange?: boolean
}

export interface RegisterParams {
  username: string
  password: string
  email?: string
}

export interface UserLoginResponse {
  success: boolean
  token: string
  user: { id: string; username: string; role: 'admin' | 'user' }
}

export interface UserVerifyResponse {
  valid: boolean
  user: { id: string; username: string; role: 'admin' | 'user' }
}

export interface UserAuthStatus {
  isValid: boolean
  username: string | null
}
