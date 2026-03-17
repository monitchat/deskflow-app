/**
 * Axios Instance Configuration
 *
 * Pre-configured axios instance with base URL and interceptors.
 */

import axios from 'axios'
import { API_BASE_URL } from './api'

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - adds auth token to all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token')

    // Add token to headers if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handles errors and unauthorized access
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // If response is 401 (unauthorized), clear token and user data, then redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user_name')
      localStorage.removeItem('user_email')
      localStorage.removeItem('user_avatar')
      localStorage.removeItem('user_company_id')
      window.location.href = '/login'
    }

    // Handle errors globally if needed
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default api
