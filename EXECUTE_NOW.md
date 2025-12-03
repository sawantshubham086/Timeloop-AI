# 🔧 Step-by-Step Execution Guide

## Your App Status
✅ **Frontend**: Complete and running on http://localhost:5174
✅ **Authentication**: LoginPage component ready
✅ **Database Service**: All methods written
⏳ **Database Schema**: WAITING - YOU MUST EXECUTE THIS

---

## 🚀 DO THIS RIGHT NOW (15 minutes)

### PART 1: Create Database Tables (5 minutes)

#### Step 1a: Open Supabase SQL Editor
1. Go to: https://app.supabase.co
2. Login with your credentials
3. Select your project: **timeloop-ai**
4. Click: **SQL Editor** (left sidebar)
5. Click: **New Query**

#### Step 1b: Run First SQL Command

Copy and paste this EXACT code into the SQL editor:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  subscription_plan TEXT DEFAULT 'free',
  videos_quota INT DEFAULT 5,
  videos_used INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

Then click: **Run**

**✓ Expected**: Query executed successfully

#### Step 1c: Run Second SQL Command

```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  file_size INT,
  mime_type TEXT,
  duration_seconds FLOAT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own videos" ON videos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos" ON videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos" ON videos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos" ON videos
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX videos_user_id ON videos(user_id);
CREATE INDEX videos_created_at ON videos(created_at DESC);
```

Then click: **Run**

#### Step 1d: Run Third SQL Command

```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  master_prompt TEXT,
  analysis_json JSONB,
  segments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX analyses_video_id ON analyses(video_id);
CREATE INDEX analyses_user_id ON analyses(user_id);
CREATE INDEX analyses_created_at ON analyses(created_at DESC);
```

Then click: **Run**

#### Step 1e: Run Fourth SQL Command

```sql
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_base64 TEXT,
  prompt_used TEXT,
  product_image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own generated images" ON generated_images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generated images" ON generated_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX generated_images_analysis_id ON generated_images(analysis_id);
CREATE INDEX generated_images_user_id ON generated_images(user_id);
```

Then click: **Run**

#### Step 1f: Run Auth Trigger

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

Then click: **Run**

**✓ Expected**: All 4 tables created + trigger + policies

---

### PART 2: Create Storage Buckets (3 minutes)

1. In Supabase, click: **Storage** (left sidebar)
2. Click: **Create new bucket**
3. Name: `videos` → Set to **Private** → Create
4. Repeat for: `product-images` (Private)
5. Repeat for: `generated-images` (Private)

**✓ Expected**: 3 buckets visible in Storage tab

---

### PART 3: Test Authentication (5 minutes)

1. Open: http://localhost:5174 in browser
2. Click: **INITIATE SEQUENCE** button
3. Should redirect to login page
4. Click: **Sign Up**
5. Fill form:
   - Email: `test@example.com`
   - Password: `TestPass123!`
6. Click: **Create Account**
7. **Check your email** for confirmation link (or look in Supabase Auth tab)
8. Click confirmation link
9. You should be redirected back to login
10. Enter credentials and click **Sign In**

**✓ Expected**: App workspace appears, you're authenticated

---

### PART 4: Verify Database Works (3 minutes)

1. **Still authenticated in the app**
2. Click: **INITIATE SEQUENCE** or **New Loop**
3. Upload any test video file
4. Click: **ANALYZE VECTORS**
5. Wait for analysis (20-30 seconds)
6. **Go to Supabase Dashboard**
7. Click: **Database** → **videos** table
8. Should see 1 row with your video info

**✓ Expected**: Video row appears with correct user_id

---

## ✅ Success Checklist

After completing all 4 parts above:

- [ ] Supabase SQL ran without errors
- [ ] 4 tables created (profiles, videos, analyses, generated_images)
- [ ] 3 storage buckets created
- [ ] Could sign up for new account
- [ ] Could sign in with credentials
- [ ] Could upload video
- [ ] Video appears in database table
- [ ] User email shows in navbar
- [ ] Can sign out

---

## 🎉 You're Done With Backend Setup!

Your SaaS infrastructure is now **LIVE**. Next optional steps:

### To Go to Production:
1. Push code to GitHub
2. Deploy to Vercel
3. Add environment variables in Vercel

### To Add Payments:
1. Create Stripe account
2. Install Stripe SDK
3. Add pricing page
4. Connect to subscription_plan column

---

## 🆘 Troubleshooting

**Q: SQL returns error "relation already exists"**
- A: Table was already created. Click next query or delete and recreate.

**Q: Can't sign up - email error**
- A: Make sure email is unique. Check Supabase Auth tab to see accounts.

**Q: Video uploaded but doesn't appear in database**
- A: Check browser console for errors. Verify RLS policies are active.

**Q: Can't upload video - CORS error**
- A: Storage policies need to allow authenticated users. May take a few minutes.

---

## 📞 Command Line Cheat Sheet

```bash
# If you need to rebuild app
npm run build

# Check dependencies
npm list

# Start dev server again
npm run dev

# Check for TypeScript errors
npm run type-check
```

---

**Time Estimate**: 15 minutes total
**Difficulty**: Easy (copy-paste SQL commands)
**Risk Level**: None (Supabase is safe to experiment)
**Next Step**: Just follow the steps above!

🚀 **LET'S GO!**
