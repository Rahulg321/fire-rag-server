import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({ bots: ["Customer Support", "Sales", "Marketing"] });
});

router.post("/", (req, res) => {
  const { name, description } = req.body;
  console.log("Creatig bot");
  console.log(name, description);
  res.status(200).json({ message: "Bot created successfully" });
});

export default router;
