# Fraud Witness

A static webpage + n8n pipeline that aggregates real fraud victim stories from YouTube, Reddit, news RSS feeds and the FTC — storing only metadata and links, never the content itself.

## Repo structure

```
/
├── index.html              # Main webpage
├── style.css               # Styles
├── app.js                  # Frontend logic
├── data/
│   └── stories.json        # Auto-updated by n8n pipeline
└── fraud-pipeline.workflow.json   # Import into n8n
```

## Setup

### 1. GitHub repo
- Fork or create a new repo with this structure
- Enable **GitHub Pages** (Settings → Pages → Deploy from branch `main`, folder `/root`)
- Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO`

### 2. GitHub Personal Access Token
- Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained
- Scope: **Contents** (read + write) on this repo only
- Copy the token

### 3. n8n setup
- Import `fraud-pipeline.workflow.json` into n8n (Workflows → Import)
- In the **Read stories.json** and **Write stories.json** nodes, replace:
  - `YOUR_USERNAME` with your GitHub username
  - `YOUR_REPO` with your repository name
- Create an **HTTP Header Auth** credential:
  - Name: `GitHub Token`
  - Header name: `Authorization`
  - Header value: `token YOUR_PERSONAL_ACCESS_TOKEN`
- Assign that credential to both GitHub HTTP nodes
- In the **Claude Classify** node, connect your Anthropic API credentials

### 4. Activate
- Toggle the workflow to **Active** — it runs every day at 8am
- Or click **Execute workflow** to run immediately

## Customising

**Add more sources**: Duplicate one of the HTTP source nodes (YouTube RSS, Reddit, FTC) and point it at a new URL. The Parse Sources node handles RSS/XML and Reddit JSON automatically.

**Change the schedule**: Click the **Daily Schedule** node and adjust the cron expression.

**Change fraud categories**: Edit the list in the Claude Classify node prompt, then update `CATEGORY_LABELS` in `app.js`.

**Point to a different JSON file**: Edit `STORIES_URL` at the top of `app.js`.

## Data format

Each record in `data/stories.json`:

```json
{
  "id": "youtube-abc123",
  "title": "Story title",
  "source_url": "https://...",
  "thumbnail_url": "https://...",
  "media_type": "video | article | audio",
  "source_platform": "youtube | reddit | news | ftc | podcast",
  "fraud_category": "romance_scam | investment_fraud | ...",
  "summary": "One sentence summary",
  "confidence": "high | medium | low",
  "date_found": "2026-05-19"
}
```
