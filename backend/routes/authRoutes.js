const express = require("express");
const router = express.Router();
const User = require("../m/user"); 
const bcrypt = require("bcryptjs");

// --- REGISTER ---
router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Fields required!" });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User exists!" });

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: "User created!" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- LOGIN ---
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        res.json({ message: "Login success", email: user.email });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;