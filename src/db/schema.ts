import {
  pgTable, uuid, varchar, text, boolean, timestamp, bigint, index,
} from 'drizzle-orm/pg-core';

export const ideas = pgTable(
  'ideas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 100 }).notNull(),
    description: text('description').notNull(),
    /** slug trong DOMAINS, rang buoc bang CHECK o migration.sql */
    domain: varchar('domain', { length: 32 }).notNull(),
    /** null = An danh */
    authorName: varchar('author_name', { length: 100 }),
    isRead: boolean('is_read').notNull().default(false),
    isPinned: boolean('is_pinned').notNull().default(false),
    adminNote: text('admin_note'),
    noteSavedAt: timestamp('note_saved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    createdIdx: index('ideas_created_at_idx').on(t.createdAt),
    domainIdx: index('ideas_domain_idx').on(t.domain),
  }),
);

export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ideaId: uuid('idea_id')
      .notNull()
      .references(() => ideas.id, { onDelete: 'cascade' }),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    mimeType: varchar('mime_type', { length: 128 }).notNull(),
    /** Duong dan trong bucket Supabase Storage */
    storageKey: varchar('storage_key', { length: 512 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ ideaIdx: index('attachments_idea_id_idx').on(t.ideaId) }),
);

export type Idea = typeof ideas.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
