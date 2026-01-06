import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const result = await db.$client.execute({
      sql: `
        DELETE FROM moomoo_import_staging 
        WHERE user_id = ? 
        AND (status = 'rejected_duplicate' OR status = 'rejected_error')
      `,
      args: [userId]
    });

    return NextResponse.json({
      message: 'Rejected records cleared',
      deletedCount: result.rowsAffected || 0
    });

  } catch (error: any) {
    console.error('Error clearing rejected records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}