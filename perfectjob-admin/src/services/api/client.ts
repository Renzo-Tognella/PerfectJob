import axios from 'axios'
import { ENV } from '@/config/env'
import { useAuthStore } from '@/store/useAuthStore'
import { navigate } from '@/lib/navigationRef'

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      navigate('/login')
    }
    return Promise.reject(error)
  }
)

export default apiClient
