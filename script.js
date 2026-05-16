
// script.js

// PDF.js setup
const pdfjsLib = window['pdfjs-dist/build/pdf'];

pdfjsLib.GlobalWorkerOptions.workerSrc =
"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

let extractedResumeText = "";

// Skill Database
const skillDatabase = {

    frontend: [

        "html",
        "css",
        "javascript",
        "react",
        "next.js",
        "tailwind",
        "bootstrap",
        "typescript",
        "redux",
        "responsive design",
        "api",
        "figma",
        "ui/ux",
        "sass",
        "webpack",
        "vite",
        "jquery",
        "accessibility",
        "frontend optimization"
    ],

    backend: [

        "node.js",
        "express",
        "mongodb",
        "mysql",
        "firebase",
        "rest api",
        "authentication",
        "jwt",
        "sql",
        "postgresql",
        "django",
        "flask",
        "spring boot",
        "microservices",
        "graphql",
        "redis",
        "server",
        "backend development"
    ],

    data: [

        "python",
        "pandas",
        "numpy",
        "machine learning",
        "data analysis",
        "excel",
        "tableau",
        "statistics",
        "power bi",
        "data visualization",
        "deep learning",
        "tensorflow",
        "scikit-learn",
        "nlp",
        "data cleaning",
        "analytics"
    ],

    devops: [

        "docker",
        "aws",
        "github",
        "git",
        "deployment",
        "ci/cd",
        "kubernetes",
        "linux",
        "cloud computing",
        "azure",
        "jenkins",
        "networking"
    ],

    marketing: [

        "seo",
        "digital marketing",
        "social media",
        "content marketing",
        "branding",
        "analytics",
        "communication",
        "strategy",
        "campaign",
        "advertising",
        "google ads",
        "meta ads",
        "email marketing",
        "copywriting",
        "market research",
        "consumer behavior",
        "sales",
        "lead generation"
    ],

    hr: [

        "recruitment",
        "communication",
        "employee engagement",
        "leadership",
        "management",
        "hiring",
        "onboarding",
        "talent acquisition",
        "payroll",
        "training",
        "conflict resolution",
        "team management",
        "human resources"
    ],

    finance: [

        "excel",
        "financial analysis",
        "accounting",
        "budgeting",
        "forecasting",
        "reporting",
        "auditing",
        "taxation",
        "financial modeling",
        "investment",
        "banking",
        "risk analysis",
        "economics"
    ],

    cybersecurity: [

        "network security",
        "ethical hacking",
        "penetration testing",
        "cryptography",
        "firewall",
        "cybersecurity",
        "linux",
        "siem",
        "malware analysis",
        "incident response",
        "security auditing"
    ],

    mobile: [

        "flutter",
        "react native",
        "android",
        "ios",
        "kotlin",
        "swift",
        "mobile development",
        "firebase",
        "api integration"
    ],

    softskills: [

        "communication",
        "leadership",
        "problem solving",
        "teamwork",
        "presentation",
        "adaptability",
        "time management",
        "critical thinking",
        "creativity",
        "collaboration"
    ]
};

// Upload Resume
document.getElementById("resumeFile").addEventListener("change", async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    document.getElementById("resumeStatus").innerHTML =
        "Scanning Resume...";

    const reader = new FileReader();

    reader.onload = async function () {

        try {

            const typedarray = new Uint8Array(this.result);

            const pdf =
                await pdfjsLib.getDocument(typedarray).promise;

            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {

                const page = await pdf.getPage(i);

                const content = await page.getTextContent();

                fullText += content.items
                    .map(item => item.str)
                    .join(" ");
            }

            extractedResumeText = fullText.toLowerCase();

            document.getElementById("resumeStatus").innerHTML =
                "✅ Resume scanned successfully";

        } catch (err) {

            console.log(err);

            document.getElementById("resumeStatus").innerHTML =
                "❌ Error reading PDF";
        }
    };

    reader.readAsArrayBuffer(file);
});

// Main Analysis
function analyzeResume() {

    const roleInput =
        document.getElementById("roleInput")
        .value
        .toLowerCase()
        .trim();

    if (!roleInput || !extractedResumeText) {

        alert("Upload resume and enter target role");

        return;
    }

    const btn =
        document.getElementById("analyzeBtn");

    btn.disabled = true;

    btn.innerHTML = "Analyzing Resume...";

    setTimeout(() => {

        let targetSkills = [];

        // Dynamic Role Detection

        if (
            roleInput.includes("frontend") ||
            roleInput.includes("web")
        ) {

            targetSkills = [

                ...skillDatabase.frontend,
                ...skillDatabase.devops
            ];
        }

        else if (
            roleInput.includes("backend")
        ) {

            targetSkills = [

                ...skillDatabase.backend,
                ...skillDatabase.devops
            ];
        }

        else if (
            roleInput.includes("full stack")
        ) {

            targetSkills = [

                ...skillDatabase.frontend,
                ...skillDatabase.backend,
                ...skillDatabase.devops
            ];
        }

        else if (
            roleInput.includes("data") ||
            roleInput.includes("analyst")
        ) {

            targetSkills = [

                ...skillDatabase.data
            ];
        }

        else if (
            roleInput.includes("marketing")
        ) {

            targetSkills = [

                ...skillDatabase.marketing
            ];
        }

        else if (
            roleInput.includes("hr")
        ) {

            targetSkills = [

                ...skillDatabase.hr
            ];
        }

        else if (
            roleInput.includes("finance")
        ) {

            targetSkills = [

                ...skillDatabase.finance
            ];
        }

        else if (
            roleInput.includes("cyber")
        ) {

            targetSkills = [

                ...skillDatabase.cybersecurity
            ];
        }

        else if (
            roleInput.includes("mobile")
        ) {

            targetSkills = [

                ...skillDatabase.mobile
            ];
        }

        else {

            targetSkills = [

                ...skillDatabase.softskills
            ];
        }

        // Match Skills
        let matchedSkills = [];
        let missingSkills = [];

        targetSkills.forEach(skill => {

            if (
                extractedResumeText.includes(skill)
            ) {

                matchedSkills.push(skill);

            } else {

                missingSkills.push(skill);
            }
        });

        // ATS Score
        let score = Math.round(

            (matchedSkills.length /
            targetSkills.length) * 100
        );

        if (score > 100) score = 100;

        // Visibility
        let visibility = "Low";

        if (score >= 80) {

            visibility = "Excellent";

        } else if (score >= 60) {

            visibility = "Good";
        }

        // Resume Strength
        let strength = "Weak";

        if (score >= 80) {

            strength = "Strong";

        } else if (score >= 60) {

            strength = "Average";
        }

        // Recommendations
        let recommendations = [];

        if (
            missingSkills.includes("react")
        ) {

            recommendations.push(
                "React is highly demanded in modern frontend roles."
            );
        }

        if (
            missingSkills.includes("docker")
        ) {

            recommendations.push(
                "Adding Docker improves deployment and DevOps opportunities."
            );
        }

        if (
            missingSkills.includes("aws")
        ) {

            recommendations.push(
                "Cloud technologies like AWS improve ATS ranking."
            );
        }

        if (
            !extractedResumeText.includes("github")
        ) {

            recommendations.push(
                "Add GitHub profile links to improve recruiter trust."
            );
        }

        if (
            !extractedResumeText.includes("linkedin")
        ) {

            recommendations.push(
                "Add LinkedIn profile for better professional visibility."
            );
        }

        if (
            recommendations.length === 0
        ) {

            recommendations.push(
                "Your resume is highly optimized for this role."
            );
        }

        // Update UI

        document.getElementById("finalScore").innerHTML =
            score + "%";

        document.getElementById("visibilityScore").innerHTML =
            visibility;

        document.getElementById("resumeStrength").innerHTML =
            strength;

        document.getElementById("keywordScore").innerHTML =
            score + "%";

        // Missing Skills
        document.getElementById("missingList").innerHTML =

            missingSkills.map(skill =>

                `
                <li class="bg-red-500/20 text-red-300 px-4 py-2 rounded-full border border-red-500/30">
                    ${skill}
                </li>
                `

            ).join("");

        // Matched Skills
        document.getElementById("matchedList").innerHTML =

            matchedSkills.map(skill =>

                `
                <li class="bg-green-500/20 text-green-300 px-4 py-2 rounded-full border border-green-500/30">
                    ${skill}
                </li>
                `

            ).join("");

        // Recommendations
        document.getElementById("aiSuggestions").innerHTML =

            recommendations.map(item =>

                `
                <div class="bg-slate-900/60 border border-white/10 rounded-2xl p-5">

                    <div class="flex gap-4 items-start">

                        <div class="text-cyan-400 text-2xl">
                            ✨
                        </div>

                        <p class="text-slate-300 leading-relaxed">
                            ${item}
                        </p>

                    </div>

                </div>
                `

            ).join("");

        // Show Results
        document.getElementById("resultArea")
            .classList.remove("hidden");

        // Chart
        const ctx =
            document.getElementById("skillsChart");

        new Chart(ctx, {

            type: "doughnut",

            data: {

                labels: ["Matched", "Missing"],

                datasets: [{

                    data: [
                        matchedSkills.length,
                        missingSkills.length
                    ],

                    backgroundColor: [
                        "#22c55e",
                        "#ef4444"
                    ],

                    borderWidth: 0
                }]
            }
        });

        btn.innerHTML =
            "Analyze Resume";

        btn.disabled = false;

    }, 1800);
}