import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { requireAdmin } from '@/lib/session';
import { createDownloadUrl } from '@/lib/storage';

export const runtime = 'nodejs';
// Route nay doc DB va cookie -> khong duoc prerender luc build
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Doi id tep lay mot URL tai ve song 5 phut.
 * Bucket la private nen khong ai doan duoc duong dan de tai truc tiep.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Mã tệp không hợp lệ.' }, { status: 400 });
  }

  const [file] = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, id))
    .limit(1);

  if (!file) return NextResponse.json({ error: 'Không tìm thấy tệp.' }, { status: 404 });

  try {
    const url = await createDownloadUrl(file.storageKey, 300);
    return NextResponse.json({ url, fileName: file.fileName });
  } catch (e) {
    console.error('[admin:file]', e);
    return NextResponse.json({ error: 'Chưa tải được tệp.' }, { status: 500 });
  }
}
