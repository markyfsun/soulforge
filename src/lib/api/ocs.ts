import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type OC = Database['public']['Tables']['ocs']['Row']

/**
 * Check if any OCs exist in the world
 */
export async function checkWorldHasOCs(): Promise<boolean> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('ocs')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error checking OCs:', error)
    return false
  }

  return (count ?? 0) > 0
}

/**
 * Get total count of OCs in the world
 */
export async function getOCCount(): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('ocs')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error getting OC count:', error)
    return 0
  }

  return count ?? 0
}

/**
 * Get all OCs with basic info
 */
export async function getAllOCs(): Promise<OC[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ocs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching OCs:', error)
    return []
  }

  return data ?? []
}
