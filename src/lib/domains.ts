/**
 * 6 domain co dinh, dung chung cho form, filter va tag mau.
 * `slug` luu xuong DB, `label` hien thi, `tagClass` khop voi .d1...d6 trong globals.css
 */
export const DOMAINS = [
  { slug: 'nang-suat', label: 'Năng suất & chất lượng', tagClass: 'd1' },
  { slug: 'ai-automation', label: 'AI & Automation', tagClass: 'd2' },
  { slug: 'model-ai-moi', label: 'Model AI mới', tagClass: 'd3' },
  { slug: 'use-case-khac', label: 'Use case từ dự án khác', tagClass: 'd4' },
  { slug: 'xu-huong', label: 'Xu hướng thị trường', tagClass: 'd5' },
  { slug: 'khac', label: 'Khác', tagClass: 'd6' },
] as const;

export type DomainSlug = (typeof DOMAINS)[number]['slug'];

export const DOMAIN_SLUGS = DOMAINS.map((d) => d.slug) as readonly string[];

export function domainBySlug(slug: string) {
  return DOMAINS.find((d) => d.slug === slug) ?? DOMAINS[DOMAINS.length - 1];
}

/** Gioi han theo design, da chot 6 MB thay cho 20 MB ban dau. */
export const LIMITS = {
  titleMax: 100,
  descriptionMax: 2000,
  authorMax: 100,
  fileMaxBytes: 6 * 1024 * 1024,
  fileMaxCount: 5,
} as const;

export const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
};

/** "1,8 MB" - dinh dang kieu Viet nhu trong design. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}
