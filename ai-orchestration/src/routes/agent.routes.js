import { Router } from "express";
import agent from "../agents/code.agent.js";

const agentRouter = Router();

agentRouter.post("/invoke", async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ error: "Request body is required" });
        }

        const { message, projectId } = req.body;
        if (!message || !projectId) {
            return res.status(400).json({ error: "message and projectId are required fields" });
        }

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        const writer = (text) => res.write(text);

        const stream = await agent.stream(
            { messages: [ { role: "user", content: message } ] },
            { context: { projectId, writer }, streamMode: "values" }
        );

        let lastState = null;
        for await (const state of stream) {
            lastState = state;
        }

        if (lastState?.messages?.length) {
            const msgs = lastState.messages;
            for (let i = msgs.length - 1; i >= 0; i--) {
                const m = msgs[i];
                const role = m.role ?? m._getType?.();
                if ((role === 'ai' || role === 'assistant') && !m.tool_calls?.length) {
                    const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
                    res.write(content + '\n');
                    break;
                }
            }
        }

        res.end();
    } catch (error) {
        console.error("Error invoking agent:", error);
        if (res.headersSent) {
            res.end();
        } else {
            res.status(500).json({ error: "Failed to invoke agent" });
        }
    }
});

export default agentRouter;