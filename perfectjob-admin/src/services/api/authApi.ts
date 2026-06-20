import apiClient from './client'

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  email: string
  fullName: string
  role: string
}

export interface User {
  email: string
  fullName: string
  role: string
}

export const login = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/v1/auth/login', data)
  return response.data
}

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<AuthResponse>('/v1/auth/me')
  const { email, fullName, role } = response.data
  return { email, fullName, role }
}
