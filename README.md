# 🛡️ Fraud Awareness Assistant

**An AI-powered tool that helps older adults identify suspicious messages and potential scams.**

Developed by the [Center for Advanced Communications Policy (CACP)](https://cacp.gatech.edu) at **Georgia Institute of Technology** as part of ongoing research on AI, accessibility, and fraud awareness.

---

## 🔗 Live Tool

👉 **[https://marjanbaghdadi-gatech.github.io/fraud-awareness-tool-v2](https://marjanbaghdadi-gatech.github.io/fraud-awareness-assistant)**

---

## 📋 Overview

The Fraud Awareness Assistant allows users to paste a suspicious text message or upload a screenshot. The tool analyzes the content using a multi-stage AI pipeline and returns a plain-language risk assessment — including what warning signs were detected and what the user should do next.

The tool is specifically designed for **adults aged 60 and older**, with large fonts, plain language, and an accessible layout optimized for both desktop and mobile screens.

### Key Features

- **Text & image input** — paste a message or upload a screenshot
- **Multi-stage analysis** — rules engine, behavioral AI, LLM classification, and phone number lookup run in parallel
- **Plain-language results** — written at a 6th grade reading level, calm and non-alarming tone
- **Risk level labels** — results shown as Harmless / Likely Harmless / Unclear / Risky / High Risk (no abstract scores shown to users)
- **Tailored next steps** — guidance specific to the detected scam type
- **Privacy first** — no messages or images are stored or shared
- **Fully responsive** — works on phone, tablet, and desktop

---

## 🔬 Research Context

This tool is part of a research project investigating how AI-powered fraud detection tools can be made accessible and effective for older adults — a demographic disproportionately targeted by financial scams. The project examines:

- Human-AI interaction in fraud detection contexts
- Accessibility of AI tools for aging populations
- The role of plain-language AI explanations in building user trust and awareness

**If you are a researcher or study participant, please complete our feedback survey after using the tool:**

👉 **[Take the Feedback Survey](https://gatech.co1.qualtrics.com/jfe/form/SV_5d5TMD7vuG60mBE)**

---

## ⚙️ How It Works

The tool sends submitted content to a backend n8n automation pipeline hosted separately. The pipeline processes input through 7 stages:

```
Input (text or image)
    │
    ▼
Stage 1 — Entry & Input Handling
    Webhook → Image check → Text extraction → JSON normalization
    │
    ▼
Stage 2 — Fraud Signal Extraction & Pre-check
    URL analysis · Copy-paste trick detection · Short-circuit for benign messages
    │
    ├──────────────────────┬──────────────────────┬────────────────────┐
    ▼                      ▼                      ▼                    ▼
Stage 3                Stage 4               Stage 5             Stage 6
Rules Engine          Behavioral AI         LLM Classifier      Phone Lookup
15 signal categories  GPT-4.1 narrative     GPT-4.1 synthesis   SkipCalls API
+ combo bonuses       + tactics analysis    + scam type ID      community reports
    │                      │                      │                    │
    └──────────────────────┴──────────────────────┴────────────────────┘
                                    │
                                    ▼
                           Stage 7 — Final Scoring
                           Pure JavaScript · 10 deterministic steps
                           No AI in final scoring step
                                    │
                                    ▼
                           Structured JSON response
```

### Backend Stack

| Component | Technology |
|---|---|
| Automation pipeline | [n8n](https://n8n.io) |
| LLM (classification + behavioral analysis) | GPT-4.1 |
| Phone reputation lookup | [SkipCalls API](https://skipcalls.com) |
| Hosting | n8n Cloud |

### Signal Detection

The rules engine checks for **15 signal categories** including urgency language, payment requests, gift card demands, impersonation of known brands (USPS, IRS, Amazon, Apple), suspicious domains, and psychological manipulation tactics. Dangerous signal combinations trigger additional combo bonuses.

### Risk Level Reference

| Score | Label | Meaning |
|---|---|---|
| 0–15 | Harmless | No meaningful scam indicators |
| 16–29 | Likely Harmless | Minor signals, low concern |
| 30–59 | Unclear | Some suspicious elements — verify before acting |
| 60–74 | Risky | Clear scam pattern — do not click links |
| 75–100 | High Risk | Strong indicators of a known scam type |

> **Note:** Numeric scores are used internally for decision-making only. The tool displays only the plain-language risk level label to users.

---

## 🗂️ Repository Structure

```
fraud-awareness-tool-v2/
├── index.html          # Main tool page
├── scams.html          # Latest scam trends page
├── scams.json          # Scam trend data
├── styles.css          # All styling
├── script.js           # Tool logic, API calls, result rendering
└── README.md           # This file
```

---

## 🚀 Running Locally

This is a static front-end — no build step required.

```bash
git clone https://github.com/marjanbaghdadi-gatech/fraud-awareness-tool-v2
cd fraud-awareness-tool-v2
```

Then open `index.html` in your browser. The tool connects to a hosted n8n backend at runtime — no local backend setup is needed.

> **Note:** The backend webhook URL is hardcoded in `script.js`. The backend is hosted on n8n Cloud and is not included in this repository.

---

## 🔒 Privacy

- No user messages, images, or personal data are stored on any server
- All content submitted to the tool is processed in real time and immediately discarded
- No account or login is required
- No cookies or tracking are used

---

## 📬 Contact

**Marjan Baghdadi**
Center for Advanced Communications Policy
Georgia Institute of Technology
📧 [marjan.baghdadi@gatech.edu](mailto:marjan.baghdadi@gatech.edu)

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

## ⚠️ Disclaimer

This tool is intended for **educational and research purposes only**. It is not a substitute for professional legal or financial advice. Results are probabilistic and may not be accurate in all cases. When in doubt, verify through official sources.
