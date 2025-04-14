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
 * @route   POST /api/workspaces
 * @desc    Create a new workspace
 * @access  Private
 */
router.post('/', auth_1.authenticate, (async (req, res) => {
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
    const transaction = await database_1.default.transaction();
    try {
        // Create the workspace
        const workspace = await models_1.Workspace.create({
            id: (0, uuid_1.v4)(),
            name,
            icon: icon || null,
            owner_id: req.user.id
        }, { transaction });
        // Add the creator as an owner
        await models_1.WorkspaceMember.create({
            workspace_id: workspace.id,
            user_id: req.user.id,
            role: 'owner'
        }, { transaction });
        // Create a root page block for the workspace
        const rootBlock = await models_1.Block.create({
            id: (0, uuid_1.v4)(),
            type: 'page',
            content: { title: `${name} Home` },
            workspace_id: workspace.id,
            created_by: req.user.id,
            permissions: { public: false }
        }, { transaction });
        // Commit the transaction
        await transaction.commit();
        // Fetch the workspace with its members
        const result = await models_1.Workspace.findByPk(workspace.id, {
            include: [
                {
                    model: models_1.WorkspaceMember,
                    as: 'members',
                    include: [{ model: models_1.User, as: 'user', attributes: ['id', 'email'] }]
                },
                {
                    model: models_1.Block,
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
    }
    catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        console.error('Error creating workspace:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating workspace',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * @route   GET /api/workspaces
 * @desc    Get all workspaces for the current user
 * @access  Private
 */
router.get('/', auth_1.authenticate, (async (req, res) => {
    try {
        // Find all workspaces where the user is a member
        const memberships = await models_1.WorkspaceMember.findAll({
            where: { user_id: req.user.id },
            include: [{ model: models_1.Workspace, as: 'workspace' }]
        });
        // Access the relationship through the association property
        const workspaces = memberships.map(membership => membership.get('workspace'));
        res.status(200).json({
            success: true,
            data: workspaces
        });
    }
    catch (error) {
        console.error('Error fetching workspaces:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching workspaces',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * @route   GET /api/workspaces/:id
 * @desc    Get a workspace by ID
 * @access  Private
 */
router.get('/:id', auth_1.authenticate, (async (req, res) => {
    try {
        // Check if user is a member of the workspace
        const membership = await models_1.WorkspaceMember.findOne({
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
        const workspace = await models_1.Workspace.findByPk(req.params.id, {
            include: [
                {
                    model: models_1.WorkspaceMember,
                    as: 'members',
                    include: [{ model: models_1.User, as: 'user', attributes: ['id', 'email'] }]
                },
                {
                    model: models_1.Block,
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
    }
    catch (error) {
        console.error('Error fetching workspace:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching workspace',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * @route   PUT /api/workspaces/:id
 * @desc    Update a workspace
 * @access  Private
 */
router.put('/:id', auth_1.authenticate, (async (req, res) => {
    const { name, icon } = req.body;
    const workspaceId = req.params.id;
    try {
        // Check if user is an admin or owner of the workspace
        const membership = await models_1.WorkspaceMember.findOne({
            where: {
                workspace_id: workspaceId,
                user_id: req.user.id,
                role: ['owner', 'admin']
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
        const workspace = await models_1.Workspace.findByPk(workspaceId);
        if (!workspace) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
            return;
        }
        // Update workspace fields
        const updateData = {};
        if (name)
            updateData.name = name;
        if (icon !== undefined)
            updateData.icon = icon;
        await workspace.update(updateData);
        res.status(200).json({
            success: true,
            data: workspace
        });
    }
    catch (error) {
        console.error('Error updating workspace:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating workspace',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * @route   DELETE /api/workspaces/:id
 * @desc    Delete a workspace
 * @access  Private
 */
router.delete('/:id', auth_1.authenticate, (async (req, res) => {
    const workspaceId = req.params.id;
    // Start a transaction
    const transaction = await database_1.default.transaction();
    try {
        // Check if user is the owner of the workspace
        const membership = await models_1.WorkspaceMember.findOne({
            where: {
                workspace_id: workspaceId,
                user_id: req.user.id,
                role: 'owner'
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
        const workspace = await models_1.Workspace.findByPk(workspaceId);
        if (!workspace) {
            await transaction.rollback();
            res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
            return;
        }
        // Delete all blocks in the workspace
        await models_1.Block.update({ is_deleted: true }, { where: { workspace_id: workspaceId }, transaction });
        // Delete all workspace members
        await models_1.WorkspaceMember.destroy({
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
    }
    catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        console.error('Error deleting workspace:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting workspace',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * @route   POST /api/workspaces/:id/members
 * @desc    Add a member to a workspace
 * @access  Private
 */
router.post('/:id/members', auth_1.authenticate, (async (req, res) => {
    const { email, role = 'viewer' } = req.body;
    const workspaceId = req.params.id;
    // Start a transaction
    const transaction = await database_1.default.transaction();
    try {
        // Check if user is an admin or owner of the workspace
        const membership = await models_1.WorkspaceMember.findOne({
            where: {
                workspace_id: workspaceId,
                user_id: req.user.id,
                role: ['owner', 'admin']
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
        const user = await models_1.User.findOne({ where: { email } });
        if (!user) {
            await transaction.rollback();
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        // Check if user is already a member
        const existingMember = await models_1.WorkspaceMember.findOne({
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
        const member = await models_1.WorkspaceMember.create({
            workspace_id: workspaceId,
            user_id: user.id,
            role: role
        }, { transaction });
        // Commit the transaction
        await transaction.commit();
        res.status(201).json({
            success: true,
            data: member
        });
    }
    catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        console.error('Error adding member:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding member',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
exports.default = router;
