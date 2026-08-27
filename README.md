# Loom PLM — Frontend + Backend

Rendu separate folder:
- `frontend/`  → React (Vite) app — VSCode la இதை edit pannalam
- `backend/`   → Node.js + Express API — idha vera VSCode window la (illa same window
                 la vera terminal la) edit pannalam

## 1. First time setup

```bash
cd backend
npm install
cp .env.example .env
# .env file open pannunga, ANTHROPIC_API_KEY = ungaloda real key vachunga
```

```bash
cd frontend
npm install
```

## 2. Run pannuvadhu (rendu terminal venum)

**Terminal 1 — backend:**
```bash
cd backend
npm run dev
```
→ http://localhost:5000 la run aagum

**Terminal 2 — frontend:**
```bash
cd frontend
npm run dev
```
→ http://localhost:5173 la browser open pannunga, app run aagum

Frontend automatic ah backend ku connect aagum (vite.config.js la proxy set panniyachu).

## 3. VSCode la eppadi open pannuvadhu

Unga previous project maadhiri:
- VSCode open pannunga → File > Open Folder → `loom-plm` (mothamum) select pannunga.
  Adhula frontend/ and backend/ rendu folder um oru window la kaanum, side panel la.
- Illati, rendaiyum separate ah open pannanum-nu nenachaal: rendu VSCode window
  open pannunga — oru window la `frontend` folder mattum, innoru window la
  `backend` folder mattum open pannunga.

## 4. Structure

```
loom-plm/
├── frontend/
│   ├── src/
│   │   ├── App.jsx        ← ungaloda முழு dashboard UI (idhையே edit pannுவீங்க)
│   │   ├── main.jsx        ← entry point
│   │   └── storage.js      ← window.storage-a backend API kூடa connect pannudhu
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── backend/
    ├── server.js            ← Express entry point
    ├── routes/
    │   ├── storage.js       ← docs/chat/highlights save & fetch (JSON file db)
    │   └── claude.js        ← "Auto-extract highlights" AI feature (Anthropic API proxy)
    ├── data/storage.json    ← simple file-based DB (production ku real DB maathikalam)
    └── .env                 ← ungaloda ANTHROPIC_API_KEY (idha git la commit pannadhinga!)
```

## 5. Why backend needed?

Original artifact-la `window.storage` nu oru built-in save/load system irundhuchu,
adhே maari `fetch("https://api.anthropic.com/v1/messages")` nu direct AI call kudukurathukum
built-in support irundhuchu (API key automatic ah handle aaguthu). Andha rendும் Claude.ai
uள்ளே mattும் work aagும். Idha vera edhavadhu server la run panna, andha rendaiyum
நீங்களே provide pannanum — adhுக்காக தான் backend:
- Data save pannuறதுக்கு (`/api/storage/*`)
- AI call pannுறதுக்கு, API key-a browser-la expose pannாமல் (`/api/claude/*`)

## 6. Next steps / production ku vaikkanumna

- `backend/data/storage.json` ku pathila real database (Postgres, MongoDB, etc.) mathanum
- Authentication (login) add pannanum — ippo edhavadhu role select pannalam nu simple ah irukku
- File upload feature (docs) ku, real file storage (S3, etc.) venum — ippo file name mattum save aagுthu
