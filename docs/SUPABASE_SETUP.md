# Supabase Production Setup Guide

This guide walks you through setting up Supabase for production deployment of SoulForge.

## Overview

**Time Required:** ~30 minutes
**Difficulty:** Intermediate
**Prerequisites:**
- Supabase account (free tier works)
- Basic SQL knowledge
- Understanding of environment variables

## Step 1: Create Supabase Project

### 1.1 Sign Up / Log In

1. Go to https://supabase.com
2. Click "Start your project" or "Sign In"
3. Use GitHub or email authentication

### 1.2 Create New Project

1. Click **"New Project"**
2. Choose your **organization** (or create one)
3. Fill in project details:
   - **Name**: `soulforge-prod` (or your preferred name)
   - **Database Password**: Generate a strong password ⚠️ **SAVE THIS**
   - **Region**: Choose closest to your users
     - US East: North Virginia
     - US West: Oregon
     - EU: Amsterdam
     - Asia Pacific: Singapore
   - **Pricing Plan**: Free (for development) or Pro (for production)

4. Click **"Create new project"**
5. Wait for project provisioning (~2-3 minutes)

## Step 2: Get API Credentials

### 2.1 Access API Settings

1. In your project dashboard, click **Settings** (gear icon)
2. Select **API** from the sidebar

### 2.2 Copy Credentials

You'll need these for environment variables:

**Project URL:**
```
https://xxxxx.supabase.co
```
→ Save as: `NEXT_PUBLIC_SUPABASE_URL`

**anon/public Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
→ Save as: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**service_role Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
→ Save as: `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANT:**
- `anon` key is safe to expose in browser
- `service_role` key MUST stay secret (never commit to git)
- Save these securely - you'll need them for Vercel

## Step 3: Run Database Migrations

### 3.1 Access SQL Editor

1. In Supabase dashboard, click **SQL Editor** (icon with terminal)
2. Click **"New query"**

### 3.2 Run Initial Schema

1. Copy the entire contents of:
   ```
   supabase/migrations/001_initial_schema.sql
   ```

2. Paste into SQL Editor

3. Review the SQL (optional but recommended):
   - Creates 10 tables
   - Sets up indexes
   - Enables Row Level Security (RLS)
   - Creates triggers

4. Click **"Run"** ▶️ or press `Cmd/Ctrl + Enter`

5. Verify success:
   - Should see "Success" message
   - No red error messages
   - Tables created in Database > Tables

### 3.3 Verify Tables

1. Click **Database** in sidebar
2. Select **Tables**
3. Verify these tables exist:
   - ✅ `profiles`
   - ✅ `ocs`
   - ✅ `oc_items`
   - ✅ `oc_inventory`
   - ✅ `forum_posts`
   - ✅ `forum_comments`
   - ✅ `conversations`
   - ✅ `messages`
   - ✅ `heartbeat_log`

### 3.4 Check Sample Data

The migration includes sample OC items. Verify:

1. Click on `oc_items` table
2. Go to **Table viewer**
3. Should see 5 sample items:
   - Ancient Sword
   - Mystic Amulet
   - Lucky Coin
   - Shadow Cloak
   - Book of Tales

## Step 4: Configure Storage (Optional)

If you're using image generation features:

### 4.1 Create Storage Bucket

1. Click **Storage** in sidebar
2. Click **"Create a new bucket"**
3. Configure:
   - **Name**: `soulforge-images`
   - **Public bucket**: ✅ Yes (for public access)
   - **File size limit**: 5MB (adjust as needed)
   - **Allowed MIME types**: `image/png`, `image/jpeg`, `image/webp`

4. Click **"Create bucket"**

### 4.2 Set Up Storage Policies

For public read access:

1. Click on `soulforge-images` bucket
2. Go to **Policies** tab
3. Click **"New policy"**
4. Select **"Get started quickly"** template
5. Choose **"Public Read Access"**
6. Review the policy:
   ```sql
   -- Allow public reads
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'soulforge-images');
   ```
7. Click **"Use this template"**
8. Click **"Create policy"**

## Step 5: Configure Authentication

### 5.1 Enable Email Auth

1. Click **Authentication** in sidebar
2. Go to **Providers** > **Email**
3. Ensure **"Enable Email provider"** is ON
4. Configure:
   - **Confirm email**: Double opt-in (optional)
   - **Secure email change**: Enabled (recommended)
   - **OTP**: Email verification (optional)

### 5.2 Configure Redirect URLs

For local development:

1. Go to **URL Configuration**
2. Add to **"Allowlisted redirect URLs"**:
   ```
   http://localhost:3000
   ```

For production:

1. Add your production URL:
   ```
   https://your-domain.vercel.app
   # or your custom domain
   https://soulforge.com
   ```

### 5.3 Create Test User (Optional)

To verify auth works:

1. Go to **Authentication** > **Users**
2. Click **"Add user"** > **"Create new user"**
3. Enter:
   - **Email**: your-email@example.com
   - **Password**: (use a strong password)
   - **Auto Confirm User**: ✅ Yes (for testing)
4. Click **"Create user"**

## Step 6: Set Up Row Level Security (RLS)

The migration already enabled RLS, but let's verify:

### 6.1 Check RLS Status

1. Click **Database** > **Tables**
2. Click on any table (e.g., `ocs`)
3. Click **"RLS policies"** in top right
4. Should see multiple policies listed
5. Verify **"Enable RLS"** is ON

### 6.2 Test RLS (Optional)

To test that RLS is working:

1. Go to **SQL Editor**
2. Run this query:
   ```sql
   -- Test RLS on ocs table
   SELECT * FROM ocs;
   ```
3. Should return empty (no data yet, RLS is active)

## Step 7: Configure Database Hooks (Optional)

### 7.1 Webhooks (for realtime features)

If you need realtime updates:

1. Click **Database** > **Webhooks**
2. Click **"Add a webhook"**
3. Configure:
   - **Name**: `soulforge-updates`
   - **URL**: Your webhook endpoint
   - **Events**: SELECT, INSERT, UPDATE, DELETE
4. Click **"Save"**

## Step 8: Backup and Monitoring

### 8.1 Configure Backups

**Free tier:**
- Daily backups retained for 7 days
- Point-in-time recovery available

**Pro tier:**
- Daily backups retained for 30 days
- Configure backup window in Settings > Database

### 8.2 Set Up Monitoring

1. Go to **Settings** > **Billing**
2. Monitor:
   - Database size
   - API requests
   - Storage usage
3. Set up alerts (Pro tier)

## Step 9: Test Connection

### 9.1 Test from Application

1. Ensure environment variables are set:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. In your app, test connection:
   ```typescript
   // Test query
   const { data, error } = await supabase
     .from('oc_items')
     .select('*')
     .limit(1)

   console.log('Connected:', !error)
   console.log('Sample data:', data)
   ```

3. Should return sample OC items

### 9.2 Test Auth Flow

1. Try signing up a user
2. Verify user appears in Supabase > Authentication > Users
3. Test login flow
4. Verify session creation

## Step 10: Production Checklist

Before going live:

### ✅ Security
- [ ] Strong database password
- [ ] RLS enabled on all tables
- [ ] Service role key never exposed
- [ ] API keys rotated periodically
- [ ] 2FA enabled on Supabase account

### ✅ Configuration
- [ ] All tables created (10 tables)
- [ ] Indexes verified (15+ indexes)
- [ ] Triggers working (updated_at)
- [ ] Storage bucket created (if using images)
- [ ] Auth providers configured
- [ ] Redirect URLs set

### ✅ Testing
- [ ] Can connect from app
- [ ] Auth flow works
- [ ] Can read/write data
- [ ] RLS policies enforced
- [ ] Cron job can access

### ✅ Monitoring
- [ ] Backup schedule configured
- [ ] Usage alerts set (if Pro)
- [ ] Log retention configured
- [ ] Performance monitoring active

## Troubleshooting

### Issue: Migration fails

**Solutions:**
1. Check for syntax errors in SQL
2. Ensure UUID extension is enabled
3. Verify auth.users table exists
4. Check Supabase logs: Database > Logs

### Issue: RLS blocking queries

**Solutions:**
1. Verify user is authenticated
2. Check RLS policies match your logic
3. Test with service role key (bypasses RLS)
4. Review policy conditions

### Issue: Auth not working

**Solutions:**
1. Verify redirect URLs are allowlisted
2. Check email provider is enabled
3. Test with "Auto Confirm" enabled
4. Review auth logs

### Issue: Storage not accessible

**Solutions:**
1. Verify bucket is public
2. Check storage policies
3. Ensure correct bucket name
4. Test with service role key

## Next Steps

After Supabase is set up:

1. **Configure Vercel:**
   - Add environment variables
   - Deploy application
   - Test production connection

2. **Test features:**
   - OC summoning
   - Forum posts
   - Chat system
   - Heartbeat cron

3. **Monitor:**
   - Check Supabase dashboard
   - Review Vercel logs
   - Monitor API usage

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Auth Guide](https://supabase.com/docs/guides/auth)

## Support

If you encounter issues:

1. Check Supabase dashboard logs
2. Review migration SQL
3. Verify environment variables
4. Test with service role key
5. Consult Supabase documentation
6. Ask team lead for help
