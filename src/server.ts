import express from "express";
import type { Application } from "express";
import env from "./env.js";
import cors from "cors";
import router from "./routes/index.js";

const app: Application = express();
const port = env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.use("/api", router);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
