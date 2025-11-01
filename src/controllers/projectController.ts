import { Request, Response } from "express";
import { Project } from "../models/projectModel";
import { STATUS_CODES, ROLES } from "../utils/constants";

/**
 * Create a new project
 */
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, members } = req.body;
    const userId = (req as any).user?.id;

    if (!name) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Project name is required" });
    }

    const project = await Project.create({
      name,
      description,
      createdBy: userId,
      members: members || [userId],
    });

    const newProject = await Project.findById(project._id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    res.status(STATUS_CODES.CREATED).json({
      message: "Project created successfully",
      project: newProject,
    });
  } catch (error: any) {
    console.error(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to create project",
      error: error.message,
    });
  }
};

/**
 * Get all projects (visible to all roles)
 */
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const projects = await Project.find({ isDeleted: false })
      .populate("createdBy", "name email")
      .populate("members", "name email");

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Projects fetched successfully",
      projects,
    });
  } catch (error: any) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
};

/**
 * Get paginated projects 
 */
export const getPaginatedProjects = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const totalProjects = await Project.countDocuments({ isDeleted: false });
    const projects = await Project.find({ isDeleted: false })
      .populate("createdBy", "name email")
      .populate("members", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Projects fetched successfully",
      projects,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProjects / limit),
        totalItems: totalProjects,
        itemsPerPage: limit,
      },
    });
  } catch (error: any) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
};

/**
 * Get a single project by ID
 */
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    if (!project) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: "Project not found" });
    }

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Project fetched successfully",
      project,
    });
  } catch (error: any) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch project",
      error: error.message,
    });
  }
};

/**
 * Update an existing project (only admin or project creator)
 */
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, members } = req.body;
    const user = (req as any).user;

    const project = await Project.findById(id);
    if (!project) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: "Project not found" });
    }

    // Only admin or project creator can update
    if (
      user.role !== ROLES.ADMIN &&
      project.createdBy.toString() !== user._id.toString()
    ) {
      return res
        .status(STATUS_CODES.FORBIDDEN)
        .json({ message: "Not authorized to update this project" });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    if (members) project.members = members;

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error: any) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update project",
      error: error.message,
    });
  }
};

/**
 * Delete a project (only admin or project creator)
 */
/**
 * Soft delete a project (only admin or project creator)
 */
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const project = await Project.findById(id);
    if (!project) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: "Project not found" });
    }

    // Only admin or project creator can delete
    if (
      user.role !== ROLES.ADMIN &&
      project.createdBy.toString() !== user._id.toString()
    ) {
      return res
        .status(STATUS_CODES.FORBIDDEN)
        .json({ message: "Not authorized to delete this project" });
    }

    project.isDeleted = true;
    await project.save();

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Project soft-deleted successfully",
    });
  } catch (error: any) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete project",
      error: error.message,
    });
  }
};
