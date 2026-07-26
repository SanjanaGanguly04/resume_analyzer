// ---------------------------------------------------------------
// PDF.js setup
// ---------------------------------------------------------------
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

let rawResumeText = "";
let extractedResumeText = "";
let skillsChartInstance = null;
let domainChartInstance = null;

// ---------------------------------------------------------------
// Skill taxonomy (used for domain coverage + role fallback + JD scan)
// ---------------------------------------------------------------
const skillDatabase = {
  frontend: ["html","css","javascript","react","next.js","tailwind","bootstrap","typescript","redux","responsive design","api","figma","ui/ux","sass","webpack","vite","jquery","accessibility"],
  backend: ["node.js","express","mongodb","mysql","firebase","rest api","authentication","jwt","sql","postgresql","django","flask","spring boot","microservices","graphql","redis"],
  data: ["python","pandas","numpy","machine learning","data analysis","excel","tableau","statistics","power bi","data visualization","deep learning","tensorflow","scikit-learn","nlp","data cleaning","analytics"],
  devops: ["docker","aws","github","git","deployment","ci/cd","kubernetes","linux","cloud computing","azure","jenkins","networking"],
  marketing: ["seo","digital marketing","social media","content marketing","branding","google ads","meta ads","email marketing","copywriting","market research","consumer behavior","lead generation"],
  hr: ["recruitment","employee engagement","hiring","onboarding","talent acquisition","payroll","training","conflict resolution","team management","human resources"],
  finance: ["financial analysis","accounting","budgeting","forecasting","auditing","taxation","financial modeling","investment","banking","risk analysis","economics"],
  cybersecurity: ["network security","ethical hacking","penetration testing","cryptography","firewall","cybersecurity","siem","malware analysis","incident response","security auditing"],
  mobile: ["flutter","react native","android","ios","kotlin","swift","mobile development","api integration"],
};

const softSkills = ["communication","leadership","problem solving","teamwork","presentation","adaptability","time management","critical thinking","creativity","collaboration"];

const masterSkillList = Array.from(new Set(Object.values(skillDatabase).flat()));

const roleKeywordMap = [
  { test: r => r.includes("frontend") || r.includes("web"), skills: [...skillDatabase.frontend, ...skillDatabase.devops] },
  { test: r => r.includes("full stack"), skills: [...skillDatabase.frontend, ...skillDatabase.backend, ...skillDatabase.devops] },
  { test: r => r.includes("backend"), skills: [...skillDatabase.backend, ...skillDatabase.devops] },
  { test: r => r.includes("data") || r.includes("analyst"), skills: skillDatabase.data },
  { test: r => r.includes("marketing"), skills: skillDatabase.marketing },
  { test: r => r.includes("hr") || r.includes("human resources"), skills: skillDatabase.hr },
  { test: r => r.includes("finance"), skills: skillDatabase.finance },
  { test: r => r.includes("cyber") || r.includes("security"), skills: skillDatabase.cybersecurity },
  { test: r => r.includes("mobile") || r.includes("android") || r.includes("ios"), skills: skillDatabase.mobile },
];

function getRoleSkills(roleInput) {
  const match = roleKeywordMap.find(r => r.test(roleInput));
  return match ? match.skills : softSkills;
}

function extractSkillsFromText(text, list) {
  return list.filter(skill => text.includes(skill));
}

// ---------------------------------------------------------------
// Section / structure checks
// ---------------------------------------------------------------
const sectionChecks = [
  { key: "contact", label: "Contact info", test: t => /[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(t), tip: "Make sure a clear email address (and ideally a phone number) sits near the top of the document." },
  { key: "summary", label: "Summary / objective", test: t => /\b(summary|objective|profile)\b/i.test(t), tip: "Add a 2–3 line summary at the top naming your target role and strongest qualification." },
  { key: "experience", label: "Work experience", test: t => /\b(experience|employment history|work history)\b/i.test(t), tip: "Add a clearly labeled experience section with company, dates, and outcome-focused bullets." },
  { key: "education", label: "Education", test: t => /\b(education|academic background)\b/i.test(t), tip: "Add an education section with degree, institution, and year." },
  { key: "skills", label: "Skills", test: t => /\b(skills|technical skills|core competencies)\b/i.test(t), tip: "Add a dedicated skills section — ATS parsers look for this heading specifically." },
  { key: "projects", label: "Projects", test: t => /\b(projects|portfolio)\b/i.test(t), tip: "A projects section helps offset limited work history with concrete evidence." },
  { key: "certifications", label: "Certifications", test: t => /\b(certificat|licen[cs]e)/i.test(t), tip: "List relevant certifications with issuing body and year, if you have any." },
];

// ---------------------------------------------------------------
// Upload handling (click + drag/drop)
// ---------------------------------------------------------------
const dropzone = document.getElementById("resumeFile");
const dropzoneLabel = document.getElementById("dropzone");
const statusEl = document.getElementById("resumeStatus");

dropzone.addEventListener("change", (e) => handleFile(e.target.files[0]));

["dragover", "dragenter"].forEach(evt =>
  dropzoneLabel.addEventListener(evt, (e) => { e.preventDefault(); dropzoneLabel.classList.add("scanning"); })
);
["dragleave", "drop"].forEach(evt =>
  dropzoneLabel.addEventListener(evt, (e) => { e.preventDefault(); if (evt === "dragleave") dropzoneLabel.classList.remove("scanning"); })
);
dropzoneLabel.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  if (!file) return;
  dropzoneLabel.classList.add("scanning");
  statusEl.className = "status-line";
  statusEl.innerHTML = "Reading PDF…";

  const reader = new FileReader();
  reader.onload = async function () {
    try {
      const typedarray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(" ") + "\n";
      }
      rawResumeText = fullText;
      extractedResumeText = fullText.toLowerCase();
      statusEl.className = "status-line ok";
      statusEl.innerHTML = `✓ Parsed ${pdf.numPages} page${pdf.numPages > 1 ? "s" : ""} — ${fullText.trim().split(/\s+/).length} words`;
    } catch (err) {
      console.error(err);
      statusEl.className = "status-line err";
      statusEl.innerHTML = "✗ Couldn't read that PDF — try re-exporting it and upload again";
    } finally {
      dropzoneLabel.classList.remove("scanning");
    }
  };
  reader.readAsArrayBuffer(file);
}

// ---------------------------------------------------------------
// Dial geometry — semicircle instrument gauge, 0 (left) to 100 (right)
// ---------------------------------------------------------------
const DIAL_CX = 120, DIAL_CY = 118;

function dialPoint(score, r) {
  const theta = 180 - (score / 100) * 180;
  const rad = theta * (Math.PI / 180);
  return {
    x: DIAL_CX + r * Math.cos(rad),
    y: DIAL_CY - r * Math.sin(rad),
  };
}

// Tick marks, drawn once for every .dial-ticks group present
function drawDialTicks() {
  document.querySelectorAll(".dial-ticks").forEach(group => {
    group.innerHTML = "";
    for (let s = 0; s <= 100; s += 10) {
      const major = s % 25 === 0;
      const p1 = dialPoint(s, 104);
      const p2 = dialPoint(s, major ? 118 : 111);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", p1.x.toFixed(2)); line.setAttribute("y1", p1.y.toFixed(2));
      line.setAttribute("x2", p2.x.toFixed(2)); line.setAttribute("y2", p2.y.toFixed(2));
      if (major) line.classList.add("major");
      group.appendChild(line);
    }
  });
}
drawDialTicks();

// ---------------------------------------------------------------
// Gauge animation — sweeps the needle and counts the number together
// ---------------------------------------------------------------
function animateGauge(score) {
  const needle = document.getElementById("gaugeNeedle");
  const numEl = document.getElementById("finalScore");
  const duration = 1300;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = score * eased;
    const tip = dialPoint(value, 100);
    needle.setAttribute("x2", tip.x.toFixed(2));
    needle.setAttribute("y2", tip.y.toFixed(2));
    numEl.textContent = Math.round(value);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------------
// Staged loading sequence
// ---------------------------------------------------------------
function runLoadingSequence(callback) {
  const loadingArea = document.getElementById("loadingArea");
  const steps = Array.from(document.querySelectorAll(".step"));
  loadingArea.classList.remove("hidden");
  steps.forEach(s => s.classList.remove("active", "done"));

  let i = 0;
  function next() {
    if (i > 0) steps[i - 1].classList.add("done");
    if (i >= steps.length) {
      loadingArea.classList.add("hidden");
      callback();
      return;
    }
    steps[i].classList.add("active");
    i++;
    setTimeout(next, 420);
  }
  next();
}

// ---------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------
function analyzeResume() {
  const roleInput = document.getElementById("roleInput").value.toLowerCase().trim();
  const jdInputRaw = document.getElementById("jdInput").value;
  const jdInput = jdInputRaw.toLowerCase().trim();

  if (!extractedResumeText) {
    alert("Upload a resume PDF first.");
    return;
  }
  if (!roleInput && !jdInput) {
    alert("Enter a target role or paste a job description.");
    return;
  }

  const btn = document.getElementById("analyzeBtn");
  btn.disabled = true;
  document.getElementById("resultArea").classList.add("hidden");

  runLoadingSequence(() => {
    const result = computeAnalysis(roleInput, jdInput);
    renderResults(result);
    btn.disabled = false;
    document.getElementById("resultArea").classList.remove("hidden");
    document.getElementById("resultArea").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function computeAnalysis(roleInput, jdInput) {
  const text = extractedResumeText;

  // --- target skills: role fallback ∪ JD-derived (this is what makes the scan job-specific) ---
  const roleSkills = getRoleSkills(roleInput || jdInput);
  const jdSkills = jdInput ? extractSkillsFromText(jdInput, masterSkillList) : [];
  const targetSkills = Array.from(new Set([...roleSkills, ...jdSkills]));

  const matchedSkills = targetSkills.filter(s => text.includes(s));
  const missingSkills = targetSkills.filter(s => !text.includes(s));

  // --- domain coverage (independent of target role) ---
  const domainCoverage = Object.entries(skillDatabase).map(([domain, list]) => {
    const found = list.filter(s => text.includes(s));
    return { domain, found: found.length, total: list.length, pct: Math.round((found.length / list.length) * 100) };
  });

  // --- structure check ---
  const sections = sectionChecks.map(s => ({ ...s, found: s.test(rawResumeText) }));
  const sectionsFound = sections.filter(s => s.found).length;
  const sectionScore = Math.round((sectionsFound / sections.length) * 100);

  // --- contact / links ---
  const emailMatch = rawResumeText.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  const phoneMatch = rawResumeText.match(/(\+?\d[\d\-\s()]{8,}\d)/);
  const hasLinkedIn = /linkedin\.com/i.test(rawResumeText);
  const hasGitHub = /github\.com/i.test(rawResumeText);

  // --- experience estimate ---
  const years = (rawResumeText.match(/\b(19|20)\d{2}\b/g) || []).map(Number);
  let experienceEstimate = "Not detected";
  if (years.length >= 2) {
    const span = Math.max(...years) - Math.min(...years);
    if (span > 0) experienceEstimate = `~${span} yr${span > 1 ? "s" : ""} (estimated)`;
  }

  // --- quantified impact ---
  const quantMatches = (rawResumeText.match(/\d+%|\$\s?\d[\d,]*|\b\d{2,}\+?\b/g) || []).length;
  const impactLevel = quantMatches >= 5 ? "Strong" : quantMatches >= 2 ? "Some" : "Low";

  // --- word count ---
  const wordCount = rawResumeText.trim().split(/\s+/).filter(Boolean).length;

  // --- score ---
  const skillScore = targetSkills.length ? Math.round((matchedSkills.length / targetSkills.length) * 100) : 0;
  const impactBonus = Math.min(quantMatches * 2, 10);
  let finalScore = Math.round(skillScore * 0.6 + sectionScore * 0.3 + impactBonus);
  finalScore = Math.max(0, Math.min(100, finalScore));

  const visibility = finalScore >= 80 ? "Excellent" : finalScore >= 60 ? "Good" : finalScore >= 40 ? "Fair" : "Low";
  const strength = finalScore >= 80 ? "Strong" : finalScore >= 60 ? "Average" : "Needs work";

  // --- recommendations ---
  const recommendations = [];

  sections.filter(s => !s.found).slice(0, 3).forEach(s => {
    recommendations.push({ tag: ["contact", "skills", "experience"].includes(s.key) ? "priority" : "improve", text: s.tip });
  });

  if (missingSkills.length) {
    const top = missingSkills.slice(0, 6).join(", ");
    recommendations.push({
      tag: matchedSkills.length / (targetSkills.length || 1) < 0.5 ? "priority" : "improve",
      text: `These skills show up in the target role or job description but weren't found in your resume: ${top}. Add the ones you genuinely have.`,
    });
  }

  if (quantMatches < 2) {
    recommendations.push({ tag: "improve", text: "Add numbers to your bullet points — percentages, dollar amounts, team size, or time saved — to show measurable impact." });
  }
  if (!hasLinkedIn) {
    recommendations.push({ tag: "improve", text: "Add a LinkedIn profile link near your contact details for recruiter visibility." });
  }
  if (!hasGitHub && (roleInput.match(/dev|engineer|frontend|backend|data|full stack|mobile|cyber/) || jdSkills.some(s => skillDatabase.frontend.includes(s) || skillDatabase.backend.includes(s) || skillDatabase.data.includes(s)))) {
    recommendations.push({ tag: "improve", text: "Add a GitHub (or portfolio) link — for technical roles this is often the first thing a recruiter checks." });
  }
  if (wordCount < 200) {
    recommendations.push({ tag: "improve", text: `Your resume is quite short (${wordCount} words). Expand on responsibilities and outcomes in your most relevant roles.` });
  } else if (wordCount > 1200) {
    recommendations.push({ tag: "improve", text: `Your resume runs long (${wordCount} words). Trim older or less relevant experience to keep it focused.` });
  }

  if (!recommendations.length) {
    recommendations.push({ tag: "good", text: "Strong, well-aligned resume for this target — no major gaps found." });
  }

  return {
    targetSkills, matchedSkills, missingSkills, domainCoverage, sections, sectionScore,
    emailMatch, phoneMatch, hasLinkedIn, hasGitHub, experienceEstimate, quantMatches, impactLevel,
    wordCount, finalScore, visibility, strength, recommendations,
    roleLabel: roleInput || "role inferred from job description",
  };
}

// ---------------------------------------------------------------
// Render
// ---------------------------------------------------------------
function renderResults(r) {
  animateGauge(r.finalScore);

  document.getElementById("visibilityScore").textContent = r.visibility;
  document.getElementById("resumeStrength").textContent = r.strength;
  document.getElementById("sectionScoreLabel").textContent = `${r.sectionScore}%`;
  document.getElementById("impactScoreLabel").textContent = r.impactLevel;

  // Summary grid
  const summaryData = [
    { label: "Email", value: r.emailMatch ? r.emailMatch[0] : "Not found" },
    { label: "Phone", value: r.phoneMatch ? r.phoneMatch[0].trim() : "Not found" },
    { label: "LinkedIn", value: r.hasLinkedIn ? "Linked" : "Not found" },
    { label: "GitHub / portfolio", value: r.hasGitHub ? "Linked" : "Not found" },
    { label: "Experience span", value: r.experienceEstimate },
    { label: "Word count", value: r.wordCount },
  ];
  document.getElementById("summaryGrid").innerHTML = summaryData.map(d =>
    `<div class="summary-item"><p>${d.label}</p><h4>${d.value}</h4></div>`
  ).join("");

  // Structure checklist
  document.getElementById("sectionChecklist").innerHTML = r.sections.map(s => `
    <div class="check-row ${s.found ? "found" : "missing"}">
      <span class="mark">${s.found ? "✓" : "✗"}</span>
      <span>${s.label}</span>
      ${s.found ? "" : `<span class="desc">${s.tip}</span>`}
    </div>
  `).join("");

  // Skill match sub + pills
  document.getElementById("skillMatchSub").textContent =
    `${r.matchedSkills.length} of ${r.targetSkills.length} target skills found, based on ${r.roleLabel}.`;
  document.getElementById("matchedList").innerHTML =
    r.matchedSkills.map(s => `<li class="pill matched">${s}</li>`).join("") || `<li class="pill missing">None yet</li>`;
  document.getElementById("missingList").innerHTML =
    r.missingSkills.map(s => `<li class="pill missing">${s}</li>`).join("") || `<li class="pill matched">Nothing missing 🎉</li>`;

  // Recommendations
  document.getElementById("aiSuggestions").innerHTML = r.recommendations.map(rec => `
    <div class="suggestion">
      <span class="tag ${rec.tag}">${rec.tag}</span>
      <p>${rec.text}</p>
    </div>
  `).join("");

  // Doughnut chart
  const ctx = document.getElementById("skillsChart");
  if (skillsChartInstance) skillsChartInstance.destroy();
  skillsChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Matched", "Missing"],
      datasets: [{
        data: [r.matchedSkills.length, r.missingSkills.length],
        backgroundColor: ["#7cffb2", "#ff6b5e"],
        borderWidth: 0,
      }],
    },
    options: {
      plugins: { legend: { labels: { color: "#e7efe9", font: { family: "IBM Plex Mono" } } } },
    },
  });

  // Domain coverage bar chart
  const dctx = document.getElementById("domainChart");
  if (domainChartInstance) domainChartInstance.destroy();
  domainChartInstance = new Chart(dctx, {
    type: "bar",
    data: {
      labels: r.domainCoverage.map(d => d.domain),
      datasets: [{
        label: "Coverage %",
        data: r.domainCoverage.map(d => d.pct),
        backgroundColor: "#5ec8ff",
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: "y",
      scales: {
        x: { min: 0, max: 100, ticks: { color: "#8ea79b" }, grid: { color: "#223129" } },
        y: { ticks: { color: "#e7efe9", font: { family: "IBM Plex Mono", size: 11 } }, grid: { display: false } },
      },
      plugins: { legend: { display: false } },
    },
  });
}