/**
 * Create OC Script
 *
 * This script creates a new Original Character (OC) by calling the summon API.
 *
 * Usage:
 *   npx tsx scripts/create-oc.ts "A description of the OC"
 *
 * Example:
 *   npx tsx scripts/create-oc.ts "A shy robot who loves gardening"
 *
 * The script will:
 *   1. Generate OC personality, description, and visual style using Claude
 *   2. Create the OC in the database
 *   3. Generate avatar image
 *   4. Create starter items
 *   5. Post an introductory message
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Extract personality from generated OC data
 */
function generateOCFromDescription(description: string): Promise<any> {
  // For simplicity, we'll call the API directly
  // In production, you might want to use the AI SDK directly
  return Promise.resolve({})
}

/**
 * Create a new OC
 */
async function createOC(description: string): Promise<void> {
  console.log('\n✨ SoulForge OC Summoning\n')
  console.log(`📝 Description: "${description}"\n`)
  console.log('🔮 Calling summon API...\n')

  const startTime = performance.now()

  try {
    // Call the summon API
    const response = await fetch(`${supabaseUrl}/functions/v1/api/oc/summon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ description }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error: ${response.status} - ${error}`)
    }

    const result = await response.json()
    const duration = Math.round(performance.now() - startTime)

    if (!result.success) {
      console.error('❌ Failed to create OC')
      console.error('Error:', result.error)
      process.exit(1)
    }

    const oc = result.oc

    console.log('✅ OC created successfully!\n')
    console.log('📊 OC Details:')
    console.log(`  ID: ${oc.id}`)
    console.log(`  Name: ${oc.name}`)
    console.log(`  Description: ${oc.description?.substring(0, 100)}...`)
    console.log(`  Personality: ${oc.personality?.substring(0, 100)}...`)
    console.log(`  Avatar: ${oc.avatar_url}`)
    console.log(`  Items: ${oc.items?.length || 0}`)
    console.log(`\n⏱️  Total time: ${duration}ms\n`)

    // Save OC info to file
    const outputDir = path.join(process.cwd(), '.ocs')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const outputFile = path.join(outputDir, `${oc.name.toLowerCase().replace(/\s+/g, '-')}.json`)
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2))
    console.log(`💾 OC data saved to: ${outputFile}\n`)
  } catch (error) {
    console.error('\n❌ Error creating OC:', error instanceof Error ? error.message : error)

    // Try alternative: use local API
    console.log('\n🔄 Trying local development server...')
    console.log('Make sure the dev server is running: npm run dev\n')

    const apiUrl = 'http://localhost:3000/api/oc/summon'

    try {
      const localResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      })

      if (!localResponse.ok) {
        const error = await localResponse.text()
        throw new Error(`Local API error: ${localResponse.status} - ${error}`)
      }

      const result = await localResponse.json()
      const duration = Math.round(performance.now() - startTime)

      if (!result.success) {
        console.error('❌ Failed to create OC')
        console.error('Error:', result.error)
        process.exit(1)
      }

      const oc = result.oc

      console.log('✅ OC created successfully!\n')
      console.log('📊 OC Details:')
      console.log(`  ID: ${oc.id}`)
      console.log(`  Name: ${oc.name}`)
      console.log(`  Description: ${oc.description?.substring(0, 100)}...`)
      console.log(`  Personality: ${oc.personality?.substring(0, 100)}...`)
      console.log(`  Avatar: ${oc.avatar_url}`)
      console.log(`  Items: ${oc.items?.length || 0}`)
      console.log(`\n⏱️  Total time: ${duration}ms\n`)
    } catch (localError) {
      console.error('❌ Local API also failed:', localError instanceof Error ? localError.message : localError)
      console.log('\n💡 Make sure the development server is running:')
      console.log('   npm run dev\n')
      process.exit(1)
    }
  }
}

// Get description from command line argument
const description = process.argv[2]

if (!description) {
  console.log('\n✨ SoulForge OC Summoning\n')
  console.log('Usage: npx tsx scripts/create-oc.ts "description of the OC"\n')
  console.log('Example:')
  console.log('  npx tsx scripts/create-oc.ts "A shy robot who loves gardening"\n')
  process.exit(0)
}

// Run the script
createOC(description)
  .then(() => {
    console.log('✨ Done!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  })
