# Supabase Database Setup

## Step 1: Create Tables

Go to your Supabase Dashboard → SQL Editor and run these SQL commands:

### 1. Profiles Table (extend auth users)
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  subscription_plan TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  videos_quota INT DEFAULT 5,
  videos_used INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 2. Videos Table
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  file_size INT,
  mime_type TEXT,
  duration_seconds FLOAT,
  storage_path TEXT NOT NULL, -- path in Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own videos
CREATE POLICY "Users can read own videos" ON videos
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own videos
CREATE POLICY "Users can insert own videos" ON videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own videos
CREATE POLICY "Users can update own videos" ON videos
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own videos
CREATE POLICY "Users can delete own videos" ON videos
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX videos_user_id ON videos(user_id);
CREATE INDEX videos_created_at ON videos(created_at DESC);
```

### 3. Analyses Table (store video analysis results)
```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  master_prompt TEXT,
  analysis_json JSONB, -- full analysis result from Gemini
  segments JSONB, -- scene breakdown data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own analyses
CREATE POLICY "Users can read own analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own analyses
CREATE POLICY "Users can insert own analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX analyses_video_id ON analyses(video_id);
CREATE INDEX analyses_user_id ON analyses(user_id);
CREATE INDEX analyses_created_at ON analyses(created_at DESC);
```

### 4. Generated Images Table (for product integration)
```sql
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_base64 TEXT, -- or store URL to storage
  prompt_used TEXT,
  product_image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own generated images
CREATE POLICY "Users can read own generated images" ON generated_images
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own generated images
CREATE POLICY "Users can insert own generated images" ON generated_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX generated_images_analysis_id ON generated_images(analysis_id);
CREATE INDEX generated_images_user_id ON generated_images(user_id);
```

## Step 2: Create Storage Buckets

In Supabase Dashboard → Storage:

1. **Create 'videos' bucket**
   - Name: `videos`
   - Public: No (private, RLS protected)

2. **Create 'product-images' bucket**
   - Name: `product-images`
   - Public: No

3. **Create 'generated-images' bucket**
   - Name: `generated-images`
   - Public: No (or Yes if you want to share generated images)

## Step 3: Set Storage Policies

For each bucket, add RLS policies:

### Videos Bucket Policy
```sql
-- Users can upload their own videos
-- Go to Storage → videos → Policies → New Policy
-- Name: "Users can upload own videos"
-- Template: For inserts and updates
```

## Step 4: Create Auth Trigger

Auto-create profile when user signs up:

```sql
-- Create a trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Summary

After running all SQL commands above:
- ✅ Users can sign up and have profiles auto-created
- ✅ Users can upload videos (stored in Supabase Storage)
- ✅ Analysis results are saved to database
- ✅ Generated images can be stored
- ✅ Row-Level Security ensures data isolation
- ✅ All quota management tables are ready

## Next Steps

1. Enable Email Authentication in Supabase Auth settings
2. Configure email templates (optional)
3. In your React app, import `supabaseClient.ts` and use it to save videos and analyses
4. Create a database service to handle CRUD operations
