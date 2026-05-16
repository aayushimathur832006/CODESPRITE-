const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const pdfParse = require('pdf-parse-fork'); 

const app = express();
app.use(cors());
app.use(express.json()); // <--- IMPORTANT: JSON data padhne ke liye zaroori hai

const upload = multer({ storage: multer.memoryStorage() });

// --- MOCK DATABASE (Abhi ke liye memory mein, baad mein MongoDB se connect karna) ---
const users = []; 

// --- 1. SIGNUP ROUTE ---
app.post('/api/auth/register', (req, res) => {
    const { email, password } = req.body;
    console.log(`📝 Signup Attempt: ${email}`);

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, message: "Bhai, user already exists!" });
    }

    users.push({ email, password });
    res.status(201).json({ success: true, message: "Signup Successful!" });
});

// --- 2. LOGIN ROUTE ---
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`🔑 Login Attempt: ${email}`);

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        console.log("✅ Match!");
        res.json({ success: true, message: "Login Success", email: user.email });
    } else {
        console.log("❌ Mismatch!");
        res.status(401).json({ success: false, message: "Invalid Credentials!" });
    }
});

// --- 3. RESUME ANALYZER ROUTE ---
app.post('/api/analyze-resume', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const data = await pdfParse(req.file.buffer);
        const text = data.text.toLowerCase();

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: "PDF is empty or scanned as image" });
        }

        const targetKeywords = ['python', 'javascript', 'flask', 'tailwind', 'sql', 'node', 'react', 'c++', 'dsa'];
        let foundSkills = targetKeywords.filter(kw => text.includes(kw));
        const score = Math.round((foundSkills.length / targetKeywords.length) * 100);
        
        res.json({ 
            success: true,
            score: score, 
            skills: foundSkills,
            missing: targetKeywords.filter(k => !foundSkills.includes(k))
        });
    } catch (err) {
        res.status(500).json({ error: "Server failed to read PDF: " + err.message });
    }
});

// --- 4. INTERVIEW QUESTIONS ---
app.get('/api/interview-questions', async (req, res) => {
    try {
        const response = await axios.get("https://alfa-leetcode-api.onrender.com/problems?limit=100");
        const problems = response.data.problemsetQuestionList;
        const shuffled = problems.sort(() => 0.5 - Math.random()).slice(0, 3);
        const questions = shuffled.map(p => `Explain your logic for solving the problem: ${p.title}.`);
        questions.push("Great job. That concludes our mock session.");
        res.json({ success: true, questions });
    } catch (err) {
        res.json({ success: false, questions: ["Explain Bubble Sort.", "What is a Binary Tree?", "Session End."] });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 CRUPT Node Server running on port ${PORT}`);
    console.log(`👉 Login: http://localhost:3000/api/auth/login`);
});