import { Router } from "express";
import { createPod } from "../kubernetes/pod.js";
import { createService } from "../kubernetes/service.js";
import { createSandboxKey } from "../config/redis.js";
import { v7 as uuid } from "uuid"
import { authMiddleware } from "../middlewares/auth.middleware.js";
import Project from "../models/project.model.js"

const router = Router()

router.post("/project", authMiddleware, async (req, res) => {
    try {
        const { title } = req.body

        const newProject = new Project({
            user: req.user.id,
            title
        })

        await newProject.save();
        return res.status(201).json({
            message: "Project created successfully",
            project: newProject
        })
    } catch (error) {
        console.error("Error creating project:", error)
        return res.status(500).json({ error: "Failed to create project" })
    }
})

router.post("/start", authMiddleware, async (req, res) => {

    try {
        const projectId = req.body.projectId;

        const project = await Project.findOne({ _id: projectId, user: req.user.id });

        if (!project) {
            return res.status(404).json({ error: "Project not found or access denied" })
        }

        //Generate sandbox ID
        const sandboxId = uuid()

        //Create sandbox resources
        await Promise.all([
            createPod(sandboxId, projectId),
            createService(sandboxId),
            createSandboxKey(sandboxId)
        ])

        res.status(201).json({
            message: "Sandbox environment created successfully",
            sandboxId,
            previewUrl: `http://${sandboxId}.preview.localhost`
        })
    } catch (error) {
        console.error("Error creating sandbox:", error)
        res.status(500).json({
            message: "Failed to create sandbox environment",
            error: error.message
        })
    }
})

router.get("/project", authMiddleware, async (req, res) => {
    try {
        const projects = await Project.find({ user: req.user.id })

        return res.status(200).json({
            message: "Projects fetched successfully",
            projects
        })
    } catch (error) {
        console.error("Error fetching projects:", error)
        return res.status(500).json({ error: "Failed to fetch projects" })
    }
})

export default router;