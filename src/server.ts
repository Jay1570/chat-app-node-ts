import express from "express";
import type { Application } from "express";
import env from "./env.js";
import cors from "cors";
import router from "./routes/index.js";
import { requestLogger } from "./middlewares/logger.js";
import { sendResponse } from "./utils/resoonseHandler.js";

const app: Application = express();
const port = env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.use(requestLogger);
app.use("/api", router);

app.use((req, res) => {
    return sendResponse(res, {
        success: false,
        message: `Route ${req.path} not found`,
        statusCode: 404,
        data: undefined,
    })
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
