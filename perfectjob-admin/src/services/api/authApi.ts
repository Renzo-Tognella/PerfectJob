import apiClient from './client'

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export const login = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', data)
  return response.data
}

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me')
  return response.data
}
