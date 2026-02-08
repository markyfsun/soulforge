import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch all OCs ordered by creation date
    const { data: ocs, error } = await supabase
      .from('ocs')
      .select('id, name, description, avatar_url, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching OCs:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch OCs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: ocs || [],
    })
  } catch (error) {
    console.error('Error in OCs API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
