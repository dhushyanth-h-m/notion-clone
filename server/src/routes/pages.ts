import express, { Request, Response, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Page, Block } from '../models';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Middleware to check if user owns the page
const checkPageOwnership = (async (req: Request, res: Response, next: Function) => {
  try {
    const pageId = req.params.id;
    const userId = req.user.userId;
    
    const page = await Page.findByPk(pageId);
    
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    
    if (page.user_id !== userId) {
      return res.status(403).json({ message: 'You do not have permission to access this page' });
    }
    
    next();
  } catch (error) {
    console.error('Page ownership check error:', error);
    res.status(500).json({ message: 'Server error checking page ownership' });
  }
}) as RequestHandler;

// Get all pages for the current user
router.get('/', 
  authenticateToken as RequestHandler,
  (async (req: Request, res: Response) => {
    try {
      const pages = await Page.findAll({
        where: { user_id: req.user.userId },
        order: [['updated_at', 'DESC']]
      });
      
      res.json(pages);
    } catch (error) {
      console.error('Get pages error:', error);
      res.status(500).json({ message: 'Server error fetching pages' });
    }
  }) as RequestHandler
);

// Get a specific page with its blocks
router.get('/:id', 
  authenticateToken as RequestHandler,
  checkPageOwnership,
  (async (req: Request, res: Response) => {
    try {
      const page = await Page.findByPk(req.params.id, {
        include: [{
          model: Block,
          as: 'blocks',
          order: [['position', 'ASC']]
        }]
      });
      
      res.json(page);
    } catch (error) {
      console.error('Get page error:', error);
      res.status(500).json({ message: 'Server error fetching page' });
    }
  }) as RequestHandler
);

// Create a new page
router.post('/', 
  authenticateToken as RequestHandler,
  (async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      
      const page = await Page.create({
        id: uuidv4(),
        user_id: req.user.userId,
        title: title || 'Untitled'
      });
      
      res.status(201).json(page);
    } catch (error) {
      console.error('Create page error:', error);
      res.status(500).json({ message: 'Server error creating page' });
    }
  }) as RequestHandler
);

// Update a page
router.put('/:id', 
  authenticateToken as RequestHandler,
  checkPageOwnership,
  (async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      
      const page = await Page.findByPk(req.params.id);
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      page.title = title;
      await page.save();
      
      res.json(page);
    } catch (error) {
      console.error('Update page error:', error);
      res.status(500).json({ message: 'Server error updating page' });
    }
  }) as RequestHandler
);

// Delete a page
router.delete('/:id', 
  authenticateToken as RequestHandler,
  checkPageOwnership,
  (async (req: Request, res: Response) => {
    try {
      const page = await Page.findByPk(req.params.id);
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      // Delete all associated blocks
      await Block.destroy({
        where: { page_id: req.params.id }
      });
      
      // Delete the page
      await page.destroy();
      
      res.json({ message: 'Page deleted successfully' });
    } catch (error) {
      console.error('Delete page error:', error);
      res.status(500).json({ message: 'Server error deleting page' });
    }
  }) as RequestHandler
);

export default router; 