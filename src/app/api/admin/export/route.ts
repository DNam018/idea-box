import { NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { ideas, attachments } from '@/db/schema';
import { requireAdmin } from '@/lib/session';
import { domainBySlug } from '@/lib/domains';
import { formatLong } from '@/lib/format';

export const runtime = 'nodejs';
// Route nay doc DB va cookie -> khong duoc prerender luc build
export const dynamic = 'force-dynamic';

/** Boc mot o CSV: nhan doi dau nhay, boc trong ngoac kep. */
function cell(value: string | number | null | undefined) {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const rows = await db
    .select({
      title: ideas.title,
      domain: ideas.domain,
      authorName: ideas.authorName,
      description: ideas.description,
      isRead: ideas.isRead,
      isPinned: ideas.isPinned,
      adminNote: ideas.adminNote,
      createdAt: ideas.createdAt,
      fileCount: sql<number>`(
        select count(*) from ${attachments} where ${attachments.ideaId} = ${ideas.id}
      )`.mapWith(Number),
    })
    .from(ideas)
    .orderBy(desc(ideas.createdAt));

  const header = [
    'Tiêu đề', 'Domain', 'Người gửi', 'Thời gian gửi',
    'Số tệp', 'Trạng thái', 'Ghim', 'Mô tả', 'Ghi chú nội bộ',
  ];

  const lines = [
    header.map(cell).join(','),
    ...rows.map((r) =>
      [
        cell(r.title),
        cell(domainBySlug(r.domain).label),
        cell(r.authorName ?? 'Ẩn danh'),
        cell(formatLong(r.createdAt)),
        cell(r.fileCount),
        cell(r.isRead ? 'Đã đọc' : 'Chưa đọc'),
        cell(r.isPinned ? 'Có' : ''),
        cell(r.description),
        cell(r.adminNote ?? ''),
      ].join(','),
    ),
  ];

  // BOM UTF-8: thieu no thi Excel tren Windows doc tieng Viet thanh ky tu la
  const csv = '﻿' + lines.join('\r\n');
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="idea-box-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
