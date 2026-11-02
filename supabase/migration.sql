-- ============================================================
-- Idea Box - schema khoi tao
-- Chay 1 lan trong Supabase Dashboard > SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists ideas (
  id            uuid primary key default gen_random_uuid(),
  title         varchar(100) not null check (char_length(btrim(title)) > 0),
  description   text         not null check (char_length(btrim(description)) > 0
                                             and char_length(description) <= 2000),
  domain        varchar(32)  not null check (domain in (
                  'nang-suat','ai-automation','model-ai-moi',
                  'use-case-khac','xu-huong','khac')),
  author_name   varchar(100),
  is_read       boolean      not null default false,
  is_pinned     boolean      not null default false,
  admin_note    text,
  note_saved_at timestamptz,
  created_at    timestamptz  not null default now()
);

create index if not exists ideas_created_at_idx on ideas (created_at desc);
create index if not exists ideas_domain_idx     on ideas (domain);

create table if not exists attachments (
  id          uuid primary key default gen_random_uuid(),
  idea_id     uuid not null references ideas(id) on delete cascade,
  file_name   varchar(255) not null,
  file_size   bigint       not null check (file_size > 0 and file_size <= 6291456),
  mime_type   varchar(128) not null,
  storage_key varchar(512) not null,
  created_at  timestamptz  not null default now()
);

create index if not exists attachments_idea_id_idx on attachments (idea_id);

-- ------------------------------------------------------------
-- Row Level Security
-- App nay KHONG goi Supabase tu trinh duyet: moi truy van deu di qua
-- route handler cua Next.js bang connection string / service_role key,
-- von bo qua RLS. Bat RLS va KHONG tao policy nao la lop chan cuoi:
-- neu anon key co lo ra ngoai thi cung khong doc/ghi duoc gi.
-- ------------------------------------------------------------
alter table ideas       enable row level security;
alter table attachments enable row level security;

-- ------------------------------------------------------------
-- Bucket luu tep dinh kem (private)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 6291456)
on conflict (id) do update set public = false, file_size_limit = 6291456;
