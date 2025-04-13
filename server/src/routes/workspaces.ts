import express, { Request, Response, RequestHandler } from 'express';
import { Workspace, WorkspaceMember, Block, User } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth';
import sequelize from '../config/database';
import { WorkspaceRole } from '../models/WorkspaceMemberModel';

const router = express.Router();

/**
 * @route   POST /api/workspaces
 * @desc    Create a new workspace
 * @access  Private
 */
router.post('/', authenticate, ((async (req: Request, res: Response) => {
  const { name, icon } = req.body;
  
  // Validate required fields
  if (!name) {
    res.status(400).json({ 
      success: false,
      message: 'Workspace name is required'
    });
    return;
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
      role: 'owner' as WorkspaceRole
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
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error: unknown) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error('Error creating workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating workspace',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler));

/**
 * @route   GET /api/workspaces
 * @desc    Get all workspaces for the current user
 * @access  Private
 */
router.get('/', authenticate, ((async (req: Request, res: Response) => {
  try {
    // Find all workspaces where the user is a member
    const memberships = await WorkspaceMember.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Workspace, as: 'workspace' }]
    });
    
    // Access the relationship through the association property
    const workspaces = memberships.map(membership => membership.get('workspace'));
    
    res.status(200).json({
      success: true,
      data: workspaces
    });
  } catch (error: unknown) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workspaces',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler));

/**
 * @route   GET /api/workspaces/:id
 * @desc    Get a workspace by ID
 * @access  Private
 */
router.get('/:id', authenticate, ((async (req: Request, res: Response) => {
  try {
    // Check if user is a member of the workspace
    const membership = await WorkspaceMember.findOne({
      where: { 
        workspace_id: req.params.id,
        user_id: req.user.id
      }
    });
    
    if (!membership) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this workspace'
      });
      return;
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
      res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: workspace
    });
  } catch (error: unknown) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workspace',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler));

/**
 * @route   PUT /api/workspaces/:id
 * @desc    Update a workspace
 * @access  Private
 */
router.put('/:id', authenticate, ((async (req: Request, res: Response) => {
  const { name, icon } = req.body;
  const workspaceId = req.params.id;
  
  try {
    // Check if user is an admin or owner of the workspace
    const membership = await WorkspaceMember.findOne({
      where: { 
        workspace_id: workspaceId,
        user_id: req.user.id,
        role: ['owner', 'admin'] as unknown as WorkspaceRole
      }
    });
    
    if (!membership) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to update this workspace'
      });
      return;
    }
    
    // Find the workspace
    const workspace = await Workspace.findByPk(workspaceId);
    
    if (!workspace) {
      res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
      return;
    }
    
    // Update workspace fields
    const updateData: any = {};
    if (name) updateData.name = name;
    if (icon !== undefined) updateData.icon = icon;
    
    await workspace.update(updateData);
    
    res.status(200).json({
      success: true,
      data: workspace
    });
  } catch (error: unknown) {
    console.error('Error updating workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating workspace',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler));

/**
 * @route   DELETE /api/workspaces/:id
 * @desc    Delete a workspace
 * @access  Private
 */
router.delete('/:id', authenticate, ((async (req: Request, res: Response) => {
  const workspaceId = req.params.id;
  
  // Start a transaction
  const transaction = await sequelize.transaction();
  
  try {
    // Check if user is the owner of the workspace
    const membership = await WorkspaceMember.findOne({
      where: { 
        workspace_id: workspaceId,
        user_id: req.user.id,
        role: 'owner' as WorkspaceRole
      }
    });
    
    if (!membership) {
      await transaction.rollback();
      res.status(403).json({
        success: false,
        message: 'Only the workspace owner can delete it'
      });
      return;
    }
    
    // Find the workspace
    const workspace = await Workspace.findByPk(workspaceId);
    
    if (!workspace) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
      return;
    }
    
    // Delete all blocks in the workspace
    await Block.update(
      { is_deleted: true },
      { where: { workspace_id: workspaceId }, transaction }
    );
    
    // Delete all workspace members
    await WorkspaceMember.destroy({
      where: { workspace_id: workspaceId },
      transaction
    });
    
    // Delete the workspace
    await workspace.destroy({ transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Workspace deleted successfully'
    });
  } catch (error: unknown) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error('Error deleting workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting workspace',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler));

/**
 * @route   POST /api/workspaces/:id/members
 * @desc    Add a member to a workspace
 * @access  Private
 */
router.post('/:id/members', authenticate, ((async (req: Request, res: Response) => {
  const { email, role = 'viewer' } = req.body;
  const workspaceId = req.params.id;
  
  // Start a transaction
  const transaction = await sequelize.transaction();
  
  try {
    // Check if user is an admin or owner of the workspace
    const membership = await WorkspaceMember.findOne({
      where: { 
        workspace_id: workspaceId,
        user_id: req.user.id,
        role: ['owner', 'admin'] as unknown as WorkspaceRole
      }
    });
    
    if (!membership) {
      await transaction.rollback();
      res.status(403).json({
        success: false,
        message: 'You do not have permission to add members'
      });
      return;
    }
    
    // Find the user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Check if user is already a member
    const existingMember = await WorkspaceMember.findOne({
      where: { 
        workspace_id: workspaceId,
        user_id: user.id
      }
    });
    
    if (existingMember) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'User is already a member of this workspace'
      });
      return;
    }
    
    // Add the member
    const member = await WorkspaceMember.create({
      workspace_id: workspaceId,
      user_id: user.id,
      role: role as WorkspaceRole
    }, { transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      data: member
    });
  } catch (error: unknown) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding member',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler));

export default router; 