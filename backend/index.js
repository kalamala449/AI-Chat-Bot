import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import liveRouter from "./routes/live.js";

dotenv.config();

console.log(process.env.GEMINI_API_KEY, 9);


const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/live", liveRouter);
app.use(express.static(path.join(process.cwd(), "public")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
