const express = require("express");
const router = express.Router();
const Question = require("../m/Question"); // Folder path check kar lena

// Naya sawal add karne ke liye (Postman se use kar sakte ho)
router.post("/", async (req, res) => {
  try {
    const q = new Question(req.body);
    await q.save();
    res.json(q);
  } catch (err) {
    res.status(500).json({ message: "Error saving question" });
  }
});

// Dashboard par dikhane ke liye saare questions fetch karna
router.get("/", async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching questions" });
  }
});

module.exports = router;