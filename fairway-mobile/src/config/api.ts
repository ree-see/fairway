// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  ENDPOINTS: {
    // Authentication
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    PROFILE: '/api/v1/auth/profile',
    
    // Courses
    COURSES: '/api/v1/courses',
    COURSES_NEARBY: '/api/v1/courses/nearby',
    COURSES_SEARCH: '/api/v1/courses/search',
    
    // Rounds
    ROUNDS: '/api/v1/rounds',
    ROUNDS_STATISTICS: '/api/v1/rounds/statistics',
  },
  TIMEOUT: 10000,
};

export default API_CONFIG;