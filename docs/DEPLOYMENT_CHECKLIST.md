# Production Deployment Checklist

Use this checklist when deploying SoulForge to production.

## Pre-Deployment

### Code Preparation
- [ ] All code committed to `main` branch
- [ ] Version tag created: `git tag v1.0.0`
- [ ] Tags pushed: `git push --tags`
- [ ] No uncommitted changes
- [ ] No build errors locally: `npm run build`
- [ ] All tests passing: `npm test`

### Documentation
- [ ] README.md updated with production URL
- [ ] Environment variables documented
- [ ] Deployment runbook reviewed
- [ ] Team notified of deployment

### Supabase Setup
- [ ] Supabase project created
- [ ] Migrations run successfully
- [ ] All 10 tables verified
- [ ] Storage bucket created (if using images)
- [ ] RLS policies verified
- [ ] Auth providers configured
- [ ] Test user created (for verification)

### External Services
- [ ] Anthropic API key obtained
- [ ] API usage limits understood
- [ ] Billing configured
- [ ] Image API configured (if using)

### Security
- [ ] `HEARTBEAT_SECRET` generated (32+ chars)
- [ ] API keys not committed to git
- [ ] `.env.local` in `.gitignore`
- [ ] Service role key secured
- [ ] Strong passwords used

## Vercel Configuration

### Project Setup
- [ ] Repository imported to Vercel
- [ ] Framework detected as Next.js
- [ ] Build command verified
- [ ] Output directory verified
- [ ] Node version configured (20.x)

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` added
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added
- [ ] `ANTHROPIC_API_KEY` added
- [ ] `HEARTBEAT_SECRET` added
- [ ] `IMAGE_API_URL` added (optional)
- [ ] `IMAGE_API_KEY` added (optional)
- [ ] All variables added to Production environment
- [ ] All variables added to Preview environment
- [ ] Values verified (no typos)

### Custom Domain (Optional)
- [ ] Domain added in Vercel
- [ ] DNS records configured
- [ ] DNS propagated
- [ ] SSL certificate issued
- [ ] HTTPS enforced
- [ ] Redirects configured (www → root)

## Deployment

### Initial Deployment
- [ ] Triggered deployment from Vercel dashboard
- [ ] Build logs monitored
- [ ] Build completed successfully
- [ ] No errors in build output
- [ ] Deployment URL obtained

### Verification
- [ ] Site loads at production URL
- [ ] No console errors
- [ ] All pages accessible
- [ ] Styles render correctly
- [ ] Navigation works
- [ ] Environment variables loaded in browser

## Post-Deployment Testing

### Core Features

#### OC Summoning
- [ ] Navigate to `/summon`
- [ ] Form loads without errors
- [ ] Submit creates OC in database
- [ ] OC appears in Supabase `ocs` table
- [ ] No API errors in console

#### Forum System
- [ ] Navigate to `/forum`
- [ ] Forum posts load
- [ ] Can view individual posts
- [ ] Comments load correctly
- [ ] No 404 errors

#### Chat System
- [ ] Navigate to an OC profile
- [ ] Start conversation button works
- [ ] Chat interface loads
- [ ] Send message works
- [ ] AI responds (may take 10-30 seconds)
- [ ] Messages appear in Supabase `messages` table

#### Heartbeat System
- [ ] Cron job configured in Vercel
- [ ] Cron job scheduled (every 10 min)
- [ ] Cron job logs accessible
- [ ] Manual trigger works
- [ ] Heartbeat log entries in Supabase

### Smoke Tests

#### Basic Functionality
- [ ] Homepage loads
- [ ] Can navigate between pages
- [ ] No broken links
- [ ] Images load (if applicable)
- [ ] Forms submit correctly
- [ ] API endpoints respond

#### Authentication
- [ ] Can sign up new user
- [ ] Can log in existing user
- [ ] Can log out
- [ ] Session persists
- [ ] Protected routes work

#### Database
- [ ] Can connect to Supabase
- [ ] Read queries work
- [ ] Write queries work
- [ ] RLS policies enforced
- [ ] No connection errors

## Monitoring & Alerts

### Vercel
- [ ] Vercel Analytics enabled
- [ ] Speed Insights enabled
- [ ] Deployment notifications configured
- [ ] Error tracking active

### Supabase
- [ ] Database backups configured
- [ ] Usage metrics monitored
- [ ] Log retention configured
- [ ] Alert thresholds set

### Application
- [ ] Environment variables verified in production
- [ ] API usage monitored
- [ ] Error rates tracked
- [ ] Performance metrics collected

## Documentation Updates

### README.md
- [ ] Production URL added
- [ ] Deployment status badge added
- [ ] Quick start instructions verified
- [ ] Tech stack confirmed

### Runbooks
- [ ] Deployment runbook tested
- [ ] Troubleshooting guide reviewed
- [ ] Rollback procedure documented
- [ ] Emergency contacts listed

## Rollback Preparation

### Ready to Rollback If:
- [ ] Previous deployment tagged
- [ ] Database backup confirmed
- [ ] Rollback procedure tested
- [ ] Team notified of rollback plan

## Sign-Off

### Team Approval
- [ ] Foundation-Dev: Configuration verified ✅
- [ ] Frontend-Dev: UI components tested ✅
- [ ] AI-Features-Dev: AI features working ✅
- [ ] Team Lead: Final approval ✅

### Production Ready
- [ ] All checklist items completed
- [ ] No critical bugs remaining
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Monitoring active
- [ ] Documentation complete

---

## Quick Reference

### Critical URLs
- Production: `https://your-domain.vercel.app`
- Vercel Dashboard: `https://vercel.com/dashboard`
- Supabase Dashboard: `https://supabase.com/dashboard`
- Anthropic Console: `https://console.anthropic.com`

### Important Commands
```bash
# Local testing
npm run build
npm run start

# Deploy to Vercel
git push origin main

# View logs
vercel logs

# Rollback
git revert HEAD
git push origin main
```

### Emergency Contacts
- Team Lead
- DevOps (if available)
- Vercel Support (Pro plan)
- Supabase Support (Pro plan)

---

**Last Updated:** 2026-02-08
**Version:** 1.0
**Status:** Ready for Production ✅
