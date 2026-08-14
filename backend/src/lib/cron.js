import { CronJob } from "cron";
import http from "http";
import https from "node:https";

// every 14 minutes send a GET request to the health endpoint to keep the server awake
const job = new CronJob("*/14 * * * *", function () {
    const base = process.env.FRONTEND_URL;
    if (!base) return;
    const url = new URL("/health", base).href;
    const client = url.startsWith("https:") ? https : http;

    client.get(url, (res) => {
        if (res.statusCode === 200) console.log("GET request to health endpoint successful"); 
        else console.log("GET request to health endpoint failed with status code:", res.statusCode);
})
    .on("error", (e) => console.error("Error sending GET request to health endpoint:", e));
});

export default job;