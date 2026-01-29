# 🚀 Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free tier works)
- Supabase project set up

---

## 📦 Step-by-Step Deployment

### **1. Install Vercel CLI**
```powershell
npm install -g vercel
```

**Why?** The Vercel CLI lets you deploy from your terminal.

---

### **2. Login to Vercel**
```powershell
vercel login
```

**What happens?** Opens browser for authentication with your Vercel account.

---

### **3. Commit Your Code**
```powershell
git add .
git commit -m "Prepare for deployment"
git push origin main
```

**Why?** Vercel can deploy directly from your GitHub repository.

---

### **4. Deploy to Vercel**

**Option A: From Terminal (Quick)**
```powershell
vercel --prod
```

**Option B: From GitHub (Recommended)**
1. Go to [https://vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel auto-detects the configuration

---

### **5. Set Environment Variables**

**In Vercel Dashboard:**
1. Go to your project → Settings → Environment Variables
2. Add these variables:

**Backend Variables:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

**Frontend Variables (if needed):**
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=https://your-project.vercel.app/api
```

**Why?** These secrets shouldn't be in your code. Vercel injects them securely.

---

### **6. Redeploy**
After adding environment variables:
```powershell
vercel --prod
```

---

## 🏗️ Project Structure Explained

```
INTERFACE_LLM/
├── vercel.json          ← Vercel configuration (tells Vercel how to build)
├── requirements.txt     ← Python dependencies
├── backend/
│   ├── api/
│   │   └── index.py    ← Entry point for Vercel serverless function
│   └── src/
│       └── app/
│           └── main.py  ← Your FastAPI app
└── frontend/
    ├── package.json     ← React build configuration
    └── build/           ← Generated after build (deployed to Vercel)
```

---

## 🔍 How It Works

### **Backend (FastAPI):**
- Vercel converts your FastAPI app into serverless functions
- Each API route becomes a separate function
- `backend/api/index.py` wraps your `main.py` for Vercel

### **Frontend (React):**
- Vercel builds your React app with `npm run build`
- Serves static files from `frontend/build/`
- All routes go to frontend except `/api/*` (which goes to backend)

---

## 🛠️ Troubleshooting

### **Build Fails?**
- Check Vercel logs in dashboard
- Ensure all dependencies are in `requirements.txt`
- Make sure environment variables are set

### **API Returns 404?**
- Verify routes in `vercel.json` point to correct files
- Check `backend/api/index.py` imports correctly

### **CORS Errors?**
- Update `allow_origins` in `backend/src/app/main.py`
- Add your Vercel domain to allowed origins

---

## 📚 Key Concepts

| File | Purpose |
|------|---------|
| `vercel.json` | Configuration for builds and routing |
| `backend/api/index.py` | Serverless function wrapper |
| `requirements.txt` | Python packages to install |
| `package.json` | Frontend build commands |

---

## ✅ Success Checklist

- [ ] Vercel CLI installed
- [ ] Logged into Vercel
- [ ] Code pushed to GitHub
- [ ] Environment variables configured
- [ ] Deployment successful
- [ ] API endpoints working
- [ ] Frontend loads correctly

---

## 🎯 Next Steps After Deployment

1. Test your API: `https://your-project.vercel.app/api/health`
2. Test frontend: `https://your-project.vercel.app`
3. Set up custom domain (optional)
4. Configure production database
5. Monitor logs in Vercel dashboard

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
