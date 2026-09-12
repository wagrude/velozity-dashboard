import "dotenv/config";
import http from "node:http";
import app from "./app.js";
import { attachRealtime } from "./realtime/register.js";
import { startOverdueJob } from "./jobs/overdue.job.js";

const PORT = Number(process.env.PORT) || 5000;

const httpServer = http.createServer(app);
attachRealtime(httpServer);
startOverdueJob();

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});