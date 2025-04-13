import express from 'express';
import { Workspace, WorkspaceMember, Block, User } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth';
import sequelize from '../config/database';

const router = express.Router();

/**
 * @route   POST /api/workspaces
 * @desc    Create a new workspace
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  const { name, icon } = req.body;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ 
      success: false,
      message: 'Workspace name is required'
    });
  }
  
  // Start a transaction
  const transaction = await sequelize.transaction();
  
  try {
    // Create the workspace
    const workspace = await Workspace.create({
      id: uuidv4(),
      name,
      icon: icon || null,
      owner_id: req.user.id
    }, { transaction });
    
    // Add the creator as an owner
    await WorkspaceMember.create({
      workspace_id: workspace.id,
      user_id: req.user.id,
      role: 'owner'
    }, { transaction });
    
    // Create a root page block for the workspace
    const rootBlock = await Block.create({
      id: uuidv4(),
      type: 'page',
      content: { title: `${name} Home` },
      workspace_id: workspace.id,
      created_by: req.user.id,
      permissions: { public: false }
    }, { transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    // Fetch the workspace with its members
    const result = await Workspace.findByPk(workspace.id, {
      include: [
        { 
          model: WorkspaceMember, 
          as: 'members',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }]
        },
        { 
          model: Block,
          as: 'blocks',
          where: { parent_id: null, type: 'page' },
          limit: 10
        }
      ]
    });
    
    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error('Error creating workspace:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating workspace',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/workspaces
 * @desc    Get all workspaces for the current user
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    // Find all workspaces where the user is a member
    const memberships = await WorkspaceMember.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Workspace, as: 'workspace' }]
    });
    
    const workspaces = memberships.map(membership => membership.workspace);
    
    return res.status(200).json({
      success: true,
      data: workspaces
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching workspaces',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/workspaces/:id
 * @desc    Get a workspace by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Check if user is a member of the workspace
    const membership = await WorkspaceMember.findOne({
      where: { 
        workspace_id: req.params.id,
        user_id: req.user.id
      }
    });
    
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this workspace'
      });
    }
    
    // Get the workspace with its members and root blocks
    const workspace = await Workspace.findByPk(req.params.id, {
      include: [
        { 
          model: WorkspaceMember, 
          as: 'members',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }]
        },
        { 
          model: Block,
          as: 'blocks',
          where: { parent_id: null, type: 'page' },
          required: false
        }
      ]
    });
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: workspace
    });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching workspace',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/workspaces/:id
 * @desc    Update a workspace
 * @access  Private
 */
router.put('/:id', authenticate, async (req, res) => {
  const { name, icon } = req.body;
  const workspaceId = req.params.id;
  
  try {
    // Check if user is an admin or owner of the workspace
    const membership = await WorkspaceMember.findOne({
      where: { 
        workspace_id: workspaceId,
        user_id: req.user.id,
        role: ['owner', 'admin']
      }
    });
    
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this workspace'
      });
    }
    
    // Get the workspace
    const workspace = await Workspace.findByPk(workspaceId);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    // Update the workspace
    const updateData: any = {};
    if (name) updateData.name = name;
    if (icon !== undefined) updateData.icon = icon;
    
    await workspace.update(updateData);
    
    return res.status(200).json({
      success: true,
      data: workspace
    });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating workspace',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/workspaces/:id/members
 * @desc    Add a member to a workspace
 * @access  Private
 */
router.post('/:id/members', authenticate, async (req, res) => {
  const { email, role = 'viewer' } = req.body;
  const workspaceId = req.params.id;
  
  // Validate required fields
  if (!email) {
    return res.status(400).json({ 
      success: false,
      message: 'Email is required'
    });
  }
  
  try {
    // Check if user is an admin or owner of the workspace
    const membership = await WorkspaceMember.findOne({
      where: { 
        workspace_id: workspaceId,
        user_id: req.user.id,
        role: ['owner', 'admin']
      }
    });
    
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add members to this workspace'
      });
    }
    
    // Find the user to add
    const userToAdd = await User.findOne({ where: { email } });
    
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if the user is already a member
    const existingMember = await WorkspaceMember.findOne({
      where: { 
        workspace_id: workspaceId,
        user_id: userToAdd.id
      }
    });
    
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this workspace'
      });
    }
    
    // Add the user as a member
    await WorkspaceMember.create({
      workspace_id: workspaceId,
      user_id: userToAdd.id,
      role
    });
    
    return res.status(201).json({
      success: true,
      message: 'Member added successfully'
    });
  } catch (error) {
    console.error('Error adding member:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding member',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/workspaces/:id/members/:userId
 * @desc    Remove a member from a workspace
 * @access  Private
 */
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  const workspaceId = req.params.id;
  const userIdToRemove = req.params.userId;
  
  try {
    // Check if user is an admin or owner of the workspace
    const membership = await WorkspaceMember.findOne({
      where: { 
        workspace_id: workspaceId,
        user_id: req.user.id,
        role: ['owner', 'admin']
      }
    });
    
    // Special case: owners can't be removed except by themselves
    if (userIdToRemove === req.user.id) {
      // User is removing themselves
      const memberToRemove = await WorkspaceMember.findOne({
        where: { 
          workspace_id: workspaceId,
          user_id: userIdToRemove
        }
      });
      
      if (memberToRemove && memberToRemove.role === 'owner') {
        // Count owners
        const ownerCount = await WorkspaceMember.count({
          where: { 
            workspace_id: workspaceId,
            role: 'owner'
          }
        });
        
        if (ownerCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot remove the last owner from a workspace'
          });
        }
      }
      
      await memberToRemove?.destroy();
      
      return res.status(200).json({
        success: true,
        message: 'You have left the workspace'
      });
    }
    
    // Otherwise, normal permission check
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove members from this workspace'
      });
    }
    
    // Find the member to remove
    const memberToRemove = await WorkspaceMember.findOne({
      where: { 
        workspace_id: workspaceId,
        user_id: userIdToRemove
      }
    });
    
    if (!memberToRemove) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // Admin can't remove owner
    if (membership.role === 'admin' && memberToRemove.role === 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot remove owners from a workspace'
      });
    }
    
    // Remove the member
    await memberToRemove.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return res.status(500).json({
      success: false,
      message: 'Error removing member',
      error: error.message
    });
  }
});

export default router; 