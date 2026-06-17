import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { Server } from 'socket.io';
import http from "http"
import pty from 'node-pty';
import os from 'os';


// ===============================================
// CRITICAL FIX: Shell must be at the very top
// ===============================================
const shell = process.env.SHELL ||
    (os.platform() === 'win32' ? 'powershell.exe' : 'bash');


const WORKING_DIR = "/workspace";


const app = express();
const httpServer = http.createServer(app)


app.use(morgan('dev'));
app.use(cors({
    methods: ["GET", "POST", "PATCH", "DELETE"],
    origin: "*",
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH"]
    }
})

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Hello, from sandbox agent!',
        status: 'success',
    });
});


// Spawn the PTY process 
let ptyProcess = null;
try {
    if (!fs.existsSync(WORKING_DIR)) {
        fs.mkdirSync(WORKING_DIR, { recursive: true });
    }

    ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: WORKING_DIR,
        env: process.env
    });

    ptyProcess.onData((data) => {
        io.emit("terminal-output", data);
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(`PTY process exited with code: ${exitCode}, signal: ${signal}`);
    });
} catch (spawnError) {
    console.error("Failed to spawn PTY process:", spawnError);
}

io.on("connection", (socket) => {
    console.log("Client connected:" + socket.id)

    socket.on("terminal-input", (data) => {
        if (ptyProcess) {
            ptyProcess.write(data);
        } else {
            socket.emit("terminal-output", "\r\n[Agent Error: PTY shell is not available]\r\n");
        }
    })

    socket.on("disconnect", () => {
        console.log("Client disconnected:" + socket.id);
    })
})

/**
 * @route GET /list-files
 * @description Lists all files in the working directory and returns their names as a JSON array. Excludes directories like node_modules and .git. The response should be a JSON object with a "files" property containing an array of file paths relative to the working directory.
 * -eg. { "files": [
 *          "file1.txt", 
 *          "src/file2.txt",
 *          "src/subdir/file3.txt"
 * ] }
 */
app.get("/list-files", async (req, res) => {

    const listFiles = async (dir, baseDir) => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        const files = [];

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(baseDir, fullPath);

            if (entry.isDirectory() && ["node_modules", ".git", "dist"].includes(entry.name)) {
                continue; // Skip excluded directories
            }
            if (entry.isDirectory()) {
                files.push(...await listFiles(fullPath, baseDir)); // Recursively list files in subdirectories
            } else {
                files.push(relativePath);
            }
        }
        return files;
    };

    try {
        const files = await listFiles(WORKING_DIR, WORKING_DIR);
        res.status(200).json({
            message: "Files in working directory",
            files: files
        })
    } catch (error) {
        res.status(500).json({
            message: `Error listing files: ${error.message}`,
            status: "error"
        })
    }

});


/**
 * @route GET /read-files
 * @description Reads the content of all files requested in the query parameter "files" and returns their content as a JSON object.
 */
app.get("/read-files", async (req, res) => {
    try {
        const files = req.query.files;

        if (!files) {
            return res.status(400).json({
                message: "No files specified in query parameters",
                status: "error"
            });
        }

        if (typeof files !== 'string') {
            return res.status(400).json({
                message: "Invalid files query parameter format. Expected comma-separated string.",
                status: "error"
            });
        }

        const fileList = files.split(",");
        const results = await Promise.all(fileList.map(async (file) => {
            const filePath = path.join(WORKING_DIR, file);

            try {
                const content = await fs.promises.readFile(filePath, "utf-8");
                return {
                    [filePath.replace(WORKING_DIR, "")]: content
                };
            } catch (error) {
                return {
                    [filePath.replace(WORKING_DIR, "")]: `Error reading file: ${error.message}`
                };
            }
        }));

        res.status(200).json({
            message: "File contents",
            files: results
        });
    } catch (error) {
        console.error("Error in read-files route:", error);
        res.status(500).json({
            message: `Internal server error: ${error.message}`,
            status: "error"
        });
    }
});

/**
 * @route PATCH /update-file
 * @description Updates the content of a specified file in the requested body. The request body should be a JSON object with a "file" property specifying the file path and a "content" property specifying the new content.
 */
app.patch("/update-file", async (req, res) => {
    try {
        const updates = req.body.updates;

        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({
                message: "Invalid request body. Expected a JSON object with an 'updates' property containing an array of file updates.",
                status: "error"
            })
        }

        const results = await Promise.all(updates.map(async (update) => {
            try {
                if (!update || typeof update !== 'object') {
                    throw new Error("Invalid update object format");
                }
                const { file, content } = update;
                const filePath = path.join(WORKING_DIR, file);
                await fs.promises.writeFile(filePath, content, "utf-8");
                return {
                    [filePath]: "File updated successfully"
                }
            } catch (error) {
                return {
                    error: `Error updating file: ${error.message}`
                }
            }
        }))

        res.status(200).json({
            message: "File update results",
            results: results
        })
    } catch (error) {
        console.error("Error in update-file route:", error);
        res.status(500).json({
            message: `Internal server error: ${error.message}`,
            status: "error"
        });
    }
})

/**
 * @route POST /create-file
 * @description Creates a new file with the specified name and content. The request body should be a JSON object with a "file" property specifying the file name and a "content" property specifying the file content.
 */
app.post("/create-file", async (req, res) => {
    try {
        const files = req.body.files;

        if (!files || !Array.isArray(files)) {
            return res.status(400).json({
                message: "Invalid request body. Expected a JSON object with a 'files' property containing an array of file objects.",
                status: "error"
            })
        }

        const results = await Promise.all(files.map(async (fileObj) => {
            try {
                if (!fileObj || typeof fileObj !== 'object') {
                    throw new Error("Invalid file object format");
                }
                const { file, content } = fileObj;
                const filePath = path.join(WORKING_DIR, file);
                await fs.promises.mkdir(path.dirname(filePath), { recursive: true }); // Ensure the directory exists
                await fs.promises.writeFile(filePath, content, "utf-8");
                return {
                    [filePath]: "File created successfully"
                }
            } catch (error) {
                return {
                    error: `Error creating file: ${error.message}`
                }
            }
        }))

        res.status(200).json({
            message: "File creation results",
            results: results
        })
    } catch (error) {
        console.error("Error in create-file route:", error);
        res.status(500).json({
            message: `Internal server error: ${error.message}`,
            status: "error"
        });
    }
})

export default httpServer;