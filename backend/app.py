from flask import Flask, render_template, request, jsonify
import math
from flask_cors import CORS  # <--- 1. Add this import

app = Flask(__name__)
CORS(app)  # <--- 2. Add this line right after 'app' is defined

# ... rest of your code (routes, logic, etc.)

import re
import io
import PyPDF2

# --- CONFIGURING SDE ATS JUDGEMENT MATRICES ---
TECH_KEYWORDS = {
    "react", "angular", "vue", "typescript", "javascript", "node.js", "express.js",
    "python", "django", "flask", "java", "spring boot", "c++", "golang", "ruby",
    "mysql", "postgresql", "mongodb", "redis", "aws", "docker", "kubernetes", 
    "ci/cd", "git", "github", "rest api", "graphql", "html5", "css3", "tailwind"
}

# Mapping core keywords to modern recommendations if a developer leaves them out
SIBLING_MAP = {
    "react": "Redux / State Management",
    "node.js": "Express / REST APIs",
    "javascript": "TypeScript Ecosystem",
    "python": "Flask / Django Frameworks",
    "mysql": "Redis Caching Layer",
    "aws": "Docker Containerization / CI-CD Pipelines"
}

# Action markers that represent high impact on an engineer's resume
ACTION_VERBS = {"architected", "deployed", "engineered", "optimized", "spearheaded", "refactored", "scaled"}
REQUIRED_SECTIONS = {"experience", "education", "skills", "projects"}


# --- ROUTE RENDERING ---
@app.route('/')
def login(): return render_template('login.html')

@app.route('/signup')
def signup(): return render_template('signup.html')

@app.route('/dashboard')
def dashboard(): return render_template('dashboard.html')

@app.route('/coding')
def coding(): return render_template('coding.html')

@app.route('/analyzer')
def analyzer(): return render_template('analyzer.html')

@app.route('/interview')
def interview(): return render_template('interview.html')


# --- REAL ATS ANALYZER PROCESSING API ---
@app.route('/api/analyze-resume', methods=['POST'])
def analyze_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file detected in request submission."}), 400
        
    file = request.files['resume']
    if file.filename == '':
        return jsonify({"error": "Empty file name submitted."}), 400

    try:
        # Step 1: Read out the text layers inside the uploaded PDF document stream
        pdf_stream = io.BytesIO(file.read())
        pdf_reader = PyPDF2.PdfReader(pdf_stream)
        extracted_text = ""
        
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + " "
                
        cleaned_text = extracted_text.lower()
        
        # If the file wasn't an actual text-based resume (or was empty/image scan only)
        if len(cleaned_text.strip()) < 20:
            return jsonify({
                "score": 12,
                "skills": [],
                "missing": ["Valid Text Format", "Readable PDF Layer"]
            })

        # --- JUDGEMENT GRADING METRIC LOGIC ---
        score = 0
        found_skills = set()
        missing_skills = set()

        # Pillar A: Hard Skills Matching (Max 40 Points)
        for keyword in TECH_KEYWORDS:
            if keyword in cleaned_text:
                found_skills.add(keyword.upper())
                
        # Up to 4 points given per core technical tool found
        score += min(len(found_skills) * 4, 40)

        # Pillar B: Impact Metrics & Quantified Data Tracking (Max 40 Points)
        # Search for metrics using regular expressions (Percentages, numbers over 10, or financial indicators)
        quantifiable_metrics = re.findall(r'\b\d+%\b|\$\d+|\b[1-9]\d+\+?\b', cleaned_text)
        metric_points = min(len(quantifiable_metrics) * 4, 20)
        
        # Search for powerful engineering action headers
        verb_count = sum(1 for verb in ACTION_VERBS if verb in cleaned_text)
        verb_points = min(verb_count * 4, 20)
        
        score += (metric_points + verb_points)

        # Pillar C: Essential Component Structuring Check (Max 20 Points)
        for section in REQUIRED_SECTIONS:
            if section in cleaned_text:
                score += 5

        # Extract context-aware recommended items for the missing array
        for key, critical_addition in SIBLING_MAP.items():
            if key in cleaned_text and critical_addition.lower() not in cleaned_text:
                missing_skills.add(critical_addition)

        # Safe defaults if the candidate's core resume profile is clean
        if len(missing_skills) == 0:
            missing_skills = {"Unit Testing (Jest/PyTest)", "CI/CD Deployment Pipelines", "Cloud Infrastructure Services"}

        return jsonify({
            "score": max(min(int(score), 100), 15), # Standard boundary locks
            "skills": list(found_skills)[:8],       # Display up to 8 matched core items
            "missing": list(missing_skills)[:5]     # Display up to 5 strategic gap suggestions
        })

    except Exception as e:
        return jsonify({"error": f"Internal parsing engine breakdown: {str(e)}"}), 500


if __name__ == '__main__':
    # use_reloader=False stops the socket error on Windows
    app.run(debug=True, use_reloader=False, port=5000)