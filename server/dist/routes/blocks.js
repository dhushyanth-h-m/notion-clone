"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const models_1 = require("../models");
const uuid_1 = require("uuid");
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../config/database"));
const router = express_1.default.Router();
/**
 * @route   POST /api/blocks
 * @desc    Create a new block
 * @access  Private
 */
router.post('/', auth_1.authenticate, (async (req, res) => {
    const { type, content, parent_id, workspace_id, properties = [] } = req.body;
    // Validate required fields
    if (!type || !workspace_id) {
        res.status(400).json({
            success: false,
            message: 'Type and workspace_id are required'
        });
        return;
    }
    // Start a transaction
    const transaction = await database_1.default.transaction();
    try {
        // Create the block
        const block = await models_1.Block.create({
            id: (0, uuid_1.v4)(), // Generate new UUID
            type,
            content: content || {},
            parent_id: parent_id || null,
            workspace_id,
            created_by: req.user.id,
            version: 1,
            is_deleted: false,
            permissions: { public: false }
        }, { transaction });
        // Add properties if provided
        if (properties.length > 0) {
            const propertyPromises = properties.map((prop, index) => {
                return models_1.Property.create({
                    block_id: block.id,
                    name: prop.name,
                    // Ensure prop.type is of type PropertyType
                    type: prop.type,
                    config: prop.config || {},
                    value: prop.value || null,
                    position: index
                }, { transaction });
            });
            await Promise.all(propertyPromises);
        }
        // Record history
        await models_1.BlockHistory.create({
            block_id: block.id,
            content: block.content,
            version: 1,
            modified_by: req.user.id
        }, { transaction });
        // Index for search
        await models_1.SearchIndex.create({
            block_id: block.id
        }, { transaction });
        // If this is a page type block, add default properties
        if (type === 'page') {
            await models_1.Property.create({
                block_id: block.id,
                name: 'title',
                type: 'text',
                config: { format: 'plain_text' },
                value: { text: content.title || 'Untitled' },
                position: 0
            }, { transaction });
        }
        // Commit the transaction
        await transaction.commit();
        // Fetch the block with its properties
        const result = await models_1.Block.findByPk(block.id, {
            include: [
                { model: models_1.Property, as: 'properties' },
                { model: models_1.Block, as: 'children' }
            ]
        });
        res.status(201).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        console.error('Error creating block:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating block',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * @route   GET /api/blocks/:id
 * @desc    Get a block by ID with children
 * @access  Private
 */
const getBlock = async (req, res) => {
    try {
        const block = await models_1.Block.findByPk(req.params.id, {
            include: [
                { model: models_1.Property, as: 'properties' },
                {
                    model: models_1.Block,
                    as: 'children',
                    include: [{ model: models_1.Property, as: 'properties' }]
                }
            ]
        });
        if (!block) {
            res.status(404).json({
                success: false,
                message: 'Block not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: block
        });
    }
    catch (error) {
        console.error('Error fetching block:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching block',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
router.get('/:id', auth_1.authenticate, getBlock);
/**
 * @route   GET /api/blocks/:id/tree
 * @desc    Get a block and its entire subtree (recursive)
 * @access  Private
 */
router.get('/:id/tree', auth_1.authenticate, (async (req, res) => {
    try {
        // Using a recursive query to get the entire tree
        const [results] = await database_1.default.query(`
      WITH RECURSIVE block_tree AS (
        SELECT b.*, 0 as depth 
        FROM blocks b 
        WHERE b.id = :blockId AND b.is_deleted = false
        
        UNION ALL
        
        SELECT b.*, bt.depth + 1
        FROM blocks b
        JOIN block_tree bt ON b.parent_id = bt.id
        WHERE b.is_deleted = false
      )
      SELECT * FROM block_tree ORDER BY depth ASC;
    `, {
            replacements: { blockId: req.params.id }
        });
        // If no results, block doesn't exist
        if (results.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Block not found'
            });
            return;
        }
        // Build a hierarchical structure for the tree
        const buildTree = (blocks, parentId = null, depth = 0) => {
            return blocks
                .filter((b) => b.parent_id === parentId && b.depth === depth)
                .map((block) => ({
                ...block,
                children: buildTree(blocks, block.id, depth + 1)
            }));
        };
        const tree = buildTree(results);
        res.status(200).json({
            success: true,
            data: tree[0] // The root of the tree
        });
    }
    catch (error) {
        console.error('Error fetching block tree:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching block tree',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * @route   PUT /api/blocks/:id
 * @desc    Update a block
 * @access  Private
 */
router.put('/:id', auth_1.authenticate, (async (req, res) => {
    const { content, type, parent_id, permissions } = req.body;
    const blockId = req.params.id;
    // Start a transaction
    const transaction = await database_1.default.transaction();
    try {
        // Get current block
        const block = await models_1.Block.findByPk(blockId);
        if (!block) {
            await transaction.rollback();
            res.status(404).json({
                success: false,
                message: 'Block not found'
            });
            return;
        }
        // Update block version
        const newVersion = block.version + 1;
        // Save current state to history
        await models_1.BlockHistory.create({
            block_id: blockId,
            content: block.content,
            version: block.version,
            modified_by: req.user.id
        }, { transaction });
        // Update the block
        const updateData = { version: newVersion };
        if (content)
            updateData.content = content;
        if (type)
            updateData.type = type;
        if (parent_id !== undefined)
            updateData.parent_id = parent_id;
        if (permissions)
            updateData.permissions = permissions;
        await block.update(updateData, { transaction });
        // Commit the transaction
        await transaction.commit();
        // Fetch the updated block
        const updatedBlock = await models_1.Block.findByPk(block.id, {
            include: [
                { model: models_1.Property, as: 'properties' }
            ]
        });
        res.status(200).json({
            success: true,
            data: updatedBlock
        });
    }
    catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        console.error('Error updating block:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating block',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * @route   DELETE /api/blocks/:id
 * @desc    Soft delete a block
 * @access  Private
 */
router.delete('/:id', auth_1.authenticate, (async (req, res) => {
    const blockId = req.params.id;
    try {
        const block = await models_1.Block.findByPk(blockId);
        if (!block) {
            res.status(404).json({
                success: false,
                message: 'Block not found'
            });
            return;
        }
        // Soft delete by marking is_deleted as true
        await block.update({ is_deleted: true });
        res.status(200).json({
            success: true,
            message: 'Block deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting block:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting block',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
exports.default = router;
