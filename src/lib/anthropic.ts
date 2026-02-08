import { aiLogger } from './logger'

// Get AI model from environment variable
// Format: provider/model-name (e.g., anthropic/claude-3-5-sonnet-20241022)
// If using Vercel AI Gateway, Vercel AI SDK will automatically route through it
// Just set AI_MODEL environment variable and create a Gateway at https://vercel.com/dashboard/your-project/gateways
export const AI_MODEL = process.env.AI_MODEL || 'anthropic/claude-haiku-4.5'

aiLogger.info('AI model configured', {
  model: AI_MODEL,
  hasGateway: !!process.env.AI_MODEL,
  gatewayRouting: process.env.AI_MODEL ? 'Enabled (if Gateway created)' : 'Direct API'
})


