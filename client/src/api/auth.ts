import apiClient from './client';

// Auth API methods
export const authApi = {
  // Register a new user
  register: async (name: string, email: string, password: string) => {
    const response = await apiClient.post('/auth/signup', {
      name,
      email,
      password
    });
    
    return response.data;
  },
  
  // Login a user
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password
    });
    
    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },
  
  // Logout a user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Get current user info
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  
  // Login with Google
  loginWithGoogle: async (token: string) => {
    try {
      const response = await apiClient.post('/auth/google', { token });
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Google login API error:', error);
      throw error;
    }
  },
  
  // Check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  }
}; 