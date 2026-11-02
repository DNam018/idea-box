import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ideas, attachments } from '@/db/schema';
import { DOMAIN_SLUGS, LIMITS, ALLOWED_MIME } from '@/lib/domains';
import { fileExists } from '@/lib/storage';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

type IncomingFile = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
};

export async function POST(req: Request) {
  // 5 y tuong / 10 phut / IP - du rong cho nguoi that, chan bot gui hang loat
  const limited = rateLimit(`idea:${clientIp(req)}`, 5, 10 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Bạn vừa gửi khá nhiều ý tưởng. Vui lòng thử lại sau ít phút.' },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  // Honeypot: truong an, nguoi that khong bao gio dien. Tra ve 200 gia
  // de bot tuong da gui thanh cong va khong thu lai.
  if (typeof body.website === 'string' && body.website !== '') {
    return NextResponse.json({ ok: true });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const domain = typeof body.domain === 'string' ? body.domain : '';
  const authorRaw = typeof body.authorName === 'string' ? body.authorName.trim() : '';

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = 'Vui lòng nhập tiêu đề.';
  else if (title.length > LIMITS.titleMax) fieldErrors.title = `Tiêu đề tối đa ${LIMITS.titleMax} ký tự.`;

  if (!domain) fieldErrors.domain = 'Vui lòng chọn một domain.';
  else if (!DOMAIN_SLUGS.includes(domain)) fieldErrors.domain = 'Domain không hợp lệ.';

  if (!description) fieldErrors.description = 'Vui lòng nhập mô tả.';
  else if (description.length > LIMITS.descriptionMax)
    fieldErrors.description = `Mô tả tối đa ${LIMITS.descriptionMax} ký tự.`;

  if (authorRaw.length > LIMITS.authorMax)
    fieldErrors.authorName = `Tên tối đa ${LIMITS.authorMax} ký tự.`;

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ fieldErrors }, { status: 400 });
  }

  // Loc danh sach tep: chi nhan nhung gi hop le va da thuc su nam tren Storage
  const rawFiles = Array.isArray(body.files) ? (body.files as unknown[]) : [];
  if (rawFiles.length > LIMITS.fileMaxCount) {
    return NextResponse.json(
      { error: `Chỉ đính kèm tối đa ${LIMITS.fileMaxCount} tệp.` },
      { status: 400 },
    );
  }

  const files: IncomingFile[] = [];
  for (const f of rawFiles) {
    if (typeof f !== 'object' || f === null) continue;
    const { fileName, fileSize, mimeType, storageKey } = f as Record<string, unknown>;
    if (
      typeof fileName !== 'string' ||
      typeof storageKey !== 'string' ||
      typeof mimeType !== 'string' ||
      typeof fileSize !== 'number' ||
      !(mimeType in ALLOWED_MIME) ||
      fileSize <= 0 ||
      fileSize > LIMITS.fileMaxBytes ||
      !/^[0-9a-f-]{36}\//.test(storageKey)
    ) {
      return NextResponse.json({ error: 'Tệp đính kèm không hợp lệ.' }, { status: 400 });
    }
    if (!(await fileExists(storageKey))) {
      return NextResponse.json(
        { error: 'Một tệp chưa tải lên xong. Vui lòng thử lại.' },
        { status: 400 },
      );
    }
    files.push({ fileName, fileSize, mimeType, storageKey });
  }

  try {
    const id = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(ideas)
        .values({
          title,
          description,
          domain,
          authorName: authorRaw === '' ? null : authorRaw,
        })
        .returning({ id: ideas.id });

      if (files.length > 0) {
        await tx.insert(attachments).values(
          files.map((f) => ({
            ideaId: row.id,
            fileName: f.fileName,
            fileSize: f.fileSize,
            mimeType: f.mimeType,
            storageKey: f.storageKey,
          })),
        );
      }
      return row.id;
    });

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error('[ideas:POST]', e);
    return NextResponse.json(
      { error: 'Chưa gửi được. Vui lòng thử lại.' },
      { status: 500 },
    );
  }
}
