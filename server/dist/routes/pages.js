"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const pg_1 = require("pg");
const Page_1 = __importDefault(require("../models/Page"));
// Database connection
const connectionString = `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'notion_clone'}`;
const pool = new pg_1.Pool({ connectionString });
// Create router instance
const router = express_1.default.Router();
// Get all pages for the current user
router.get('/', auth_1.authenticateToken, (async (req, res) => {
    try {
        const userId = req.user.userId;
        const pages = await Page_1.default.findByUserId(userId);
        res.json(pages);
    }
    catch (error) {
        console.error('Error fetching pages:', error);
        res.status(500).json({ message: 'Server error fetching pages' });
    }
}));
// Get a specific page by ID
router.get('/:id', auth_1.authenticateToken, (async (req, res) => {
    try {
        const pageId = parseInt(req.params.id);
        const userId = req.user.userId;
        const page = await Page_1.default.findByIdAndUserId(pageId, userId);
        if (!page) {
            return res.status(404).json({ message: 'Page not found or access denied' });
        }
        res.json(page);
    }
    catch (error) {
        console.error('Error fetching page:', error);
        res.status(500).json({ message: 'Server error fetching page' });
    }
}));
// Create a new page
router.post('/', auth_1.authenticateToken, (async (req, res) => {
    try {
        const { title, content } = req.body;
        const userId = req.user.userId;
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }
        const newPage = await Page_1.default.createPage({
            title,
            content: content || '',
            user_id: userId
        });
        res.status(201).json(newPage);
    }
    catch (error) {
        console.error('Error creating page:', error);
        res.status(500).json({ message: 'Server error creating page' });
    }
}));
// Update a page
router.put('/:id', auth_1.authenticateToken, (async (req, res) => {
    try {
        const pageId = parseInt(req.params.id);
        const userId = req.user.userId;
        const { title, content } = req.body;
        const updatedPage = await Page_1.default.updatePage(pageId, userId, {
            title,
            content
        });
        if (!updatedPage) {
            return res.status(404).json({ message: 'Page not found or access denied' });
        }
        res.json(updatedPage);
    }
    catch (error) {
        console.error('Error updating page:', error);
        res.status(500).json({ message: 'Server error updating page' });
    }
}));
// Delete a page
router.delete('/:id', auth_1.authenticateToken, (async (req, res) => {
    try {
        const pageId = parseInt(req.params.id);
        const userId = req.user.userId;
        const success = await Page_1.default.deletePage(pageId, userId);
        if (!success) {
            return res.status(404).json({ message: 'Page not found or access denied' });
        }
        res.json({ message: 'Page deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting page:', error);
        res.status(500).json({ message: 'Server error deleting page' });
    }
}));
exports.default = router;
