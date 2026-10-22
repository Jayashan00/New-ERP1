# Deploy the demo to Vercel (free)

## 1. Upload to GitHub (PowerShell, inside the unzipped `ceylon-ayu-erp` folder)
```powershell
git init
git add .
git commit -m "Ceylon Ayu Resort ERP demo"
git branch -M main
git remote add origin https://github.com/Jayashan00/New-ERP.git
git push -u origin main --force
```
(`--force` replaces what is currently in that repository. To keep the old project, create a new empty repository instead, e.g. `ceylon-ayu-erp`, and use its address.)

## 2. Vercel
1. vercel.com → **Add New… → Project** → import the repository.
2. **Root Directory → Edit → `frontend`** (required).
3. **Deploy**. If the old project is already on Vercel and connected to the same repository, the push in step 1 redeploys it automatically.

## 3. Check
Open your link: the hotel website shows. `/login` is the staff login.

## Demo mode — what to tell the client
- Everything works and is saved in the browser. Tabs in the same browser update each other live (e.g. room QR → kitchen → waiter).
- Phase 2 (after approval) connects the `backend/` server so all devices share one live database, and connects real payment gateways, the channel manager provider, SMS/WhatsApp and email.

## Run locally
```powershell
cd frontend
pnpm install     # or: npm install
pnpm dev         # or: npm run dev  → http://localhost:5173
```
Backend (phase 2): `cd backend && npm install && npm start` · tests: `npm test`.
