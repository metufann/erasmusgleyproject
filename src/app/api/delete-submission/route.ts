import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'

export async function DELETE(request: NextRequest) {
  try {
    const { submissionId, groupKey, adminDeleteCode } = await request.json()

    if ((!submissionId && !groupKey) || !adminDeleteCode) {
      return NextResponse.json(
        { error: 'Submission ID or groupKey and admin delete code are required' },
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

    if (groupKey) {
      // Delete entire group by prefix: <countryId>/<batchId>/
      const prefix = `${groupKey}/`

      const { data: rows, error: listError } = await supabaseAdmin
        .from('submissions')
        .select('id, image_path')
        .like('image_path', `${prefix}%`)

      if (listError) {
        return NextResponse.json(
          { error: 'Failed to find group submissions' },
          { status: 500 }
        )
      }

      const paths = (rows || []).map(r => r.image_path).filter(Boolean)
      if (paths.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage
          .from('submissions')
          .remove(paths)
        if (storageError) {
          console.error('Storage deletion error:', storageError)
        }
      }

      const { error: dbError } = await supabaseAdmin
        .from('submissions')
        .delete()
        .like('image_path', `${prefix}%`)

      if (dbError) {
        console.error('Database deletion error:', dbError)
        return NextResponse.json(
          { error: 'Failed to delete group' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: 'Post deleted successfully' })
    } else {
      // Single submission delete fallback
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

      if (submission.image_path) {
        const { error: storageError } = await supabaseAdmin.storage
          .from('submissions')
          .remove([submission.image_path])
        if (storageError) {
          console.error('Storage deletion error:', storageError)
        }
      }

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

      return NextResponse.json({ success: true, message: 'Submission deleted successfully' })
    }

  } catch (error) {
    console.error('Delete submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 