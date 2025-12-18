# Deployment Guide - Gymnastika CRM

This guide will help you deploy the app for **FREE** using Vercel (frontend) + Railway (backend).

---

## 📋 Prerequisites

1. GitHub account (free)
2. Vercel account (free) - [vercel.com](https://vercel.com)
3. Railway account (free $5/month credits) - [railway.app](https://railway.app)

---

## Step 1: Push Code to GitHub

If you haven't already, create a GitHub repository:

```bash
# In the customer-crm folder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gymnastika-crm.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `gymnastika-crm` repository
4. Railway will detect it - click **"Add Service"** → **"GitHub Repo"**
5. **Important:** Set the root directory to `backend`
   - Click on the service → Settings → Root Directory → `/backend`

### Configure Environment Variables

In Railway, go to your service → **Variables** tab and add:

```
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=Gymnastika.lb@gmail.com
SMTP_PASSWORD=vcnpblpylaflxggs
SMTP_FROM=Gymnastika.lb@gmail.com
SMTP_FROM_NAME=Gymnastika
FRONTEND_URL=https://your-app.vercel.app
```

6. Railway will auto-deploy. Copy your backend URL (e.g., `https://gymnastika-crm-production.up.railway.app`)

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your `gymnastika-crm` repository
4. **Configure the project:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   
5. **Add Environment Variable:**
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://YOUR-RAILWAY-URL.railway.app/api`
   
   (Replace with your actual Railway URL from Step 2)

6. Click **"Deploy"**

---

## Step 4: Update Railway with Vercel URL

Go back to Railway and update the `FRONTEND_URL` variable:

```
FRONTEND_URL=https://your-app.vercel.app
```

---

## 🎉 Done!

Your app is now live at:
- **Frontend:** `https://your-app.vercel.app`
- **Backend API:** `https://your-railway-url.railway.app/api`

---

## 📱 PWA Installation

Users can install the app on their phones:
- **iPhone:** Safari → Share → "Add to Home Screen"
- **Android:** Chrome → Menu → "Install app"

---

## 💰 Cost Breakdown

| Service | Cost |
|---------|------|
| Vercel (Frontend) | **FREE** |
| Railway (Backend) | **FREE** ($5 credits/month) |
| **Total** | **$0/month** |

Railway's free tier includes $5 of credits per month, which is enough for low-traffic apps.

---

## 🔧 Troubleshooting

### CORS Errors
Make sure `FRONTEND_URL` in Railway matches your Vercel URL exactly.

### Database Issues
The app uses SQLite which stores data in a file. On Railway, this file persists as long as you don't redeploy. For production, consider upgrading to PostgreSQL (Railway offers a free PostgreSQL add-on).

### Email Not Sending
Verify your Gmail App Password is correct in Railway environment variables.

---

## 🔄 Updating the App

1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. Both Vercel and Railway will auto-deploy!

---

## 📊 Monitoring

- **Vercel:** Check deployments at vercel.com/dashboard
- **Railway:** Check logs at railway.app/dashboard


