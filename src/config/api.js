/**
 * API Configuration
 *
 * Centralizes API base URL configuration for different environments.
 */

// Get API base URL from environment variable or use default
// Default port is 5000 (docker-compose maps host:5000 -> container:5000)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export { API_BASE_URL }
