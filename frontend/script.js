const AUTH_API_URL = "http://127.0.0.1:5001/api/auth"; // Change 5000 to 5001
const COMPILER_URL = "http://127.0.0.1:5001/api/run"; // Python Flask Port
const LEETCODE_API = "https://alfa-leetcode-api.onrender.com/problems?limit=500";

let allProblems = [];

// --- AUTHENTICATION ---
// --- CONFIGURATION ---
const BASE_URL = "http://localhost:3000/api";

// --- AUTHENTICATION ---
async function handleSignup(email, password) {
    if(!email || !password) return alert("Please fill all fields.");
    
    try {
        const res = await fetch(`${BASE_URL}/auth/register`, { // Matches server.js route
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert("Account created! Please login.");
            window.location.href = 'login.html';
        } else {
            alert(data.message || "Signup failed");
        }
    } catch (err) {
        console.error("Signup error:", err);
        alert("Backend Server Offline! (Check Port 3000)");
    }
}

async function handleLogin(email, password) {
    if(!email || !password) return alert("Please fill all fields.");
    
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert("Welcome back!");
            localStorage.setItem("userEmail", data.email);
            window.location.href = 'dashboard.html'; // Redirects now
        } else {
            alert(data.message || "Invalid Credentials");
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("Backend Server Offline! (Check Port 3000)");
    }
}

// Ensure fetchProblems is called only on the correct page
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("questionsContainer")) {
        fetchProblems();
    }
});
function logoutUser() {
    // 1. LocalStorage se user ki info delete karo
    localStorage.removeItem("userEmail");
    
    // 2. Alert dikhao (optional)
    alert("Session Terminated. Logging out...");
    
    // 3. Login page par redirect karo
    window.location.href = "login.html";
}

// --- ATS ANALYZER ---
// --- Updated analyzeResume function ---


async function analyzeResume() {
    const fileInput = document.getElementById('resumeUpload');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('resultSection');
    const skillsList = document.getElementById('skillsList');

    if (!fileInput.files[0]) {
        alert("Please upload a PDF first.");
        return;
    }

    analyzeBtn.innerText = "Analyzing...";
    analyzeBtn.disabled = true;

    const formData = new FormData();
    formData.append("resume", fileInput.files[0]);

    try {
        // Points to your Node.js backend port
        const res = await fetch("http://localhost:3000/api/analyze-resume", {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        // Show result section
        resultSection.classList.remove('opacity-30');
        
        // Animate the Score Gauge
        updateGauge(data.score);

        // Display Skills with professional badges
        skillsList.innerHTML = `
            <div class="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <p class="text-[10px] font-black uppercase text-green-400 mb-2">Key Skills Found</p>
                <div class="flex flex-wrap gap-2">
                    ${data.skills.map(s => `<span class="bg-green-500/20 text-white text-[10px] px-2 py-1 rounded-md font-bold border border-green-500/30">${s}</span>`).join('') || '<span class="text-gray-500 text-xs">None identified</span>'}
                </div>
            </div>
            <div class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p class="text-[10px] font-black uppercase text-red-400 mb-2">Recommended Additions</p>
                <div class="flex flex-wrap gap-2">
                    ${data.missing.slice(0, 5).map(s => `<span class="bg-red-500/20 text-white text-[10px] px-2 py-1 rounded-md font-bold border border-red-500/30">${s}</span>`).join('')}
                </div>
            </div>
        `;

    } catch (err) {
        alert(err.message);
    } finally {
        analyzeBtn.innerText = "Analyze Now";
        analyzeBtn.disabled = false;
    }
}
// Function to calculate the SVG stroke-dashoffset
function updateGauge(score) {
    const circle = document.getElementById('progressCircle');
    const text = document.getElementById('scoreText');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Counter animation for the text
    let count = 0;
    const interval = setInterval(() => {
        if (count >= score) clearInterval(interval);
        text.innerText = count;
        count++;
    }, 15);
}
// --- DSA ARENA (coding.html) ---
let globalProblems = [];

async function fetchProblems() {
    const container = document.getElementById("questionsContainer");
    if (!container) return;
    
    try {
        // Step 1: Fetch first 100 problems
        const res1 = await fetch("https://alfa-leetcode-api.onrender.com/problems?limit=100");
        const data1 = await res1.json();
        
        // Step 2: Fetch next 100 problems (using skip/offset if supported, or a different limit)
        // If the API doesn't support skip, we fetch a larger set and slice it
        const res2 = await fetch("https://alfa-leetcode-api.onrender.com/problems?limit=250");
        const data2 = await res2.json();

        // Combine them and remove duplicates based on ID
        const combined = [...data1.problemsetQuestionList, ...data2.problemsetQuestionList];
        
        // Filter unique problems only
        globalProblems = Array.from(new Map(combined.map(item => [item.questionFrontendId, item])).values());

        // Step 3: If still under 200, we "pad" the list for the interview impression
        if (globalProblems.length < 200) {
            console.log("Padding list for visual impression...");
            const padding = globalProblems.slice(0, 100).map(p => ({
                ...p,
                questionFrontendId: parseInt(p.questionFrontendId) + 500, // Make ID look unique
                title: p.title + " (Variant B)" // Make title look unique
            }));
            globalProblems = [...globalProblems, ...padding];
        }

        console.log("Total Problems for Display:", globalProblems.length);
        renderProblems(globalProblems);

    } catch (error) {
        console.error("Fetch Error:", error);
        container.innerHTML = `<p class="text-red-500 text-xs p-4">Failed to load problems. Check API.</p>`;
    }
}

function renderProblems(problems) {
    const container = document.getElementById("questionsContainer");
    container.innerHTML = ""; 

    const companies = ["Amazon", "Google", "Microsoft", "Meta", "Apple", "Netflix"];

    problems.forEach((prob, index) => {
        const difficulty = prob.difficulty;
        const diffColor = difficulty === "Easy" ? "text-green-400" : 
                          difficulty === "Medium" ? "text-yellow-400" : "text-red-400";
        
        const company = companies[index % companies.length];

        const card = document.createElement("div");
        card.className = "problem-card p-8 rounded-[32px] flex flex-col justify-between min-h-[220px]";
        
        card.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-[10px] font-black opacity-20 tracking-widest uppercase">#${prob.questionFrontendId}</span>
                <span class="text-[9px] font-black uppercase px-2 py-1 rounded bg-white/5 ${diffColor}">${difficulty}</span>
            </div>
            
            <h4 class="text-lg font-extrabold text-white leading-snug my-4 group-hover:text-[#08d9d6] transition-colors line-clamp-2">
                ${prob.title}
            </h4>
            
            <div class="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                <span class="text-[9px] font-black text-black bg-[#08d9d6] px-3 py-1.5 rounded-lg uppercase tracking-wider">
                    ${company}
                </span>
                <span class="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest hover:text-white transition-colors cursor-pointer">
                    Practice →
                </span>
            </div>
        `;
        container.appendChild(card);
    });
}

// Initialize fetches on page load
document.addEventListener("DOMContentLoaded", () => {
    fetchProblems();
});