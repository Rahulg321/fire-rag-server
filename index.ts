import express from "express";
import cors from "cors";
import createBotRouter from "./routes/create-bot";
import botsRouter from "./routes/bots";
import addBotResourceRouter from "./routes/add-bot-resource";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/bots", botsRouter);
app.use("/create-bot", createBotRouter);
app.use("/add-bot-resource", addBotResourceRouter);

const port = parseInt(process.env.PORT || "8080");

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
  console.log(`PORT env var: ${process.env.PORT}`);
});
