import express, { Request, Response, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Block, Page } from '../models';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Middleware to check if user owns the block (through page ownership)
const checkBlockOwnership = (async (req: Request, res: Response, next: Function) => {
  try {
    const blockId = req.params.id;
    const userId = req.user.userId;
    
    const block = await Block.findByPk(blockId, {
      include: [{
        model: Page,
        as: 'page'
      }]
    });
    
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }
    
    if (!block.page || block.page.user_id !== userId) {
      return res.status(403).json({ message: 'You do not have permission to access this block' });
    }
    
    next();
  } catch (error) {
    console.error('Block ownership check error:', error);
    res.status(500).json({ message: 'Server error checking block ownership' });
  }
}) as RequestHandler;

// Get blocks for a page
router.get('/page/:pageId', 
  authenticateToken as RequestHandler,
  (async (req: Request, res: Response) => {
    try {
      const pageId = req.params.pageId;
      
      // Check if user owns the page
      const page = await Page.findByPk(pageId);
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      if (page.user_id !== req.user.userId) {
        return res.status(403).json({ message: 'You do not have permission to access this page' });
      }
      
      // Get blocks
      const blocks = await Block.findAll({
        where: { page_id: pageId },
        order: [['position', 'ASC']],
        include: [{
          model: Block,
          as: 'children',
          required: false
        }]
      });
      
      res.json(blocks);
    } catch (error) {
      console.error('Get blocks error:', error);
      res.status(500).json({ message: 'Server error fetching blocks' });
    }
  }) as RequestHandler
);

// Get a specific block
router.get('/:id', 
  authenticateToken as RequestHandler,
  checkBlockOwnership,
  (async (req: Request, res: Response) => {
    try {
      const block = await Block.findByPk(req.params.id, {
        include: [{
          model: Block,
          as: 'children',
          required: false
        }]
      });
      
      res.json(block);
    } catch (error) {
      console.error('Get block error:', error);
      res.status(500).json({ message: 'Server error fetching block' });
    }
  }) as RequestHandler
);

// Create a new block
router.post('/', 
  authenticateToken as RequestHandler,
  (async (req: Request, res: Response) => {
    try {
      const { pageId, parentId, type, content, position } = req.body;
      
      // Check if user owns the page
      const page = await Page.findByPk(pageId);
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      if (page.user_id !== req.user.userId) {
        return res.status(403).json({ message: 'You do not have permission to access this page' });
      }
      
      // If parentId is provided, check if it exists and belongs to the same page
      if (parentId) {
        const parentBlock = await Block.findByPk(parentId);
        if (!parentBlock) {
          return res.status(404).json({ message: 'Parent block not found' });
        }
        
        if (parentBlock.page_id !== pageId) {
          return res.status(400).json({ message: 'Parent block must belong to the same page' });
        }
      }
      
      // Get last position if not provided
      let blockPosition = position;
      if (blockPosition === undefined) {
        const lastBlock = await Block.findOne({
          where: { page_id: pageId, parent_id: parentId || null },
          order: [['position', 'DESC']]
        });
        
        blockPosition = lastBlock ? lastBlock.position + 1 : 0;
      }
      
      // Create block
      const block = await Block.create({
        id: uuidv4(),
        page_id: pageId,
        parent_id: parentId || null,
        type: type || 'text',
        content: content || '',
        position: blockPosition
      });
      
      res.status(201).json(block);
    } catch (error) {
      console.error('Create block error:', error);
      res.status(500).json({ message: 'Server error creating block' });
    }
  }) as RequestHandler
);

// Update a block
router.put('/:id', 
  authenticateToken as RequestHandler,
  checkBlockOwnership,
  (async (req: Request, res: Response) => {
    try {
      const { content, type, position } = req.body;
      
      const block = await Block.findByPk(req.params.id);
      if (!block) {
        return res.status(404).json({ message: 'Block not found' });
      }
      
      // Update fields if provided
      if (content !== undefined) block.content = content;
      if (type !== undefined) block.type = type;
      if (position !== undefined) block.position = position;
      
      await block.save();
      
      res.json(block);
    } catch (error) {
      console.error('Update block error:', error);
      res.status(500).json({ message: 'Server error updating block' });
    }
  }) as RequestHandler
);

// Delete a block
router.delete('/:id', 
  authenticateToken as RequestHandler,
  checkBlockOwnership,
  (async (req: Request, res: Response) => {
    try {
      const block = await Block.findByPk(req.params.id);
      if (!block) {
        return res.status(404).json({ message: 'Block not found' });
      }
      
      // Recursively delete all children blocks
      async function deleteChildBlocks(parentId: string) {
        const children = await Block.findAll({ where: { parent_id: parentId } });
        
        for (const child of children) {
          await deleteChildBlocks(child.id);
          await child.destroy();
        }
      }
      
      await deleteChildBlocks(block.id);
      
      // Delete the block
      await block.destroy();
      
      res.json({ message: 'Block deleted successfully' });
    } catch (error) {
      console.error('Delete block error:', error);
      res.status(500).json({ message: 'Server error deleting block' });
    }
  }) as RequestHandler
);

export default router; 