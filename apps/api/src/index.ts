import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { jenisSuratRouter } from "./routes/jenisSurat.routes.js";
import { permohonanRouter } from "./routes/permohonan.routes.js";
import { adminAuthRouter } from "./routes/admin/auth.routes.js";
import { adminPermohonanRouter } from "./routes/admin/permohonan.routes.js";
import { adminTemplatesRouter } from "./routes/admin/templates.routes.js";
import { adminSettingsRouter } from "./routes/admin/settings.routes.js";
import { adminUsersRouter } from "./routes/admin/adminUsers.routes.js";
import { adminActivityLogRouter } from "./routes/admin/activityLog.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { ok } from "./lib/apiResponse.js";

const app = express();

app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));

app.get("/api/health", (_req, res) => ok(res, { ok: true }));

app.use("/api/jenis-surat", jenisSuratRouter);
app.use("/api/permohonan", permohonanRouter);

app.use("/api/admin", adminAuthRouter); // -> /api/admin/login, /logout, /me
app.use("/api/admin/permohonan", adminPermohonanRouter);
app.use("/api/admin/templates", adminTemplatesRouter);
app.use("/api/admin/settings", adminSettingsRouter);
app.use("/api/admin/users", adminUsersRouter);
app.use("/api/admin/activity-log", adminActivityLogRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info({ port: config.port }, "API E-Layan Desa berjalan");
});
