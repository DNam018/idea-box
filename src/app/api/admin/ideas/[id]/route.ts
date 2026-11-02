import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { ideas, attachments } from '@/db/schema';
import { requireAdmin } from '@/lib/session';
import { removeFiles } from '@/lib/storage';

export const runtime = 'nodejs';
// Route nay doc DB va cookie -> khong duoc prerender luc build
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Ctx = { params: Promise<{ id: string }> };

/** Lay chi tiet mot y tuong kem danh sach tep. Panel goi rieng de
 *  danh sach ben trai khong phai tai lai. */
export async function GET(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Mã ý tưởng không hợp lệ.' }, { status: 400 });
  }

  const [idea] = await db.select().from(ideas).where(eq(ideas.id, id)).limit(1);
  if (!idea) return NextResponse.json({ error: 'Không tìm thấy ý tưởng.' }, { status: 404 });

  const files = await db
    .select()
    .from(attachments)
    .where(eq(attachments.ideaId, id))
    .orderBy(attachments.createdAt);

  return NextResponse.json({
    id: idea.id,
    title: idea.title,
    description: idea.description,
    domain: idea.domain,
    authorName: idea.authorName,
    isRead: idea.isRead,
    isPinned: idea.isPinned,
    adminNote: idea.adminNote,
    noteSavedAt: idea.noteSavedAt?.toISOString() ?? null,
    createdAt: idea.createdAt.toISOString(),
    files: files.map((f) => ({
      id: f.id,
      fileName: f.fileName,
      fileSize: f.fileSize,
      mimeType: f.mimeType,
    })),
  });
}

/** Cap nhat da doc / ghim / ghi chu noi bo. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Mã ý tưởng không hợp lệ.' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.isRead === 'boolean') patch.isRead = body.isRead;
  if (typeof body.isPinned === 'boolean') patch.isPinned = body.isPinned;
  if (typeof body.adminNote === 'string') {
    if (body.adminNote.length > 5000) {
      return NextResponse.json({ error: 'Ghi chú quá dài.' }, { status: 400 });
    }
    patch.adminNote = body.adminNote.trim() === '' ? null : body.adminNote;
    patch.noteSavedAt = new Date();
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Không có gì để cập nhật.' }, { status: 400 });
  }

  try {
    const [row] = await db.update(ideas).set(patch).where(eq(ideas.id, id)).returning();
    if (!row) return NextResponse.json({ error: 'Không tìm thấy ý tưởng.' }, { status: 404 });
    return NextResponse.json({
      ok: true,
      noteSavedAt: row.noteSavedAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error('[admin:PATCH]', e);
    return NextResponse.json({ error: 'Chưa lưu được. Vui lòng thử lại.' }, { status: 500 });
  }
}

/** Xoa y tuong: xoa tep tren Storage truoc, roi xoa ban ghi (attachments cascade). */
export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Mã ý tưởng không hợp lệ.' }, { status: 400 });
  }

  try {
    const files = await db
      .select({ key: attachments.storageKey })
      .from(attachments)
      .where(eq(attachments.ideaId, id));

    // Storage loi thi van xoa ban ghi - de lai file mo coi con hon
    // de lai y tuong ma admin tuong da xoa
    try {
      await removeFiles(files.map((f) => f.key));
    } catch (e) {
      console.error('[admin:DELETE] khong xoa duoc tep tren storage', e);
    }

    const [row] = await db.delete(ideas).where(eq(ideas.id, id)).returning({ id: ideas.id });
    if (!row) return NextResponse.json({ error: 'Không tìm thấy ý tưởng.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[admin:DELETE]', e);
    return NextResponse.json({ error: 'Chưa xóa được. Vui lòng thử lại.' }, { status: 500 });
  }
}
