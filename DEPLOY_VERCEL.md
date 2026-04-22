# Deploy Guide (Vercel)

## Important
This project has:
- `frontend` (React) -> good for Vercel
- `backend` (Express + SQLite file) -> SQLite file storage is not reliable/persistent on Vercel serverless

Recommended production setup:
- Deploy `frontend` on Vercel
- Deploy `backend` on a Node host with persistent disk/DB (Railway/Render/VM), or migrate DB to managed Postgres

## 1) Deploy Backend First
Deploy backend somewhere stable, then copy backend URL.

Example backend URL:
- `https://your-backend.example.com`

Health check:
- `https://your-backend.example.com/api/customers`

## 2) Deploy Frontend on Vercel
1. Push code to GitHub.
2. In Vercel, click **Add New Project**.
3. Select this repo.
4. Set **Root Directory** = `frontend`.
5. Add Environment Variable:
   - `REACT_APP_API_URL` = `https://your-backend.example.com/api`
6. Deploy.

## 3) Verify After Deploy
- Open your Vercel URL.
- Check:
  - Customer Master save/update
  - New quotation create/save
  - PDF preview

If API fails, confirm CORS on backend allows your Vercel domain.
