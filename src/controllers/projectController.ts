import { Request, Response } from "express";
import { Project } from "../models/projectModel";
import { User } from "../models/userModel";

//  Create a new project
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, members } = req.body;
    const userId = (req as any).user?.id;

    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
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

    res.status(201).json({
      message: "Project created successfully",
      project: newProject,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to create project", error: error.message });
  }
};



//  Get all projects 
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    let projects = await Project.find().populate("createdBy", "name email").populate("members", "name email");
    res.status(200).json({ projects });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch projects", error: error.message });
  }
};



//  Get single project by ID
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ project });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch project", error: error.message });
  }
};



//  Update project
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, members } = req.body;
    const user = (req as any).user;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only admin or project creator can update
    if (user.role !== "admin" && project.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this project" });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    if (members) project.members = members;

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    res.status(200).json({ message: "Project updated successfully", project: updatedProject });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update project", error: error.message });
  }
};



//  Delete project
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only admin or project creator can delete
    if (user.role !== "admin" && project.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this project" });
    }

    await project.deleteOne();

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete project", error: error.message });
  }
};
