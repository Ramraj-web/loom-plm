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
# Fill in MONGODB_URI and ANTHROPIC_API_KEY in backend/.env
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
│   │   ├── App.jsx        ← application shell and route switcher
│   │   ├── api.js         ← REST API client
│   │   ├── components/CrudModule.jsx ← reusable add/edit/delete UI
│   │   └── modules/domainModules.jsx  ← domain-specific module definitions
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── backend/
    ├── server.js            ← Express entry point
    ├── routes/
    │   ├── storage.js       ← legacy key/value storage compatibility API
    │   ├── resources.js     ← CRUD routes for all business resources
    │   └── seed.js          ← server-side development seed data
    │   └── claude.js        ← "Auto-extract highlights" AI feature (Anthropic API proxy)
    ├── data/storage.json    ← local fallback storage when MONGODB_URI is not set
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

- Set `MONGODB_URI` (and optionally `MONGODB_DB_NAME`) in the backend environment; the storage API uses MongoDB Atlas when configured
- Set `FRONTEND_URL` in the backend environment to the deployed frontend origin
- Set `VITE_API_URL` in the frontend environment to the deployed backend URL, then rebuild
- Authentication (login) add pannanum — ippo edhavadhu role select pannalam nu simple ah irukku
- File upload feature (docs) ku, real file storage (S3, etc.) venum — ippo file name mattum save aagுthu

## 7. Domain API routes

The frontend uses these live REST resources. Each supports `GET /api/resources/:resource`, `POST`, `PUT /api/resources/:resource/:id`, and `DELETE /api/resources/:resource/:id`:

- `orders`
- `staff`
- `leaveRequests`
- `financials`
- `certifications`
- `debitNotes`
- `capas`

MongoDB stores resources in the `resources` collection. Without `MONGODB_URI`, the backend persists them in `backend/data/resources.json`.
