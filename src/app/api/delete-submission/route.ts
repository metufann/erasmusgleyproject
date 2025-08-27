import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'

export async function DELETE(request: NextRequest) {
  try {
    const { submissionId, adminDeleteCode } = await request.json()

    if (!submissionId || !adminDeleteCode) {
      return NextResponse.json(
        { error: 'Submission ID and admin delete code are required' },
        { status: 400 }
      )
    }

    // Verify admin delete code
    const { data: adminCode, error: adminCodeError } = await supabaseAdmin
      .from('admin_delete_code')
      .select('*')
      .eq('code_hash', createHash('sha1').update(adminDeleteCode).digest('hex'))
      .single()

    if (adminCodeError || !adminCode) {
      return NextResponse.json(
        { error: 'Invalid admin delete code' },
        { status: 401 }
      )
    }

    // Get submission details
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Delete from storage first
    if (submission.image_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('submissions')
        .remove([submission.image_path])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        // Continue with database deletion even if storage fails
      }
    }

    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('submissions')
      .delete()
      .eq('id', submissionId)

    if (dbError) {
      console.error('Database deletion error:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully'
    })

  } catch (error) {
    console.error('Delete submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 