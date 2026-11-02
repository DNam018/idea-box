import { NextResponse } from 'next/server';
import { createUploadUrl } from '@/lib/storage';
import { ALLOWED_MIME, LIMITS } from '@/lib/domains';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/** Bo ky tu nguy hiem khoi ten file truoc khi dung lam duong dan storage. */
function safeName(name: string) {
  return name
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}._ -]/gu, '_')
    .slice(0, 120);
}

export async function POST(req: Request) {
  const limited = rateLimit(`upload:${clientIp(req)}`, 30, 10 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Bạn đang tải lên quá nhiều tệp. Vui lòng thử lại sau ít phút.' },
      { status: 429 },
    );
  }

  let body: { fileName?: unknown; mimeType?: unknown; fileSize?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  const { fileName, mimeType, fileSize } = body;

  if (typeof fileName !== 'string' || fileName.trim() === '') {
    return NextResponse.json({ error: 'Thiếu tên tệp.' }, { status: 400 });
  }
  if (typeof mimeType !== 'string' || !(mimeType in ALLOWED_MIME)) {
    return NextResponse.json({ error: 'Định dạng tệp không được hỗ trợ.' }, { status: 400 });
  }
  if (typeof fileSize !== 'number' || !Number.isFinite(fileSize) || fileSize <= 0) {
    return NextResponse.json({ error: 'Kích thước tệp không hợp lệ.' }, { status: 400 });
  }
  if (fileSize > LIMITS.fileMaxBytes) {
    return NextResponse.json({ error: 'Tệp vượt quá 6 MB.' }, { status: 400 });
  }

  // Moi file mot thu muc uuid rieng -> khong doan duoc duong dan, khong trung ten
  const storageKey = `${crypto.randomUUID()}/${safeName(fileName)}`;

  try {
    const result = await createUploadUrl(storageKey);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[upload-url]', e);
    return NextResponse.json({ error: 'Chưa tạo được liên kết tải lên.' }, { status: 500 });
  }
}
