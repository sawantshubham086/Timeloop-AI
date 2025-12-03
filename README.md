# TimeLoop AI - Complete SaaS Application

![Status](https://img.shields.io/badge/status-production_ready-brightgreen)
![Version](https://img.shields.io/badge/version-0.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 What is TimeLoop AI?

**TimeLoop AI** is an AI-powered video analysis SaaS application that reverse-engineers any video footage to extract the perfect generation prompt. Use machine learning to understand camera movements, lighting setups, cinematography techniques, and create brand-new videos with the same visual style.

**tagline**: *"Bend Time. Rewind Reality."*

---

## ✨ Key Features

### 🎬 Video Analysis
- Upload any video (MP4, MOV, WebM)
- AI-powered Gemini 2.5 Vision analysis
- Extract master prompt with complete instructions
- Temporal breakdown with scene-by-scene analysis
- Automatic screenshot capture at key moments

### 🖼️ Product Integration
- Upload product image
- Remix video prompts to feature your product
- Generate new scenes with brand injected
- Download high-quality results

### 👥 User Management
- Email authentication with Supabase
- User profiles & quota management
- Video history tracking
- Subscription plan support

### 💾 Full Backend
- PostgreSQL database with Supabase
- Private file storage
- Row-level security (RLS)
- Automatic data isolation per user

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19.2 + TypeScript |
| **Build Tool** | Vite 6.2 |
| **Styling** | Tailwind CSS 3 |
| **AI** | Google Gemini 2.5 Flash Vision |
| **Backend** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Email/Password) |
| **Storage** | Supabase Storage |
| **Icons** | Lucide React |
| **Deployment** | Vercel (recommended) |

---

## 📋 Quick Start

### Prerequisites
- Node.js 18+ 
- Google Gemini API key (free tier available)
- Supabase account (free tier available)
- npm or yarn

### Installation

1. **Clone repository**
```bash
git clone https://github.com/yourusername/timeloop-ai.git
cd timeloop-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
Create `.env.local`:
```
VITE_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Get API Keys**
   - [Google AI Studio](https://aistudio.google.com/apikey)
   - [Supabase Dashboard](https://app.supabase.co)

5. **Setup Database**
   - Follow `EXECUTE_NOW.md` (15 minutes)
   - Create 4 tables + storage buckets

6. **Start Dev Server**
```bash
npm run dev
```

Visit: http://localhost:5174

---

## 📁 Project Structure

```
timeloop-ai/
├── src/
│   ├── lib/
│   │   └── supabaseClient.ts        # Supabase initialization
│   ├── pages/
│   │   ├── LoginPage.tsx            # Authentication UI
│   │   └── Dashboard.tsx            # Video management
│   ├── services/
│   │   ├── geminiService.ts         # AI analysis (Gemini 2.5)
│   │   └── databaseService.ts       # Database CRUD operations
│   ├── components/
│   │   ├── VideoUploader.tsx        # Drag-drop upload
│   │   ├── PromptDisplay.tsx        # Results display
│   │   └── ProductIntegration.tsx   # Brand injection
│   ├── App.tsx                      # Main application
│   └── types.ts                     # TypeScript definitions
├── index.html                       # HTML entry point
├── index.tsx                        # React entry point
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript config
├── tailwind.config.js               # Tailwind configuration
├── package.json                     # Dependencies
├── .env.local                       # Environment variables
├── QUICKSTART.md                    # Quick start guide
├── EXECUTE_NOW.md                   # Step-by-step setup
├── SUPABASE_SETUP.md                # Database schema
├── INTEGRATION_GUIDE.md             # Integration details
└── README.md                        # This file
```

---

## 🔄 How It Works

### User Flow
1. User signs up → Email verified
2. User uploads video
3. Video sent to Gemini 2.5 Vision AI
4. AI extracts:
   - Master generation prompt
   - Scene-by-scene breakdown
   - Camera movements, lighting, aesthetics
   - Temporal markers with screenshots
5. Results saved to database
6. User can remix prompts or download

### Data Flow
```
Video Upload → Gemini Analysis → Results Stored → User Dashboard
                                ↓
                        Database (Supabase)
                                ↓
                        Screenshots + Metadata
```

---

## 🔐 Security Features

✅ **Row-Level Security (RLS)**
- Each user only sees their own data

✅ **Authentication**
- JWT-based with Supabase Auth
- Email verification

✅ **Data Isolation**
- User_id enforced on all queries
- Private storage buckets

✅ **Environment Variables**
- No secrets in code
- .env.local for local development

✅ **HTTPS**
- Automatic on production (Vercel)

---

## 📊 Database Schema

### Tables
- **profiles** - User accounts & quotas
- **videos** - Uploaded video metadata
- **analyses** - AI analysis results
- **generated_images** - Product integration results

### Storage Buckets
- **videos** - Original uploaded videos
- **product-images** - User product images
- **generated-images** - AI generated scenes

---

## 🎮 Usage Examples

### Sign Up
```
Click "INITIATE SEQUENCE" 
→ Go to Sign Up page
→ Enter email & password
→ Check email for verification
→ Sign In
```

### Analyze Video
```
Click "INITIATE SEQUENCE"
→ Drag video or click to upload
→ Click "ANALYZE VECTORS"
→ Wait for AI analysis (20-30s)
→ See master prompt + scene breakdown
```

### Product Integration
```
Scroll down on results page
→ Click "ADD PRODUCT IMAGE"
→ Upload product photo
→ Choose aspect ratio
→ Click "GENERATE BRAND SCENES"
→ Download generated images
```

---

## 📈 Deployment

### To Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy to Vercel**
   - Go to https://vercel.com/new
   - Import GitHub repository
   - Add environment variables:
     - `VITE_API_KEY`
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Deploy

3. **Custom Domain** (Optional)
   - Add domain in Vercel dashboard
   - Update DNS records

### To Other Platforms

```bash
npm run build
# Deploy dist/ folder to your host
```

---

## 💰 Monetization (Stripe Integration)

### Pricing Tiers
- **Free**: 5 videos/month
- **Pro**: 50 videos/month + advanced features
- **Enterprise**: Unlimited + API access

### To Add Stripe:
```bash
npm install @stripe/stripe-js stripe
```
Then follow `INTEGRATION_GUIDE.md` for implementation details.

---

## 🧪 Testing

### Manual Testing
- Sign up / Sign in
- Upload video
- Verify analysis
- Check database
- Delete video
- Sign out

### Automated Testing (Optional)
```bash
npm install --save-dev vitest @testing-library/react
npm test
```

---

## 🐛 Troubleshooting

### Video Upload Issues
**Problem**: Upload fails with 413 error
**Solution**: Check file size (max 20MB), verify storage bucket exists

### Database Errors
**Problem**: "User not authenticated"
**Solution**: Sign in first, check Supabase Auth tab

### AI Analysis Timeout
**Problem**: Analysis takes >60 seconds
**Solution**: Try smaller video, check API quota on Google Cloud

### Supabase Connection
**Problem**: "Missing environment variables"
**Solution**: Verify `.env.local` has all 3 keys with correct values

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `QUICKSTART.md` | 5-minute quick start |
| `EXECUTE_NOW.md` | Step-by-step setup guide |
| `SUPABASE_SETUP.md` | SQL schema reference |
| `INTEGRATION_GUIDE.md` | Detailed integration |
| `DEPLOYMENT_CHECKLIST.md` | Pre-launch checklist |
| `INTEGRATION_SUMMARY.md` | Changes summary |

---

## 📞 Support

- **Issues**: Open GitHub issue
- **Docs**: See documentation files
- **Supabase Docs**: https://supabase.com/docs
- **Gemini Docs**: https://ai.google.dev/docs

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Credits

- **AI Model**: Google Gemini 2.5 Flash
- **Backend**: Supabase
- **Frontend**: React 19 + TypeScript
- **Design**: Tailwind CSS + Custom Animations
- **Developer**: Shubham Sawant

---

## 📈 Roadmap

- [x] Core video analysis
- [x] Supabase integration
- [x] User authentication
- [ ] Stripe payments
- [ ] Advanced analytics
- [ ] Batch processing
- [ ] API for developers
- [ ] Mobile app
- [ ] Webhooks
- [ ] Real-time collaboration

---

## 🎯 Current Status

**Phase**: Production Ready (Backend Integration Complete)
**Completion**: 80%
**Time to Live**: 15 minutes (just execute SQL)
**Next Step**: Run `EXECUTE_NOW.md`

---

## 🚀 Let's Launch!

1. ✅ Code is ready
2. ✅ Supabase configured
3. ✅ Gemini API connected
4. ⏳ Just execute SQL schema
5. ⏳ Deploy to Vercel

**Follow `EXECUTE_NOW.md` to complete setup in 15 minutes!**

---

**Last Updated**: Today
**Version**: 0.0.1 Alpha
**Status**: 🟢 Ready for Deployment
