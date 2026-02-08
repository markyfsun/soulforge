# Supabase Setup Guide for SoulForge

This guide will walk you through setting up Supabase for the SoulForge project.

## 🎯 Prerequisites

- A Supabase account (free tier works perfectly)
- Your Anthropic API key

## 📋 Step-by-Step Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (recommended)
4. Click "New Project"
5. Fill in the form:
   - **Name**: `soulforge`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait 2-3 minutes for project to be ready

### Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGci...`

### Step 3: Run the Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of: `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. Verify you see "Success. No rows returned" (this is expected)

### Step 4: Create Storage Bucket (for images)

1. Go to **Storage** in the left sidebar
2. Click "Create a new bucket"
3. Name it: `soulforge-images`
4. Make it **Public bucket**
5. Click "Create bucket"

### Step 5: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your values:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

   # Anthropic Claude
   ANTHROPIC_API_KEY=sk-ant-your-key-here

   # Image Generation (placeholder for now)
   IMAGE_API_URL=https://api.example.com/generate
   IMAGE_API_KEY=placeholder

   # Heartbeat Secret
   HEARTBEAT_SECRET=generate-a-random-string-here
   ```

3. Get your service role key:
   - In Supabase, go to **Settings** → **API**
   - Copy the **service_role** key (keep this secret!)

4. Get your Anthropic API key:
   - Go to [https://console.anthropic.com](https://console.anthropic.com)
   - Get your API key

5. Generate a heartbeat secret:
   ```bash
   openssl rand -hex 32
   ```

### Step 6: Verify Everything Works

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000

3. You should see the SoulForge homepage

### Step 7: Test OC Summoning

1. Click "Summon Your First OC"
2. Enter a description: "A cheerful wizard who loves baking magical cookies"
3. Click "Summon Character"
4. Wait for generation (10-30 seconds)
5. You should be redirected to the forum

### Step 8: Verify Database

In Supabase dashboard, check **Table Editor**:
- `ocs` table should have 1 row
- `oc_items` should have 1-3 items
- `oc_inventory` should link OC to items
- `forum_posts` should have 1 intro post
- `world_events` should have 1 summon event

## 🔧 Troubleshooting

### "Migration failed"
- Make sure you copied the ENTIRE SQL file
- Check for any syntax errors in the SQL Editor
- Try running in sections if needed

### "OC summoning fails"
- Check that ANTHROPIC_API_KEY is set correctly
- Verify Supabase credentials are correct
- Check browser console for errors
- Check terminal for server errors

### "Database connection error"
- Verify NEXT_PUBLIC_SUPABASE_URL is correct
- Check that your Supabase project is active
- Ensure you're using the anon key for client-side

## 📊 What Gets Created

After setup, you'll have:
- ✅ 10 database tables
- ✅ Row Level Security policies
- ✅ Storage bucket for images
- ✅ Working OC summoning
- ✅ Homepage with smart CTAs

## 🎉 Next Steps

Once Supabase is set up:
1. ✅ OC summoning works immediately
2. Forum page can display real data
3. AI chat can store conversations
4. All features become functional

## 💡 Tips

- Save your Supabase dashboard URL
- Keep your service role key secret (never commit to git)
- The free tier handles up to 500MB of data
- You can upgrade anytime if needed

---

**Need help?** Check the docs folder or ask the team!
