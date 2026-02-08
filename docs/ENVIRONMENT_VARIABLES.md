# Environment Variables Guide

This document describes all environment variables required for SoulForge in development and production.

## Required Variables

### Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Example**: `https://your-project.supabase.co`
- **Where to find**: Supabase Dashboard > Settings > API > Project URL
- **Required**: ✅ Yes

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Supabase anonymous/public key for client-side access
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard > Settings > API > anon/public key
- **Required**: ✅ Yes
- **Note**: Safe to expose in browser

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Supabase service role key for admin operations (bypasses RLS)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard > Settings > API > service_role key
- **Required**: ✅ Yes (for server-side operations)
- **Warning**: NEVER commit this key or expose it to clients

### AI Configuration

#### `ANTHROPIC_API_KEY`
- **Description**: API key for Anthropic Claude (used for OC chat)
- **Example**: `sk-ant-api03-...`
- **Where to find**: https://console.anthropic.com/settings/keys
- **Required**: ✅ Yes
- **Cost**: Claude API usage billed to your Anthropic account
- **Security**: Keep secret, never commit to git

#### `IMAGE_API_URL` (Optional)
- **Description**: URL for image generation API (OC avatars, item icons)
- **Example**: `https://api.example.com/generate`
- **Required**: ⚠️ Optional (if using image generation feature)
- **Note**: Can be any DALL-E, Stable Diffusion, or custom API

#### `IMAGE_API_KEY` (Optional)
- **Description**: API key for image generation service
- **Required**: ⚠️ Optional (only if IMAGE_API_URL is set)
- **Security**: Keep secret

### Security

#### `HEARTBEAT_SECRET`
- **Description**: Secret key to authenticate cron job requests
- **Example**: `a-random-long-secret-string-at-least-32-chars`
- **Required**: ✅ Yes (for heartbeat cron job)
- **Generation**: Generate a random string:
  ```bash
  openssl rand -base64 32
  # or
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **Security**: Keep secret, never commit to git

## Development Setup

### Local Development

1. **Copy the example file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Fill in your credentials:**
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

   # Anthropic Claude
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

   # Optional: Image generation
   IMAGE_API_URL=https://api.example.com/generate
   IMAGE_API_KEY=your-image-api-key

   # Security
   HEARTBEAT_SECRET=generate-a-random-secret
   ```

3. **Never commit `.env.local`**
   - Already included in `.gitignore`
   - Contains sensitive credentials

### Supabase Setup

1. **Create a Supabase Project:**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose organization and region
   - Set database password (save it!)

2. **Get Your Credentials:**
   - Navigate to Project Settings > API
   - Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy service_role key → `SUPABASE_SERVICE_ROLE_KEY`

3. **Run Database Migrations:**
   - Go to SQL Editor in Supabase Dashboard
   - Create a new query
   - Paste contents of `supabase/migrations/001_initial_schema.sql`
   - Click "Run" to execute

4. **Set Up Storage (for images):**
   - Go to Storage in Supabase Dashboard
   - Create new bucket: `soulforge-images`
   - Make it public
   - Add RLS policies if needed

## Production Setup (Vercel)

### Step 1: Prepare Vercel Project

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Framework should be detected as "Next.js"

### Step 2: Configure Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add:

#### For All Environments (Production, Preview, Development):

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | All |
| `ANTHROPIC_API_KEY` | Your Anthropic key | All |
| `HEARTBEAT_SECRET` | Generated secret | All |
| `IMAGE_API_URL` | Your image API (optional) | All |
| `IMAGE_API_KEY` | Your image API key (optional) | All |

**Important:**
- Click "Include" for each variable to select which environments need it
- `NEXT_PUBLIC_*` variables are needed in all environments
- Secret keys should be included in all environments

### Step 3: Verify Variables in Build

After deployment, verify variables are loaded:

1. **Check build logs:**
   - Vercel Dashboard > Project > Deployments
   - Click on latest deployment
   - Look for environment variable errors

2. **Test in production:**
   - Visit your deployed site
   - Open browser console
   - Check that `process.env.NEXT_PUBLIC_SUPABASE_URL` is defined

### Step 4: Set Up Cron Job

Vercel Cron Jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/heartbeat",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**The cron job will:**
- Run every 10 minutes
- Hit `/api/cron/heartbeat` endpoint
- Trigger autonomous OC behavior

**To verify cron is working:**
1. Go to Vercel Dashboard > Project > Settings > Cron Jobs
2. Check that the job is listed
3. View logs to see recent executions

## Security Best Practices

### ✅ DO:
- Use different API keys for dev/prod if possible
- Rotate keys periodically
- Monitor usage in Supabase and Anthropic dashboards
- Use strong random secrets for `HEARTBEAT_SECRET`
- Keep `.env.local` in `.gitignore`
- Use Vercel environment variables (never hardcode)

### ❌ DON'T:
- Commit `.env.local` to git
- Share API keys in chat/email
- Use production keys in development
- Expose service role keys in client code
- Use weak/ predictable secrets

## Troubleshooting

### Issue: "Supabase connection failed"

**Solutions:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check Supabase project is active (not paused)
3. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
4. Check Supabase dashboard for API errors

### Issue: "Anthropic API error"

**Solutions:**
1. Verify `ANTHROPIC_API_KEY` is valid
2. Check Anthropic dashboard for usage/credits
3. Ensure API key has proper permissions
4. Check rate limits (may need to upgrade tier)

### Issue: "Cron job not working"

**Solutions:**
1. Verify `HEARTBEAT_SECRET` is set
2. Check `/api/cron/heartbeat` route exists
3. View Vercel cron job logs
4. Manually trigger endpoint to test

### Issue: "Build failing"

**Solutions:**
1. Check all required env vars are set in Vercel
2. Verify build logs for specific errors
3. Ensure `npm install` succeeds
4. Check TypeScript errors in build

## Variable Reference

### Quick Reference Card

```
REQUIRED FOR PRODUCTION:
├─ NEXT_PUBLIC_SUPABASE_URL       → Supabase Dashboard > Settings > API
├─ NEXT_PUBLIC_SUPABASE_ANON_KEY  → Supabase Dashboard > Settings > API
├─ SUPABASE_SERVICE_ROLE_KEY      → Supabase Dashboard > Settings > API
├─ ANTHROPIC_API_KEY              → Anthropic Console > API Keys
└─ HEARTBEAT_SECRET               → Generate with: openssl rand -base64 32

OPTIONAL:
├─ IMAGE_API_URL                  → Your image API endpoint
└─ IMAGE_API_KEY                  → Your image API key
```

## Support

If you encounter issues:

1. **Check logs first:**
   - Vercel build logs
   - Vercel function logs
   - Supabase logs
   - Browser console

2. **Verify configuration:**
   - All required vars set?
   - Correct values (no typos)?
   - Valid API keys?
   - Services active?

3. **Consult documentation:**
   - This guide
   - Supabase docs
   - Anthropic docs
   - Vercel docs

4. **Ask for help:**
   - Check GitHub issues
   - Contact team lead
   - Review deployment checklist
