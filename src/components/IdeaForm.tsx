'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DOMAINS, LIMITS, ALLOWED_MIME, formatBytes } from '@/lib/domains';
import {
  IconAlert, IconCheck, IconClose, IconUpload, fileIcon,
} from '@/components/icons';

type Uploaded = {
  id: string;
  name: string;
  size: number;
  mime: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
  storageKey?: string;
};

type FieldErrors = Partial<
  Record<'title' | 'domain' | 'description' | 'authorName', string>
>;

const ACCEPT = Object.keys(ALLOWED_MIME).join(',');

/** Thong bao loi nho duoi tung truong, khop .err-msg trong design. */
function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <span className="err-msg" id={id}>
      <IconAlert small />
      {children}
    </span>
  );
}

export default function IdeaForm() {
  const router = useRouter();

  const [authorName, setAuthorName] = useState('');
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<Uploaded[]>([]);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const descRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const domainRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Textarea tu gian theo noi dung, dung nhu design mo ta
  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 168)}px`;
  }, [description]);

  const uploading = files.some((f) => f.status === 'uploading');
  const uploadPercent = uploading
    ? Math.round(
        files.filter((f) => f.status === 'uploading').reduce((s, f) => s + f.progress, 0) /
          files.filter((f) => f.status === 'uploading').length,
      )
    : 100;

  const patch = useCallback((id: string, next: Partial<Uploaded>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...next } : f)));
  }, []);

  /** Xin URL co chu ky roi PUT thang file len Storage, khong qua server minh. */
  const upload = useCallback(
    async (entry: Uploaded, file: File) => {
      try {
        const res = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Tải lên thất bại.');

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', data.uploadUrl);
          xhr.setRequestHeader('content-type', file.type);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              patch(entry.id, { progress: Math.round((e.loaded / e.total) * 100) });
            }
          };
          xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error('Tải lên thất bại.'));
          xhr.onerror = () => reject(new Error('Mất kết nối khi tải tệp.'));
          xhr.send(file);
        });

        patch(entry.id, { status: 'done', progress: 100, storageKey: data.storageKey });
      } catch (e) {
        patch(entry.id, {
          status: 'error',
          error: e instanceof Error ? e.message : 'Tải lên thất bại.',
        });
      }
    },
    [patch],
  );

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const incoming = Array.from(list);

      setFiles((prev) => {
        const slots = LIMITS.fileMaxCount - prev.length;
        if (slots <= 0) {
          setBanner(`Chỉ đính kèm tối đa ${LIMITS.fileMaxCount} tệp.`);
          return prev;
        }
        const next: Uploaded[] = [];
        for (const file of incoming.slice(0, slots)) {
          const entry: Uploaded = {
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            mime: file.type,
            progress: 0,
            status: 'uploading',
          };
          // Chan som o client; server van kiem tra lai
          if (!(file.type in ALLOWED_MIME)) {
            next.push({ ...entry, status: 'error', error: 'Định dạng tệp không được hỗ trợ.' });
          } else if (file.size > LIMITS.fileMaxBytes) {
            next.push({ ...entry, status: 'error', error: 'Tệp vượt quá 6 MB.' });
          } else {
            next.push(entry);
            void upload(entry, file);
          }
        }
        return [...prev, ...next];
      });
    },
    [upload],
  );

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!title.trim()) e.title = 'Vui lòng nhập tiêu đề.';
    if (!domain) e.domain = 'Vui lòng chọn một domain.';
    if (!description.trim()) e.description = 'Vui lòng nhập mô tả.';
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (submitting || uploading) return;

    const found = validate();
    setErrors(found);

    const missing = Object.keys(found).length;
    if (missing > 0) {
      setBanner(
        `Còn ${missing} trường bắt buộc chưa điền. Nội dung bạn đã nhập vẫn được giữ nguyên.`,
      );
      // Dua con tro ve o loi dau tien, khong de nguoi dung phai tu do
      if (found.title) titleRef.current?.focus();
      else if (found.domain) domainRef.current?.querySelector('button')?.focus();
      else descRef.current?.focus();
      bannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    setBanner(null);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName,
          title: title.trim(),
          domain,
          description: description.trim(),
          website: '', // honeypot
          files: files
            .filter((f) => f.status === 'done' && f.storageKey)
            .map((f) => ({
              fileName: f.name,
              fileSize: f.size,
              mimeType: f.mime,
              storageKey: f.storageKey,
            })),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setBanner(data.error ?? 'Chưa gửi được. Vui lòng thử lại.');
        setSubmitting(false);
        bannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      router.push('/cam-on');
    } catch {
      setBanner('Chưa gửi được. Vui lòng thử lại.');
      setSubmitting(false);
    }
  }

  const submitLabel = uploading
    ? `Đang tải tệp lên… ${uploadPercent}%`
    : submitting
      ? 'Đang gửi…'
      : 'Gửi ý tưởng';

  return (
    <form className="card u-card" onSubmit={onSubmit} noValidate
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {banner && (
        <div className="banner warn" role="alert" ref={bannerRef}>
          <IconAlert />
          <span>{banner}</span>
        </div>
      )}

      {/* Ten nguoi gui */}
      <div className="field">
        <label className="label" htmlFor="authorName">
          Tên người gửi <span className="opt">Không bắt buộc</span>
        </label>
        <input
          className="input" id="authorName" type="text" autoComplete="name"
          placeholder="Để trống nếu muốn ẩn danh"
          maxLength={LIMITS.authorMax}
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
      </div>

      {/* Honeypot: an voi nguoi dung, bot se dien vao */}
      <input
        type="text" name="website" tabIndex={-1} autoComplete="off"
        aria-hidden="true" className="sr-only"
        onChange={() => {}}
      />

      {/* Tieu de */}
      <div className="field">
        <label className="label" htmlFor="title">
          Tiêu đề <span className="req" aria-hidden="true">*</span>
        </label>
        <input
          ref={titleRef}
          className={`input${errors.title ? ' err' : ''}`}
          id="title" type="text" maxLength={LIMITS.titleMax}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? 'err-title' : undefined}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
          }}
        />
        <div className="hint">
          {errors.title ? <FieldError id="err-title">{errors.title}</FieldError> : <span />}
          <span className="count">{title.length}/{LIMITS.titleMax}</span>
        </div>
      </div>

      {/* Domain */}
      <div className="field">
        <span className="label" id="domain-label">
          Domain <span className="req" aria-hidden="true">*</span>
        </span>
        <div
          ref={domainRef}
          className={`chips${errors.domain ? ' err' : ''}`}
          role="radiogroup"
          aria-labelledby="domain-label"
          aria-describedby={errors.domain ? 'err-domain' : undefined}
        >
          {DOMAINS.map((d) => {
            const on = domain === d.slug;
            return (
              <button
                key={d.slug} type="button" role="radio" aria-checked={on}
                className={`chip${on ? ' on' : ''}`}
                onClick={() => {
                  setDomain(d.slug);
                  if (errors.domain) setErrors((p) => ({ ...p, domain: undefined }));
                }}
              >
                {on && <IconCheck small />}
                {d.label}
              </button>
            );
          })}
        </div>
        {errors.domain && <FieldError id="err-domain">{errors.domain}</FieldError>}
      </div>

      {/* Mo ta */}
      <div className="field">
        <label className="label" htmlFor="description">
          Mô tả <span className="req" aria-hidden="true">*</span>
        </label>
        <textarea
          ref={descRef}
          className={`textarea${errors.description ? ' err' : ''}`}
          id="description" rows={5} maxLength={LIMITS.descriptionMax}
          style={{ minHeight: 168 }}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? 'err-desc' : undefined}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((p) => ({ ...p, description: undefined }));
          }}
        />
        <div className="hint">
          {errors.description ? <FieldError id="err-desc">{errors.description}</FieldError> : <span />}
          <span className="count">{description.length}/{LIMITS.descriptionMax}</span>
        </div>
      </div>

      {/* Tep dinh kem */}
      <div className="field">
        <span className="label">
          Tệp đính kèm{' '}
          <span className="opt">Không bắt buộc · tối đa {LIMITS.fileMaxCount} tệp</span>
        </span>

        <div
          className="drop"
          style={dragging ? { borderColor: 'var(--accent)', background: 'var(--accent-tint)' } : undefined}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <span className="ic-wrap"><IconUpload /></span>
          <span className="only-desktop">
            <b>Kéo thả tệp vào đây</b> hoặc{' '}
            <button
              type="button" className="link"
              style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
              onClick={() => inputRef.current?.click()}
            >
              chọn tệp
            </button>
          </span>
          <button
            type="button" className="btn sm only-mobile" style={{ marginTop: 4 }}
            onClick={() => inputRef.current?.click()}
          >
            Chọn tệp
          </button>
          <small>
            JPG, PNG, WEBP, PDF, DOCX, XLSX, PPTX, TXT, ZIP · mỗi tệp tối đa 6 MB
          </small>
          <input
            ref={inputRef} type="file" multiple accept={ACCEPT}
            className="sr-only"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
          />
        </div>

        {files.length > 0 && (
          <div className="files" aria-live="polite">
            {files.map((f) => {
              const { Icon, cls } = fileIcon(f.mime);
              const bad = f.status === 'error';
              return (
                <div key={f.id} className={`file${bad ? ' bad' : ''}`}>
                  <span className={`thumb ${bad ? 'bad' : cls}`}><Icon /></span>
                  <span className="fmeta">
                    <span className="fname">{f.name}</span>
                    {bad ? (
                      <>
                        <span className="fsub">{formatBytes(f.size)}</span>
                        <span className="err-msg"><IconAlert small />{f.error}</span>
                      </>
                    ) : (
                      <span className="fsub">
                        {formatBytes(f.size)} ·{' '}
                        {f.status === 'done' ? 'Đã tải xong' : `Đang tải lên… ${f.progress}%`}
                      </span>
                    )}
                    {f.status === 'uploading' && (
                      <span
                        className="prog" role="progressbar"
                        aria-valuenow={f.progress} aria-valuemin={0} aria-valuemax={100}
                        aria-label={`Tiến trình tải ${f.name}`}
                      >
                        <i style={{ width: `${f.progress}%` }} />
                      </span>
                    )}
                  </span>
                  <button
                    type="button" className="btn ghost icon"
                    aria-label={`Xóa ${f.name}`}
                    onClick={() => removeFile(f.id)}
                  >
                    <IconClose />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="submit-area">
        <button
          type="submit" className="btn primary lg block"
          disabled={uploading || submitting}
        >
          {submitLabel}
        </button>
        <p className="u-foot only-mobile">Chỉ quản trị viên đọc được ý tưởng bạn gửi.</p>
      </div>
    </form>
  );
}
