import Redis from "ioredis"
import { deletePod } from "../kubernetes/pod.js";
import { deleteService } from "../kubernetes/service.js";

const redis = new Redis(process.env.REDIS_URL);

const subscriber = new Redis(process.env.REDIS_URL);

export async function createSandboxKey(sandboxId) {
    await redis.set(`sandbox:${sandboxId}`, JSON.stringify({
        status: "active"
    }), 'EX', 60 * 10);
}

await subscriber.config("SET", "notify-keyspace-events", "Ex");

subscriber.subscribe("__keyevent@0__:expired")

subscriber.on("message", async(channel, key) => {
    try {
        const sandboxId = key.split(":")[1];
        await deletePod(sandboxId);
        await deleteService(sandboxId);
    } catch(error) {
        console.error(`Failed to clean up sandbox ${key}:`, error);
        // subscriber keeps running — other expirations still handled
    }
})


export default { redis, subscriber };