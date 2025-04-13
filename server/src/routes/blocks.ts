import express from 'express';
import { Block, Property, BlockHistory, SearchIndex } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth';
import sequelize from '../config/database';

const router = express.Router();

/**
 * @route   POST /api/blocks
 * @desc    Create a new block
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  const { type, content, parent_id, workspace_id, properties = [] } = req.body;
  
  // Validate required fields
  if (!type || !workspace_id) {
    return res.status(400).json({ 
      success: false,
      message: 'Type and workspace_id are required'
    });
  }
  
  // Start a transaction
  const transaction = await sequelize.transaction();
  
  try {
    // Create the block
    const block = await Block.create({
      id: uuidv4(), // Generate new UUID
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
        return Property.create({
          block_id: block.id,
          name: prop.name,
          type: prop.type,
          config: prop.config || {},
          value: prop.value || null,
          position: index
        }, { transaction });
      });
      
      await Promise.all(propertyPromises);
    }
    
    // Record history
    await BlockHistory.create({
      block_id: block.id,
      content: block.content,
      version: 1,
      modified_by: req.user.id
    }, { transaction });

    // Index for search
    await SearchIndex.create({
      block_id: block.id
    }, { transaction });
    
    // If this is a page type block, add default properties
    if (type === 'page') {
      await Property.create({
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
    const result = await Block.findByPk(block.id, {
      include: [
        { model: Property, as: 'properties' },
        { model: Block, as: 'children' }
      ]
    });
    
    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error('Error creating block:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating block',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/blocks/:id
 * @desc    Get a block by ID with children
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const block = await Block.findByPk(req.params.id, {
      include: [
        { model: Property, as: 'properties' },
        { 
          model: Block, 
          as: 'children',
          include: [{ model: Property, as: 'properties' }]
        }
      ]
    });
    
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: block
    });
  } catch (error) {
    console.error('Error fetching block:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching block',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/blocks/:id/tree
 * @desc    Get a block and its entire subtree (recursive)
 * @access  Private
 */
router.get('/:id/tree', authenticate, async (req, res) => {
  try {
    // Using a recursive query to get the entire tree
    const [results] = await sequelize.query(`
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
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }
    
    // Build a hierarchical structure for the tree
    const buildTree = (blocks, parentId = null, depth = 0) => {
      return blocks
        .filter(b => b.parent_id === parentId && b.depth === depth)
        .map(block => ({
          ...block,
          children: buildTree(blocks, block.id, depth + 1)
        }));
    };
    
    const tree = buildTree(results);
    
    return res.status(200).json({
      success: true,
      data: tree[0] // The root of the tree
    });
  } catch (error) {
    console.error('Error fetching block tree:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching block tree',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/blocks/:id
 * @desc    Update a block
 * @access  Private
 */
router.put('/:id', authenticate, async (req, res) => {
  const { content, type, parent_id, permissions } = req.body;
  const blockId = req.params.id;
  
  // Start a transaction
  const transaction = await sequelize.transaction();
  
  try {
    // Get current block
    const block = await Block.findByPk(blockId);
    
    if (!block) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }
    
    // Update block version
    const newVersion = block.version + 1;
    
    // Save current state to history
    await BlockHistory.create({
      block_id: blockId,
      content: block.content,
      version: block.version,
      modified_by: req.user.id
    }, { transaction });
    
    // Update the block
    const updateData: any = { version: newVersion };
    
    if (content) updateData.content = content;
    if (type) updateData.type = type;
    if (parent_id !== undefined) updateData.parent_id = parent_id;
    if (permissions) updateData.permissions = permissions;
    
    await block.update(updateData, { transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    // Fetch the updated block
    const updatedBlock = await Block.findByPk(block.id, {
      include: [
        { model: Property, as: 'properties' }
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: updatedBlock
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error('Error updating block:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating block',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/blocks/:id
 * @desc    Soft delete a block
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  const blockId = req.params.id;
  
  try {
    const block = await Block.findByPk(blockId);
    
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }
    
    // Soft delete by marking is_deleted as true
    await block.update({ is_deleted: true });
    
    return res.status(200).json({
      success: true,
      message: 'Block deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting block:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting block',
      error: error.message
    });
  }
});

export default router;