import express from "express";
import morgan from "morgan";
import { sendEmail } from "./email.js";
import channel from "./mq.js";

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
    res.send("Notification Service is running");
});

app.get("/_status/healthz", (req, res) => {
    res.status(200).json({ status: "ok" });
})

app.get("/_status/readyz", (req, res) => {
    res.status(200).json({ status: "ok" });
})

channel.consume("auth_notification_queue", async (msg) => {
    try {
        if (msg !== null) {
            const messageContent = msg.content.toString();
            console.log("Received message from queue:", messageContent);

            try {
                const { userId, timestamp, email } = JSON.parse(messageContent);

                const subject = "New Login Notification";
                const text = `A new login was detected for your account at ${timestamp}. If this was not you, `;
                const html = `
                <div style="font-family: sans-serif;">
                    <h1>New Login Detected</h1>
                    <p>A new login was detected for your account at ${timestamp}. If this was not you, please change your password immediately.</p>
                </div>
            `;

                await sendEmail(email, subject, text, html);

                channel.ack(msg);
                console.log("message acked", msg);
            } catch (error) {
                console.error("Error processing message:", error);
                channel.nack(msg, false, true);
            }
        } else {
            console.log("No message received");
        }
    } catch (error) {
        console.error(error)
    }
})

export default app;