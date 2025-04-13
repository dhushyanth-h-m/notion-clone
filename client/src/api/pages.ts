import apiClient from './client';
import { Page } from '../types/page';

// Page API methods
export const pagesApi = {
  // Get all pages for the current user
  getAllPages: async (): Promise<Page[]> => {
    const response = await apiClient.get('/pages');
    
    // Transform from snake_case to camelCase for client-side use
    return response.data.map((page: any) => ({
      id: page.id,
      userId: page.user_id,
      title: page.title,
      blockIds: [], // This will be populated when fetching individual pages with blocks
      createdAt: new Date(page.created_at),
      updatedAt: new Date(page.updated_at)
    }));
  },
  
  // Get a specific page with its blocks
  getPage: async (id: string): Promise<Page> => {
    const response = await apiClient.get(`/pages/${id}`);
    const page = response.data;
    
    // Transform from snake_case to camelCase for client-side use
    return {
      id: page.id,
      userId: page.user_id,
      title: page.title,
      blockIds: page.blocks ? page.blocks.map((block: any) => block.id) : [],
      createdAt: new Date(page.created_at),
      updatedAt: new Date(page.updated_at)
    };
  },
  
  // Create a new page
  createPage: async (title: string): Promise<Page> => {
    const response = await apiClient.post('/pages', { title });
    const page = response.data;
    
    // Transform from snake_case to camelCase for client-side use
    return {
      id: page.id,
      userId: page.user_id,
      title: page.title,
      blockIds: [],
      createdAt: new Date(page.created_at),
      updatedAt: new Date(page.updated_at)
    };
  },
  
  // Update a page
  updatePage: async (id: string, title: string): Promise<Page> => {
    const response = await apiClient.put(`/pages/${id}`, { title });
    const page = response.data;
    
    // Transform from snake_case to camelCase for client-side use
    return {
      id: page.id,
      userId: page.user_id,
      title: page.title,
      blockIds: page.blocks ? page.blocks.map((block: any) => block.id) : [],
      createdAt: new Date(page.created_at),
      updatedAt: new Date(page.updated_at)
    };
  },
  
  // Delete a page
  deletePage: async (id: string): Promise<void> => {
    await apiClient.delete(`/pages/${id}`);
  }
}; 