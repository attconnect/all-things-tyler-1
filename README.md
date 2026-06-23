# All Things Tyler – AI Business Concierge
### Version 1.0

A hosted, embeddable AI-powered business directory search tool for Tyler, TX and East Texas.

---

## How It Works

1. A visitor types a search (keyword or natural language) into the widget
2. The AI interprets their intent and matches it to businesses in your directory
3. Results appear ranked by relevance and membership tier (no tiers shown publicly)
4. If no match is found, the visitor sees a join-the-directory invitation

---

## Hosting: Netlify (Recommended)

**Why Netlify:**
- Free tier handles your traffic with ease
- One-click GitHub deploy — no servers to manage
- Built-in support for serverless functions (your AI search backend)
- Easy environment variable management (for your API key)
- HTTPS and CDN included automatically

**Cost:** Free for this use case.

---

## Deployment Steps (one-time setup)

### Step 1 — Get your Anthropic API key
1. Go to https://console.anthropic.com
2. Sign in or create an account
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)

### Step 2 — Put this project on GitHub
1. Go to https://github.com and create a free account if you don't have one
2. Click **+** → **New repository** → name it `all-things-tyler`
3. Upload all files from this folder to the repository

### Step 3 — Connect to Netlify
1. Go to https://netlify.com and sign in with your GitHub account
2. Click **Add new site** → **Import an existing project** → **GitHub**
3. Select your `all-things-tyler` repository
4. Set **Publish directory** to `widget`
5. Set **Functions directory** to `api`
6. Click **Deploy site**

### Step 4 — Add your API key
1. In Netlify, go to **Site settings** → **Environment variables**
2. Click **Add a variable**
3. Key: `ANTHROPIC_API_KEY`
4. Value: paste your key from Step 1
5. Click **Save**
6. Go to **Deploys** → **Trigger deploy** → **Deploy site**

### Step 5 — Embed into Squarespace
1. In your Netlify dashboard, find your site URL (e.g. `https://allthingstyler-concierge.netlify.app`)
2. In Squarespace, add a **Code Block** or **Embed Block** to any page
3. Paste this embed code (replace the URL with your Netlify URL):

```html
<iframe
  src="https://YOUR-SITE.netlify.app"
  width="100%"
  height="700"
  frameborder="0"
  style="border-radius:12px; overflow:hidden;"
  title="All Things Tyler Business Directory"
  loading="lazy">
</iframe>
```

4. Adjust `height="700"` as needed for your page layout.

---

## Updating Your Directory (When You Get New Members)

When you export a new CSV from MembershipWorks:

1. Run the CSV processor script:
   ```
   python3 scripts/process-csv.py path/to/your-new-export.csv
   ```
2. This overwrites `data/businesses.json` with fresh data
3. Commit and push to GitHub — Netlify auto-deploys within ~30 seconds

No code changes needed. The directory updates automatically.

---

## Project Structure

```
all-things-tyler/
├── data/
│   └── businesses.json       ← Pre-processed directory (source of truth)
├── api/
│   └── search.js             ← AI search backend (Netlify serverless function)
├── widget/
│   └── index.html            ← The embeddable front-end widget
├── scripts/
│   └── process-csv.py        ← Run when you get a new MembershipWorks export
├── netlify.toml              ← Netlify configuration
├── package.json
└── README.md
```

---

## Business Display Rules (Summary)

| Field           | Bronze PLUS+ | Bronze |
|-----------------|:------------:|:------:|
| Business name   | ✅           | ✅     |
| Phone           | ✅           | ✅     |
| Website/Facebook| ✅           | ✅     |
| Photo/logo      | ✅           | ✅     |
| Rating          | ✅           | ❌     |
| Description     | ✅           | ❌     |

**Ranking order:**
1. Exact match → Good match → Possible match
2. PLUS+ before Bronze within the same relevance group
3. Randomized within each group (no business is always first)

Membership tier names are **never shown publicly.**

---

## Future Versions (Planned)

- [ ] Category browse / tag filtering
- [ ] Mobile app API (same `/api/search` endpoint, zero changes needed)
- [ ] Admin panel to manage listings without CSV exports
- [ ] Analytics: most-searched terms

---

## Support

Contact your web developer or reach out to Anthropic support at https://support.anthropic.com for API issues.
