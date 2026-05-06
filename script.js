const WEBHOOK_URL = "https://mbaghdadi6g.app.n8n.cloud/webhook/fraud-check";

const textInput       = document.getElementById("textInput");
const charCount       = document.getElementById("charCount");
const imageInput      = document.getElementById("imageInput");
const dropZone        = document.getElementById("dropZone");
const fileName        = document.getElementById("fileName");
const imagePreviewWrap = document.getElementById("imagePreviewWrap");
const imagePreview     = document.getElementById("imagePreview");
const clearImageBtn    = document.getElementById("clearImageBtn");
const analyzeTextBtn  = document.getElementById("analyzeTextBtn");
const analyzeImageBtn = document.getElementById("analyzeImageBtn");

const loadingPanel    = document.getElementById("loadingPanel");
const loadingHeadline = document.getElementById("loadingHeadline");
const lstep1          = document.getElementById("lstep1");
const lstep2          = document.getElementById("lstep2");
const lstep3          = document.getElementById("lstep3");

const resultsPanel        = document.getElementById("resultsPanel");
const riskScore           = document.getElementById("riskScore");
const riskBadge           = document.getElementById("riskBadge");
const gaugeNeedle         = document.getElementById("gaugeNeedle");
const redFlagsList        = document.getElementById("redFlagsList");
const nextStepsList       = document.getElementById("nextStepsList");
const flagCount           = document.getElementById("flagCount");
const viewFullBtn         = document.getElementById("viewFullBtn");
const fullAnalysis        = document.getElementById("fullAnalysis");
const explanationText     = document.getElementById("explanationText");
const plainExplanationText = document.getElementById("plainExplanationText");
const disclaimerText      = document.getElementById("disclaimerText");

const explanationKey = "How this tool reached its conclusion about the level of risk involved";

let selectedImageFile = null;
let stepTimer = null;

// ── Char counter ─────────────────────────────────────
textInput.addEventListener("input", () => {
  charCount.textContent = `${textInput.value.length} / 3000`;
});

// ── Image selection ──────────────────────────────────
imageInput.addEventListener("change", () => {
  selectedImageFile = imageInput.files[0] || null;
  showImagePreview(selectedImageFile);
});

dropZone.addEventListener("click", () => {
  if (!selectedImageFile) imageInput.click();
});

dropZone.addEventListener("keydown", e => {
  if ((e.key === "Enter" || e.key === " ") && !selectedImageFile) imageInput.click();
});

["dragenter", "dragover"].forEach(e => {
  dropZone.addEventListener(e, ev => { ev.preventDefault(); dropZone.classList.add("drag-over"); });
});
["dragleave", "drop"].forEach(e => {
  dropZone.addEventListener(e, ev => { ev.preventDefault(); dropZone.classList.remove("drag-over"); });
});

dropZone.addEventListener("drop", event => {
  selectedImageFile = event.dataTransfer.files[0];
  if (!selectedImageFile) return;
  if (!selectedImageFile.type.startsWith("image/")) {
    alert("Please upload an image file.");
    selectedImageFile = null;
    return;
  }
  showImagePreview(selectedImageFile);
});

window.addEventListener("paste", event => {
  for (const item of event.clipboardData?.items || []) {
    if (item.type.startsWith("image/")) {
      selectedImageFile = item.getAsFile();
      showImagePreview(selectedImageFile);
      break;
    }
  }
});

// ── Image preview ─────────────────────────────────────
function showImagePreview(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  imagePreview.src = url;
  imagePreview.onload = () => URL.revokeObjectURL(url);
  fileName.textContent = file.name || "Pasted image";
  imagePreviewWrap.classList.remove("hidden");
  dropZone.style.display = "none";
}

function clearImage() {
  selectedImageFile = null;
  imagePreview.src = "";
  fileName.textContent = "";
  imagePreviewWrap.classList.add("hidden");
  dropZone.style.display = "";
  imageInput.value = "";
}

// ── Clear image ───────────────────────────────────────
clearImageBtn.addEventListener("click", clearImage);

// ── Analyze text ──────────────────────────────────────
analyzeTextBtn.addEventListener("click", async () => {
  const rawText = textInput.value.trim();
  if (!rawText) { alert("Please paste a suspicious message first."); return; }

  showLoading("Analyzing your message…");
  setLoading(analyzeTextBtn, true);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw_text: rawText })
    });
    if (!response.ok) throw new Error("The workflow did not return a successful response.");
    renderResults(await response.json());
  } catch (error) {
    showError(error);
  } finally {
    hideLoading();
    setLoading(analyzeTextBtn, false, "Check this message");
  }
});

// ── Analyze image ─────────────────────────────────────
analyzeImageBtn.addEventListener("click", async () => {
  if (!selectedImageFile) { alert("Please upload or paste a screenshot first."); return; }
  if (selectedImageFile.size > 10 * 1024 * 1024) { alert("Please upload an image smaller than 10 MB."); return; }

  showLoading("Reading your screenshot…");
  setLoading(analyzeImageBtn, true);

  const formData = new FormData();
  formData.append("image", selectedImageFile);

  try {
    const response = await fetch(WEBHOOK_URL, { method: "POST", body: formData });
    if (!response.ok) throw new Error("The workflow did not return a successful response.");
    renderResults(await response.json());
  } catch (error) {
    showError(error);
  } finally {
    hideLoading();
    setLoading(analyzeImageBtn, false, "Check this image");
  }
});

// ── Toggle full analysis ──────────────────────────────
viewFullBtn.addEventListener("click", () => {
  const isHidden = fullAnalysis.classList.toggle("hidden");
  viewFullBtn.setAttribute("aria-expanded", String(!isHidden));
  viewFullBtn.textContent = isHidden ? "Full explanation ↓" : "Hide explanation ↑";
});

// ── Loading panel ─────────────────────────────────────
function showLoading(headline) {
  loadingHeadline.textContent = headline;
  resultsPanel.classList.add("hidden");
  loadingPanel.classList.remove("hidden");
  loadingPanel.scrollIntoView({ behavior: "smooth", block: "start" });

  // Reset steps
  [lstep1, lstep2, lstep3].forEach(s => s.classList.remove("active", "done"));

  // Sequence: step 1 active immediately, step 2 after ~4s, step 3 after ~9s
  lstep1.classList.add("active");
  stepTimer = setTimeout(() => {
    lstep1.classList.replace("active", "done");
    lstep2.classList.add("active");
  }, 4000);
  stepTimer = setTimeout(() => {
    lstep2.classList.replace("active", "done");
    lstep3.classList.add("active");
  }, 9000);
}

function hideLoading() {
  clearTimeout(stepTimer);
  [lstep1, lstep2, lstep3].forEach(s => s.classList.remove("active"));
  loadingPanel.classList.add("hidden");
}

// ── Render results ────────────────────────────────────
function renderResults(data) {
  const score     = Math.max(0, Math.min(Number(data.risk_score ?? 0), 100));
  const level     = normalizeRiskLevel(data.risk_level, score);
  const cls       = riskClass(level);

  riskScore.textContent = score;
  riskBadge.textContent = level === "likely risky" ? "⚠ High Risk" : titleCase(level);
  riskBadge.className   = `risk-badge ${cls}`;

  gaugeNeedle.style.transform = `rotate(${-180 + score * 1.8}deg)`;


  renderList(redFlagsList,  data.red_flags,               "No major red flags detected.");
  renderList(nextStepsList, data.recommended_next_steps,  "Verify through an official source.");

  flagCount.textContent = Array.isArray(data.red_flags) ? data.red_flags.length : 0;

  explanationText.textContent =
    data[explanationKey] || "The tool checked message patterns and common scam warning signs.";

  plainExplanationText.textContent =
    data.plain_language_explanation || "Use this result to help decide what to do next.";

  disclaimerText.textContent =
    data.disclaimer || "This is an educational assessment. When in doubt, verify through an official source.";

  resultsPanel.classList.remove("hidden");
  resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderList(container, items, fallback) {
  container.innerHTML = "";
  (Array.isArray(items) && items.length ? items : [fallback]).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    container.appendChild(li);
  });
}

// ── Error state ───────────────────────────────────────
function showError(error) {
  riskScore.textContent    = "--";
  riskBadge.textContent    = "Error";
  riskBadge.className      = "risk-badge medium";
  redFlagsList.innerHTML   = "";
  nextStepsList.innerHTML  = "";
  flagCount.textContent    = "0";
  explanationText.textContent     = error.message;
  plainExplanationText.textContent = "";
  disclaimerText.textContent       = "";
  resultsPanel.classList.remove("hidden");
  resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Helpers ───────────────────────────────────────────
function setLoading(button, isLoading, label) {
  button.disabled = isLoading;
  if (isLoading) {
    button.classList.add("loading");
  } else {
    button.classList.remove("loading");
    button.textContent = label;
  }
}

function normalizeRiskLevel(level, score) {
  const c = String(level || "").toLowerCase();
  if (c.includes("harmless"))               return "likely harmless";
  if (c.includes("risky") || c.includes("high")) return "likely risky";
  if (c.includes("unclear") || c.includes("medium")) return "unclear";
  if (score >= 60) return "likely risky";
  if (score >= 30) return "unclear";
  return "likely harmless";
}

function riskClass(level) {
  if (level === "likely harmless") return "low";
  if (level === "unclear")         return "medium";
  return "high";
}

function titleCase(text) {
  return String(text).split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
