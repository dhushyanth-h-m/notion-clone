import express, { Request, Response, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Pool } from 'pg';
import Page from '../models/Page';

// Database connection
const connectionString = `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'notion_clone'}`;
const pool = new Pool({ connectionString });

// Create router instance
const router = express.Router();

// Get all pages for the current user
router.get(
  '/',
  authenticateToken as RequestHandler,
  (async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId;
      const pages = await Page.findByUserId(userId);
      
      res.json(pages);
    } catch (error) {
      console.error('Error fetching pages:', error);
      res.status(500).json({ message: 'Server error fetching pages' });
    }
  }) as RequestHandler
);

// Get a specific page by ID
router.get(
  '/:id',
  authenticateToken as RequestHandler,
  (async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(req.params.id);
      const userId = req.user.userId;
      
      const page = await Page.findByIdAndUserId(pageId, userId);
      
      if (!page) {
        return res.status(404).json({ message: 'Page not found or access denied' });
      }
      
      res.json(page);
    } catch (error) {
      console.error('Error fetching page:', error);
      res.status(500).json({ message: 'Server error fetching page' });
    }
  }) as RequestHandler
);

// Create a new page
router.post(
  '/',
  authenticateToken as RequestHandler,
  (async (req: Request, res: Response) => {
    try {
      const { title, content } = req.body;
      const userId = req.user.userId;
      
      if (!title) {
        return res.status(400).json({ message: 'Title is required' });
      }
      
      const newPage = await Page.createPage({
        title,
        content: content || '',
        user_id: userId
      });
      
      res.status(201).json(newPage);
    } catch (error) {
      console.error('Error creating page:', error);
      res.status(500).json({ message: 'Server error creating page' });
    }
  }) as RequestHandler
);

// Update a page
router.put(
  '/:id',
  authenticateToken as RequestHandler,
  (async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(req.params.id);
      const userId = req.user.userId;
      const { title, content } = req.body;
      
      const updatedPage = await Page.updatePage(pageId, userId, { 
        title, 
        content 
      });
      
      if (!updatedPage) {
        return res.status(404).json({ message: 'Page not found or access denied' });
      }
      
      res.json(updatedPage);
    } catch (error) {
      console.error('Error updating page:', error);
      res.status(500).json({ message: 'Server error updating page' });
    }
  }) as RequestHandler
);

// Delete a page
router.delete(
  '/:id',
  authenticateToken as RequestHandler,
  (async (req: Request, res: Response) => {
    try {
      const pageId = parseInt(req.params.id);
      const userId = req.user.userId;
      
      const success = await Page.deletePage(pageId, userId);
      
      if (!success) {
        return res.status(404).json({ message: 'Page not found or access denied' });
      }
      
      res.json({ message: 'Page deleted successfully' });
    } catch (error) {
      console.error('Error deleting page:', error);
      res.status(500).json({ message: 'Server error deleting page' });
    }
  }) as RequestHandler
);

export default router; 