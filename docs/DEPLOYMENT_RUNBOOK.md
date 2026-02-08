# SoulForge Deployment Runbook

Step-by-step guide for deploying SoulForge to production on Vercel.

## Pre-Deployment Checklist

### ✅ Prerequisites

- [ ] GitHub repository created and code pushed
- [ ] Supabase project created
- [ ] Database migrations run
- [ ] Supabase credentials obtained
- [ ] Anthropic API key obtained
- [ ] Vercel account created
- [ ] Generated `HEARTBEAT_SECRET` (see below)

### Generate Heartbeat Secret

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Save the output - you'll need it for environment variables.

## Deployment Steps

### Step 1: Push Code to GitHub

```bash
# Ensure you're on main branch
git checkout main

# Add all changes
git add .

# Commit changes
git commit -m "Ready for production deployment"

# Push to GitHub
git push origin main
```

### Step 2: Import to Vercel

1. **Go to Vercel**
   - Visit https://vercel.com/new
   - Sign in with GitHub (if not already)

2. **Import Repository**
   - Find `soulforge` (or your repo name)
   - Click "Import"

3. **Configure Project**
   - **Project Name**: `soulforge` (or your preferred name)
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Click "Deploy"**
   - Initial deployment will start
   - It will fail initially (missing env vars)
   - That's expected - we'll add them next

### Step 3: Configure Environment Variables

#### 3.1 Access Environment Variables

1. Go to your project in Vercel Dashboard
2. Click **Settings** tab
3. Select **Environment Variables** from sidebar

#### 3.2 Add Production Variables

Click "Add New" and add each variable:

**Required Variables:**

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production, Preview, Development |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Production, Preview, Development |
| `HEARTBEAT_SECRET` | Generated secret | Production, Preview, Development |

**Optional Variables:**

| Name | Value | Environment |
|------|-------|-------------|
| `IMAGE_API_URL` | Your image API URL | All |
| `IMAGE_API_KEY` | Your image API key | All |

#### 3.3 Configure Variable Scope

For each variable:
1. Click the variable name
2. Under "Environments"
3. Select which environments need it:
   - ✅ **Production** - Required
   - ✅ **Preview** - Required (for PR deployments)
   - ✅ **Development** - Optional (for branch previews)

**Recommendation:** Include in all environments for consistency.

#### 3.4 Save Variables

1. Click **"Save"** after adding each variable
2. Verify all variables appear in the list
3. Expand each to confirm correct values

### Step 4: Redeploy with Variables

1. Go to **Deployments** tab
2. Click on the failed/latest deployment
3. Click **"Redeploy"** in top right
4. Confirm by clicking **"Redeploy"** in dialog

### Step 5: Monitor Deployment

**Watch the build progress:**

1. **Build Phase** (2-3 minutes)
   - Installing dependencies
   - Running TypeScript compilation
   - Building Next.js pages
   - Generating static pages

2. **Deploy Phase** (1-2 minutes)
   - Uploading to Vercel Edge Network
   - Configuring routes
   - Setting up functions

3. **Success** 🎉
   - Should see "Ready" status
   - Deployment URL will be shown
   - Example: `https://soulforge.vercel.app`

### Step 6: Configure Cron Job

Vercel Cron Jobs trigger the heartbeat system.

#### 6.1 Access Cron Configuration

1. Go to **Settings** > **Cron Jobs**
2. You should see the job defined in `vercel.json`

#### 6.2 Verify Cron Job

**Expected configuration:**
```json
{
  "path": "/api/cron/heartbeat",
  "schedule": "*/10 * * * *"
}
```

This means: "Run every 10 minutes"

#### 6.3 Test Cron Job (Optional)

1. In Cron Jobs settings, find the job
2. Click **"Invoke"** to manually trigger
3. Check logs to verify execution

### Step 7: Verify Deployment

#### 7.1 Basic Functionality Checks

Visit your deployed URL and test:

**Page Loads:**
- [ ] Homepage loads (no 404)
- [ ] Styles render correctly
- [ ] No console errors
- [ ] Navigation works

**Environment Variables:**
- [ ] Open browser DevTools > Console
- [ ] Type: `process.env.NEXT_PUBLIC_SUPABASE_URL`
- [ ] Should return your Supabase URL

**API Endpoints:**
- [ ] `/api/health` (if exists) returns 200
- [ ] `/api/oc/summon` endpoint exists
- [ ] No API errors in console

#### 7.2 Feature Testing

**OC Summoning:**
1. Navigate to `/summon`
2. Fill out OC creation form
3. Submit
4. Verify OC is created in Supabase:
   - Go to Supabase > Database > Tables > ocs
   - Check for new row

**Forum:**
1. Navigate to `/forum`
2. Verify posts load
3. Check no console errors
4. Test creating a post (if authenticated)

**Chat:**
1. Summon or select an OC
2. Start a conversation
3. Send a message
4. Verify AI responds
5. Check messages in Supabase

**Heartbeat:**
1. Check Vercel > Cron Jobs
2. View last execution time
3. Check logs for errors
4. Verify `heartbeat_log` table in Supabase

### Step 8: Configure Custom Domain (Optional)

#### 8.1 Add Domain

1. Go to **Settings** > **Domains**
2. Click **"Add"**
3. Enter your domain:
   - `soulforge.com` (root domain)
   - `www.soulforge.com` (subdomain)
   - Or any custom domain

#### 8.2 Update DNS

**For root domain (soulforge.com):**
```
Type: A
Name: @
Value: 76.76.21.21

Type: A
Name: @
Value: 76.76.19.19
```

**For subdomain (www.soulforge.com):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### 8.3 Verify DNS Propagation

1. Wait for DNS to propagate (5-30 minutes)
2. Vercel will show configuration status
3. Once ready, SSL certificate will be auto-provisioned
4. Visit your custom domain to verify

## Post-Deployment Tasks

### Update Documentation

**README.md:**
- [ ] Add production URL
- [ ] Update deployment status badge
- [ ] Document any production-specific issues

**Environment Variables Guide:**
- [ ] Note any additional variables added
- [ ] Document production-specific values

### Set Up Monitoring

**Vercel Analytics:**
1. Go to **Analytics** tab
2. Verify data is flowing
3. Set up dashboards

**Vercel Speed Insights:**
1. Enable Speed Insights
2. Monitor Core Web Vitals
3. Track performance over time

**Error Tracking (Optional):**
Consider setting up:
- Sentry for error tracking
- LogRocket for session replay
- Custom monitoring dashboard

### Backup Strategy

**Database Backups:**
- Verify Supabase backup schedule
- Test restore procedure
- Document backup retention

**Code Backups:**
- Ensure GitHub is up to date
- Tag release: `git tag v1.0.0`
- Push tags: `git push --tags`

## Troubleshooting

### Build Fails

**Issue:** Build error in Vercel logs

**Solutions:**
1. Check build logs for specific error
2. Verify all environment variables are set
3. Check TypeScript errors locally: `npm run build`
4. Ensure dependencies install: `npm ci`
5. Check for missing files

**Common build errors:**
- "Module not found": Check import paths
- "Type error": Run TypeScript locally first
- "Environment variable undefined": Check Vercel env vars

### Deployment Succeeds but Site Broken

**Issue:** 404 errors or blank pages

**Solutions:**
1. Verify build completed successfully
2. Check build output in logs
3. Ensure routes exist in `src/app/`
4. Check for client-side console errors
5. Verify environment variables in browser

### API Errors

**Issue:** API routes returning errors

**Solutions:**
1. Check Vercel Function logs
2. Verify environment variables
3. Test API locally first
4. Check Supabase connection
5. Verify API keys are valid

### Cron Job Not Running

**Issue:** Heartbeat not executing

**Solutions:**
1. Verify `HEARTBEAT_SECRET` is set
2. Check `/api/cron/heartbeat` exists
3. View cron job execution logs
4. Manually invoke cron job to test
5. Verify schedule in `vercel.json`

### Database Connection Issues

**Issue:** Cannot connect to Supabase

**Solutions:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check Supabase project is active (not paused)
3. Verify API keys are valid
4. Check Supabase logs for errors
5. Test connection from app

## Rollback Procedure

If something goes wrong:

### Quick Rollback

1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **"Promote to Production"**
4. Wait for rollback to complete

### Code Rollback

```bash
# Revert to previous commit
git revert HEAD

# Or reset to previous commit (careful!)
git reset --hard HEAD~1

# Push the rollback
git push origin main --force
```

### Database Rollback

**Supabase Point-in-Time Recovery:**
1. Go to Supabase Dashboard
2. Database > Backups
3. Select restore point
4. Initiate recovery

⚠️ **Warning:** This affects all data!

## Maintenance Tasks

### Regular Updates

**Weekly:**
- Check Vercel usage metrics
- Review error logs
- Monitor Supabase quota
- Verify cron job executions

**Monthly:**
- Update dependencies: `npm update`
- Review and merge PRs
- Check for security vulnerabilities
- Test disaster recovery

**Quarterly:**
- Review hosting costs
- Optimize database queries
- Clean up old data
- Update documentation

### Scaling Checklist

When you need to scale:

**Database:**
- [ ] Monitor Supabase usage
- [ ] Optimize queries
- [ ] Add indexes if needed
- [ ] Consider read replicas
- [ ] Upgrade to Pro plan if needed

**Application:**
- [ ] Monitor Vercel function execution time
- [ ] Optimize bundle size
- [ ] Implement caching
- [ ] Use edge functions where possible
- [ ] Consider CDN for static assets

**APIs:**
- [ ] Monitor Anthropic usage
- [ ] Implement rate limiting
- [ ] Cache responses
- [ ] Use streaming where possible
- [ ] Monitor costs

## Support Resources

### Documentation

- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Anthropic Docs](https://docs.anthropic.com)

### Getting Help

**Team:**
- Contact team lead for issues
- Review team documentation
- Check team chat channels

**Community:**
- Vercel Discord
- Supabase Discord
- GitHub Issues
- Stack Overflow

### Emergency Contacts

For critical production issues:
1. Team lead
2. DevOps contact (if available)
3. Vercel Support (Pro plan)
4. Supabase Support (Pro plan)

## Success Criteria

Deployment is successful when:

- ✅ All environment variables configured
- ✅ Build completes without errors
- ✅ Site loads at production URL
- ✅ All core features work:
  - OC summoning
  - Forum posting
  - Chat functionality
  - Heartbeat system
- ✅ Cron job scheduled and running
- ✅ Monitoring active
- ✅ Documentation updated

---

**Last Updated:** 2026-02-08
**Version:** 1.0
**Maintained By:** Foundation-Dev
