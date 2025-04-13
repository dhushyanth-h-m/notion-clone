import apiClient from './client';
import { Block } from '../types/block';

// Map server block to client block
const mapServerBlockToClientBlock = (block: any): Block => {
  return {
    id: block.id,
    type: block.type,
    content: block.content,
    children: block.children ? block.children.map(mapServerBlockToClientBlock) : []
  };
};

// Block API methods
export const blocksApi = {
  // Get all blocks for a page
  getBlocksByPage: async (pageId: string): Promise<Block[]> => {
    const response = await apiClient.get(`/blocks/page/${pageId}`);
    
    // Transform and organize blocks into a hierarchical structure
    const blocksMap: Record<string, Block> = {};
    const rootBlocks: Block[] = [];
    
    // First pass: create all blocks
    response.data.forEach((block: any) => {
      blocksMap[block.id] = {
        id: block.id,
        type: block.type,
        content: block.content,
        children: []
      };
    });
    
    // Second pass: organize into hierarchy
    response.data.forEach((block: any) => {
      if (block.parent_id) {
        if (blocksMap[block.parent_id]) {
          blocksMap[block.parent_id].children.push(blocksMap[block.id]);
        }
      } else {
        rootBlocks.push(blocksMap[block.id]);
      }
    });
    
    return rootBlocks;
  },
  
  // Get a specific block
  getBlock: async (id: string): Promise<Block> => {
    const response = await apiClient.get(`/blocks/${id}`);
    return mapServerBlockToClientBlock(response.data);
  },
  
  // Create a new block
  createBlock: async (pageId: string, block: Partial<Block>, parentId?: string): Promise<Block> => {
    const response = await apiClient.post('/blocks', {
      pageId,
      parentId,
      type: block.type || 'text',
      content: block.content || ''
    });
    
    return mapServerBlockToClientBlock(response.data);
  },
  
  // Update a block
  updateBlock: async (id: string, content: string, type?: 'text' | 'heading' | 'list'): Promise<Block> => {
    const updateData: any = { content };
    if (type) updateData.type = type;
    
    const response = await apiClient.put(`/blocks/${id}`, updateData);
    return mapServerBlockToClientBlock(response.data);
  },
  
  // Delete a block
  deleteBlock: async (id: string): Promise<void> => {
    await apiClient.delete(`/blocks/${id}`);
  }
}; 