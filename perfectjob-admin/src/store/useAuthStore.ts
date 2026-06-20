import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../services/api/authApi'

export interface JwtPayload {
  exp: number
  sub: string
  role: string
}

export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(padded)
    const parsed = JSON.parse(decoded) as Partial<JwtPayload>
    if (typeof parsed.exp !== 'number' || typeof parsed.sub !== 'string' || typeof parsed.role !== 'string') {
      return null
    }
    return parsed as JwtPayload
  } catch {
    return null
  }
}

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwt(token)
  if (!payload) return true
  return payload.exp * 1000 < Date.now()
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  setAuth: (token: string, user: User) => void
  logout: () => void
  loadToken: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        if (isTokenExpired(token)) {
          set({ token: null, user: null, isAuthenticated: false })
          return
        }
        set({ token, user, isAuthenticated: true })
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      },
      loadToken: () => {
        const state = get()
        if (state.token && !isTokenExpired(state.token)) {
          set({ isAuthenticated: true })
        } else {
          set({ token: null, user: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)

export function migrateLegacyToken(): void {
  const legacyToken = localStorage.getItem('token')
  if (!legacyToken) return
  const state = useAuthStore.getState()
  if (!state.token) {
    try {
      const payload = decodeJwt(legacyToken)
      if (payload && payload.exp * 1000 > Date.now()) {
        state.setAuth(legacyToken, {
          email: payload.sub,
          fullName: '',
          role: payload.role,
        })
      }
    } catch {
    }
  }
  localStorage.removeItem('token')
}
