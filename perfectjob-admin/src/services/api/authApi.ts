import apiClient from './client'

export interface LoginInput {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface AuthResponse {
  token: string
  user: User
}

interface BackendAuthResponse {
  accessToken: string
  tokenType: string
  email: string
  fullName: string
  role: string
}

interface BackendUserResponse {
  id: number
  email: string
  fullName: string
  role: string
}

const ADMIN_ROLES = new Set(['ADMIN', 'RECRUITER'])

export const isAdminRole = (role: string) => ADMIN_ROLES.has(role)

const mapUser = (data: BackendUserResponse): User => ({
  id: String(data.id),
  email: data.email,
  name: data.fullName,
  role: data.role,
})

export const login = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await apiClient.post<BackendAuthResponse>('/v1/auth/login', data)
  const { accessToken, email, fullName, role } = response.data

  if (!isAdminRole(role)) {
    throw new Error('Acesso restrito a administradores e recrutadores')
  }

  return {
    token: accessToken,
    user: {
      id: '',
      email,
      name: fullName,
      role,
    },
  }
}

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<BackendUserResponse>('/v1/auth/me')
  return mapUser(response.data)
}
