import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { ideas, attachments } from '@/db/schema';
import { DOMAIN_SLUGS } from '@/lib/domains';
import { env } from '@/lib/env';
import AdminBoard from '@/components/AdminBoard';

export const metadata = { title: 'Quản trị · Idea Box' };
// Danh sach phai luon tuoi: khong cache giua cac lan tai
export const dynamic = 'force-dynamic';

type Search = {
  q?: string; domain?: string; read?: string; pinned?: string; id?: string;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;

  const q = (sp.q ?? '').trim();
  const domain = DOMAIN_SLUGS.includes(sp.domain ?? '') ? sp.domain! : '';
  const read = sp.read === 'read' || sp.read === 'unread' ? sp.read : '';
  const pinned = sp.pinned === '1';
  const selectedId = sp.id ?? '';  // chi dung de mo san panel khi tai lai trang

  const filters: (SQL | undefined)[] = [
    q
      ? or(
          ilike(ideas.title, `%${q}%`),
          ilike(ideas.description, `%${q}%`),
          ilike(ideas.authorName, `%${q}%`),
        )
      : undefined,
    domain ? eq(ideas.domain, domain) : undefined,
    read === 'unread' ? eq(ideas.isRead, false) : undefined,
    read === 'read' ? eq(ideas.isRead, true) : undefined,
    pinned ? eq(ideas.isPinned, true) : undefined,
  ];
  const where = filters.some(Boolean) ? and(...filters) : undefined;

  // Mot vong goi DB thay vi bon, vi moi truy van di Frankfurt mat vai tram ms
  const [list, statRows] = await Promise.all([
    db
      .select({
        id: ideas.id,
        title: ideas.title,
        domain: ideas.domain,
        authorName: ideas.authorName,
        isRead: ideas.isRead,
        isPinned: ideas.isPinned,
        createdAt: ideas.createdAt,
        fileCount: sql<number>`(
          select count(*) from ${attachments} where ${attachments.ideaId} = ${ideas.id}
        )`.mapWith(Number),
      })
      .from(ideas)
      .where(where)
      .orderBy(desc(ideas.createdAt))
      .limit(500),
    db
      .select({
        total: sql<number>`count(*)`.mapWith(Number),
        unread: sql<number>`count(*) filter (where ${ideas.isRead} = false)`.mapWith(Number),
        thisWeek: sql<number>`count(*) filter (
          where ${ideas.createdAt} >= date_trunc('week', now() at time zone 'Asia/Ho_Chi_Minh')
                                      at time zone 'Asia/Ho_Chi_Minh'
        )`.mapWith(Number),
      })
      .from(ideas),
  ]);

  return (
    <AdminBoard
      ideas={list.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() }))}
      stats={statRows[0] ?? { total: 0, unread: 0, thisWeek: 0 }}
      filters={{ q, domain, read, pinned }}
      initialSelectedId={selectedId}
      adminEmail={env.adminEmail}
    />
  );
}

