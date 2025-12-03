# TimeLoop AI - Supabase Integration Guide

## ✅ What's Been Set Up

### 1. **Authentication** ✅
- `src/lib/supabaseClient.ts` - Supabase client initialization
- `src/pages/LoginPage.tsx` - Sign up and sign in pages with Supabase Auth
- `App.tsx` - Updated with auth state management and logout button
- Auto session detection on app load
- User email displayed in navbar

### 2. **Database Service** ✅
- `src/services/databaseService.ts` - Complete CRUD operations:
  - `saveVideo()` - Save video metadata
  - `uploadVideoFile()` - Upload to Supabase Storage
  - `saveAnalysis()` - Save Gemini analysis results
  - `saveGeneratedImage()` - Store generated images
  - `getUserVideos()` - Fetch user's video history
  - `canUploadVideo()` - Check quota
  - `incrementVideosUsed()` - Track usage
  - And more...

### 3. **Dashboard** ✅
- `src/pages/Dashboard.tsx` - View video history, file sizes, dates
- Delete videos functionality
- Quota management UI ready

### 4. **SQL Schema** ✅
- `SUPABASE_SETUP.md` - Complete database schema with RLS policies

---

## 🚀 Next Steps to Complete Integration

### STEP 1: Run SQL Schema in Supabase

1. Go to https://app.supabase.com/project/[YOUR_PROJECT_ID]/sql/new
2. Copy and paste each SQL command from `SUPABASE_SETUP.md`
3. Run them in this order:
   - Profiles table + RLS
   - Videos table + RLS + indexes
   - Analyses table + RLS + indexes
   - Generated Images table + RLS + indexes
   - Auth trigger function

### STEP 2: Create Storage Buckets

1. Go to Storage → Buckets
2. Create 3 new buckets:
   - `videos` (private)
   - `product-images` (private)
   - `generated-images` (private/public)

### STEP 3: Update App.tsx to Save Videos

Modify `App.tsx` to save video data after successful analysis:

```typescript
const handleAnalyze = async () => {
  if (!videoData) return;

  setAppState(AppState.ANALYZING);
  
  try {
    // 1. Save video to storage
    const storagePath = await DatabaseService.uploadVideoFile(videoData.file);
    
    // 2. Save video metadata
    const savedVideo = await DatabaseService.saveVideo(
      videoData.fileName,
      videoData.file.size,
      videoData.mimeType,
      0, // You may need to get duration
      storagePath
    );

    // ... rest of analysis code ...

    // 3. Save analysis result
    if (result) {
      await DatabaseService.saveAnalysis(
        savedVideo.id,
        result.masterPrompt || "",
        result
      );
      
      // 4. Increment quota usage
      await DatabaseService.incrementVideosUsed();
    }

    setAppState(AppState.SUCCESS);
  } catch (err: any) {
    setAppState(AppState.ERROR);
    setErrorMsg(err.message || "Analysis sequence failed.");
  }
};
```

### STEP 4: Add Dashboard to App

Update App.tsx to include dashboard view:

```typescript
// Add import
import Dashboard from './pages/Dashboard';

// Add state
const [showDashboard, setShowDashboard] = useState(false);

// Update navbar to add dashboard button
<button 
  onClick={() => setShowDashboard(!showDashboard)}
  className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
>
  {showDashboard ? 'New Analysis' : 'Dashboard'}
</button>

// Show dashboard when toggled
{showDashboard ? (
  <Dashboard onVideoSelect={(videoId) => console.log(videoId)} />
) : (
  // ... existing content ...
)}
```

### STEP 5: Update VideoUploader Component

Add quota check before upload:

```typescript
const canUpload = await DatabaseService.canUploadVideo();
if (!canUpload) {
  alert('You have reached your video quota. Upgrade your plan!');
  return;
}
```

### STEP 6: Save Generated Images

In `ProductIntegration.tsx`, after generating image:

```typescript
await DatabaseService.saveGeneratedImage(
  analysisId,
  generatedImageBase64,
  adaptedPrompt,
  productImagePath
);
```

---

## 📋 Verification Checklist

After completing all steps above:

- [ ] Supabase project created at https://app.supabase.co
- [ ] Project credentials in `.env.local`
- [ ] SQL schema executed in Supabase
- [ ] Storage buckets created
- [ ] Sign up works (create test account)
- [ ] Video upload and analysis saves to database
- [ ] Dashboard shows uploaded videos
- [ ] Can delete videos
- [ ] Quota system works

---

## 🔧 Testing the Integration

### Test Authentication
1. Click "INITIATE SEQUENCE" button on homepage
2. Should redirect to login page
3. Click "Sign Up" and create account
4. Verify email confirmation
5. Sign back in
6. Should see app workspace

### Test Video Upload & Database
1. Upload a test video
2. Run analysis
3. Check Supabase Dashboard → videos table
4. Verify row created with your user_id
5. Check analyses table for results
6. Go to Dashboard tab - should show video

### Test Quota System
1. Set quota to small number in Profiles table (e.g., 3)
2. Upload 3 videos
3. Try uploading 4th - should show quota error

---

## 🛡️ Security Features Enabled

✅ Row-Level Security (RLS) - Users can only access their own data
✅ Auth triggers - Profiles auto-created on signup
✅ Encrypted storage - All videos in private buckets
✅ JWT validation - All API calls validated against auth session

---

## 💳 Next Phase: Stripe Integration

After this is working, you'll connect Stripe for:
- Subscription plans (Free, Pro, Enterprise)
- Payment processing
- Quota upgrades
- Usage tracking

---

## 📞 Troubleshooting

**Issue**: "User not authenticated" error
- **Solution**: Make sure user is logged in. Check Auth tab in Supabase Dashboard.

**Issue**: "Missing environment variables"
- **Solution**: Verify `.env.local` has all three keys:
  - `VITE_API_KEY`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

**Issue**: Videos not saving to database
- **Solution**: Check RLS policies are correct and user_id is being passed

**Issue**: CORS errors on file upload
- **Solution**: Check bucket policies allow authenticated users

---

## 📚 Files Created

| File | Purpose |
|------|---------|
| `src/lib/supabaseClient.ts` | Supabase client setup |
| `src/pages/LoginPage.tsx` | Authentication UI |
| `src/pages/Dashboard.tsx` | Video management UI |
| `src/services/databaseService.ts` | Database CRUD operations |
| `SUPABASE_SETUP.md` | SQL schema definitions |

---

**Status**: ✅ Frontend authentication and database service ready
**Next**: Execute SQL schema and create storage buckets in Supabase
