import apiClient from './client';

export interface Page {
  id: number;
  title: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// Pages API methods
export const pagesApi = {
  // Get all pages for the current user
  getAllPages: async (): Promise<Page[]> => {
    const response = await apiClient.get('/pages');
    return response.data;
  },
  
  // Get a specific page by ID
  getPage: async (pageId: number): Promise<Page> => {
    const response = await apiClient.get(`/pages/${pageId}`);
    return response.data;
  },
  
  // Create a new page
  createPage: async (title: string, content: string = ''): Promise<Page> => {
    const response = await apiClient.post('/pages', {
      title,
      content
    });
    return response.data;
  },
  
  // Update a page
  updatePage: async (pageId: number, data: { title?: string, content?: string }): Promise<Page> => {
    const response = await apiClient.put(`/pages/${pageId}`, data);
    return response.data;
  },
  
  // Delete a page
  deletePage: async (pageId: number): Promise<void> => {
    await apiClient.delete(`/pages/${pageId}`);
  }
}; 