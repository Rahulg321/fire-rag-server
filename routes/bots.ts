import { Router } from "express";
import authenticateToken from "../middleware/authenticate-token";

const router = Router();

router.get("/", authenticateToken, (req, res) => {
  res.status(200).json({ bots: ["Customer Support", "Sales", "Marketing"] });
});

router.post("/", authenticateToken, (req, res) => {
  const { name, description } = req.body;
  console.log("Creatig bot");
  console.log(name, description);
  res.status(200).json({ message: "Bot created successfully" });
});

export default router;
