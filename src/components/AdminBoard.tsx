'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DOMAINS, domainBySlug, formatBytes } from '@/lib/domains';
import { formatShort, formatLong, formatTime } from '@/lib/format';
import {
  IconBulb, IconSearch, IconPin, IconClip, IconDownload, IconClose,
  IconCheck, IconTrash, IconEye, IconBack, fileIcon,
} from '@/components/icons';

type Row = {
  id: string; title: string; domain: string; authorName: string | null;
  isRead: boolean; isPinned: boolean; createdAt: string; fileCount: number;
};
type FileRow = { id: string; fileName: string; fileSize: number; mimeType: string };
type Detail = Omit<Row, 'fileCount'> & {
  description: string; adminNote: string | null;
  noteSavedAt: string | null; files: FileRow[];
};

type Props = {
  ideas: Row[];
  stats: { total: number; unread: number; thisWeek: number };
  filters: { q: string; domain: string; read: string; pinned: boolean };
  initialSelectedId: string;
  adminEmail: string;
};

export default function AdminBoard({
  ideas, stats, filters, initialSelectedId, adminEmail,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState(filters.q);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Lua chon nam o state cua client, KHONG di qua router.
  // Day la mau chot cua viec het lag: bam mot dong khong con khien
  // server component chay lai va truy van lai ca danh sach.
  const [selectedId, setSelectedId] = useState(initialSelectedId || null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const hasFilters = Boolean(filters.q || filters.domain || filters.read || filters.pinned);
  // Du lieu da co san tren dong: du de ve ngay phan dau panel
  const selectedRow = ideas.find((i) => i.id === selectedId) ?? null;

  const setParam = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      }
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  /** Ghi id vao URL ma khong danh thuc router -> khong tai lai danh sach. */
  const syncUrl = useCallback((id: string | null) => {
    const next = new URLSearchParams(window.location.search);
    if (id) next.set('id', id);
    else next.delete('id');
    const qs = next.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, []);

  useEffect(() => {
    if (q === filters.q) return;
    const t = setTimeout(() => setParam({ q: q || null }), 350);
    return () => clearTimeout(t);
  }, [q, filters.q, setParam]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Tai chi tiet khi doi lua chon. AbortController de bam nhanh nhieu dong
  // thi ket qua cu khong de len ket qua moi.
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    const ac = new AbortController();
    setDetailLoading(true);
    setDetailError(null);

    fetch(`/api/admin/ideas/${selectedId}`, { signal: ac.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Không tải được chi tiết.');
        return res.json() as Promise<Detail>;
      })
      .then((data) => {
        setDetail(data);
        setDetailLoading(false);
        // Mo la danh dau da doc, dung nhu design mo ta
        if (!data.isRead) {
          void patch(data.id, { isRead: true }).then(() => router.refresh()).catch(() => {});
        }
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setDetailError(e instanceof Error ? e.message : 'Không tải được chi tiết.');
        setDetailLoading(false);
      });

    return () => ac.abort();
  }, [selectedId, router]);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/ideas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Thao tác thất bại.');
    }
    return res.json();
  }

  function openDetail(id: string) {
    setSelectedId(id);
    syncUrl(id);
  }
  function closeDetail() {
    setSelectedId(null);
    syncUrl(null);
  }

  async function togglePin() {
    if (!detail) return;
    const next = !detail.isPinned;
    setDetail({ ...detail, isPinned: next });   // phan hoi ngay, khong cho server
    try {
      await patch(detail.id, { isPinned: next });
      router.refresh();
    } catch (e) {
      setDetail({ ...detail, isPinned: !next }); // that bai thi tra lai nhu cu
      setToast(e instanceof Error ? e.message : 'Thao tác thất bại.');
    }
  }

  async function markUnread() {
    if (!detail) return;
    setDetail({ ...detail, isRead: false });
    try {
      await patch(detail.id, { isRead: false });
      router.refresh();
      closeDetail();
    } catch (e) {
      setDetail({ ...detail, isRead: true });
      setToast(e instanceof Error ? e.message : 'Thao tác thất bại.');
    }
  }

  async function doDelete() {
    if (!detail) return;
    const id = detail.id;
    setConfirmDelete(false);
    try {
      const res = await fetch(`/api/admin/ideas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Chưa xóa được. Vui lòng thử lại.');
      closeDetail();
      router.refresh();
      setToast('Đã xóa ý tưởng.');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Chưa xóa được.');
    }
  }

  async function openFile(fileId: string) {
    try {
      const res = await fetch(`/api/admin/files/${fileId}`);
      if (!res.ok) throw new Error('Chưa tải được tệp.');
      const { url } = await res.json();
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Chưa tải được tệp.');
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  // Dong Esc de dong panel / dialog
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (confirmDelete) setConfirmDelete(false);
      else if (selectedId) closeDetail();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const panelOpen = Boolean(selectedId);

  return (
    <div className="page">
      <header className="topbar only-desktop">
        <span className="brand">
          <span className="logo"><IconBulb /></span>
          Idea Box · Quản trị
        </span>
        <div className="who">
          <span>{adminEmail}</span>
          <button type="button" className="btn sm" onClick={logout}>Đăng xuất</button>
        </div>
      </header>

      <header className="m-top only-mobile">
        <span className="brand">
          <span className="logo"><IconBulb /></span>
          Quản trị
        </span>
        <button type="button" className="btn ghost sm" onClick={logout}>Đăng xuất</button>
      </header>

      <div className="a-split">
        <main>
          <div className="a-head">
            <h1>Ý tưởng</h1>
            <a className="btn" href="/api/admin/export">
              <IconDownload />
              Xuất Excel
            </a>
          </div>

          <div className="stats">
            <div className="card stat">
              <span className="n">{stats.total}</span>
              <span className="t">Tổng ý tưởng</span>
            </div>
            <div className="card stat hl">
              <span className="n">{stats.unread}</span>
              <span className="t">Chưa đọc</span>
            </div>
            <div className="card stat">
              <span className="n">{stats.thisWeek}</span>
              <span className="t">Tuần này</span>
            </div>
          </div>

          <div className="toolbar">
            <div className="search">
              <IconSearch />
              <input
                className="input" type="search"
                placeholder="Tìm theo tiêu đề, nội dung, người gửi"
                aria-label="Tìm kiếm ý tưởng"
                value={q} onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <select
              className="select" aria-label="Lọc theo domain"
              value={filters.domain}
              onChange={(e) => setParam({ domain: e.target.value || null })}
            >
              <option value="">Tất cả domain</option>
              {DOMAINS.map((d) => (
                <option key={d.slug} value={d.slug}>{d.label}</option>
              ))}
            </select>

            <div className="seg" role="group" aria-label="Lọc theo trạng thái đọc">
              {[
                { key: '', label: 'Tất cả' },
                { key: 'unread', label: 'Chưa đọc' },
                { key: 'read', label: 'Đã đọc' },
              ].map((o) => (
                <button
                  key={o.key} type="button"
                  className={filters.read === o.key ? 'on' : undefined}
                  aria-pressed={filters.read === o.key}
                  onClick={() => setParam({ read: o.key || null })}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`togglepin${filters.pinned ? ' on' : ''}`}
              aria-pressed={filters.pinned}
              onClick={() => setParam({ pinned: filters.pinned ? null : '1' })}
            >
              <IconPin small />
              Đã ghim
            </button>
          </div>

          {ideas.length === 0 ? (
            <div className="card">
              <div className="empty">
                <span className="ic-wrap">{hasFilters ? <IconSearch /> : <IconBulb />}</span>
                <h3>{hasFilters ? 'Không tìm thấy ý tưởng phù hợp.' : 'Chưa có ý tưởng nào.'}</h3>
                {hasFilters ? (
                  <button
                    type="button" className="btn" style={{ marginTop: 4 }}
                    onClick={() => { setQ(''); setParam({ q: null, domain: null, read: null, pinned: null }); }}
                  >
                    Xóa bộ lọc
                  </button>
                ) : (
                  <p>Ý tưởng đồng nghiệp gửi lên sẽ xuất hiện ở đây.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop: bang. Khi panel mo thi bo bot cot cho khoi tran ngang,
                  dung nhu artboard Detail-D lam. */}
              <div
                className={`card tablebox only-desktop${panelOpen ? ' compact' : ''}`}
                style={{ opacity: pending ? 0.55 : 1, transition: 'opacity .15s' }}
              >
                <table>
                  <thead>
                    <tr>
                      <th>Tiêu đề</th>
                      <th>Domain</th>
                      {!panelOpen && <th>Người gửi</th>}
                      <th>Thời gian</th>
                      {!panelOpen && <th>Tệp</th>}
                      <th>Trạng thái</th>
                      {!panelOpen && <th style={{ width: 56 }}>Ghim</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {ideas.map((row) => {
                      const d = domainBySlug(row.domain);
                      const cls = [
                        'clickable',
                        !row.isRead ? 'unread' : '',
                        selectedId === row.id ? 'sel' : '',
                      ].filter(Boolean).join(' ');
                      return (
                        <tr
                          key={row.id} className={cls} tabIndex={0}
                          onClick={() => openDetail(row.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openDetail(row.id);
                            }
                          }}
                        >
                          <td className="title">
                            <div className="t-title">
                              {row.isRead ? <span className="n">{row.title}</span> : <b>{row.title}</b>}
                              {panelOpen && row.isPinned && (
                                <IconPin small className="pin-on"
                                  style={{ fill: 'currentColor' }} aria-label="Đã ghim" />
                              )}
                            </div>
                          </td>
                          <td><span className={`tag ${d.tagClass}`}>{d.label}</span></td>
                          {!panelOpen && (
                            <td>{row.authorName ?? <span className="anon">Ẩn danh</span>}</td>
                          )}
                          <td className="muted">{formatShort(row.createdAt)}</td>
                          {!panelOpen && (
                            <td>
                              {row.fileCount > 0
                                ? <span className="fc"><IconClip small />{row.fileCount}</span>
                                : <span className="fc muted">–</span>}
                            </td>
                          )}
                          <td>
                            {row.isRead
                              ? <span className="badge-read">Đã đọc</span>
                              : <span className="badge-new">Chưa đọc</span>}
                          </td>
                          {!panelOpen && (
                            <td>
                              {row.isPinned && (
                                <IconPin className="pin-on"
                                  style={{ fill: 'currentColor' }} aria-label="Đã ghim" />
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="cards only-mobile" style={{ opacity: pending ? 0.55 : 1 }}>
                {ideas.map((row) => {
                  const d = domainBySlug(row.domain);
                  return (
                    <button
                      key={row.id} type="button"
                      className={`card icard icard-link${!row.isRead ? ' unread' : ''}`}
                      onClick={() => openDetail(row.id)}
                    >
                      <div className="top">
                        {row.isRead
                          ? <span className="badge-read">Đã đọc</span>
                          : <span className="badge-new">Chưa đọc</span>}
                        {row.isPinned && (
                          <IconPin className="pin-on"
                            style={{ fill: 'currentColor' }} aria-label="Đã ghim" />
                        )}
                      </div>
                      <h3>{row.title}</h3>
                      <div><span className={`tag ${d.tagClass}`}>{d.label}</span></div>
                      <div className="meta">
                        {row.authorName
                          ? <span>{row.authorName}</span>
                          : <span className="anon">Ẩn danh</span>}
                        <span>{formatShort(row.createdAt)}</span>
                        {row.fileCount > 0 && (
                          <span className="fc"><IconClip small />{row.fileCount} tệp</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="count-line">Hiển thị {ideas.length} ý tưởng · mới nhất trước</p>
            </>
          )}
        </main>

        {selectedId && (
          <DetailPanel
            key={selectedId}
            row={selectedRow}
            detail={detail}
            loading={detailLoading}
            error={detailError}
            onClose={closeDetail}
            onTogglePin={togglePin}
            onMarkUnread={markUnread}
            onAskDelete={() => setConfirmDelete(true)}
            onOpenFile={openFile}
            onNoteSaved={(at, note) => setDetail((d) => (d ? { ...d, noteSavedAt: at, adminNote: note } : d))}
            onToast={setToast}
          />
        )}
      </div>

      {confirmDelete && detail && (
        <div className="scrim" onClick={() => setConfirmDelete(false)}>
          <div
            className="dialog" role="alertdialog" aria-modal="true"
            aria-labelledby="dlg-title" aria-describedby="dlg-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="dtrash"><IconTrash /></span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h2 id="dlg-title">Xóa ý tưởng này?</h2>
              <p id="dlg-desc" className="muted">
                Bạn không thể hoàn tác. Các tệp đính kèm và ghi chú nội bộ cũng bị xóa.
              </p>
            </div>
            <p className="quote">{detail.title}</p>
            <div className="btns">
              <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>Hủy</button>
              <button type="button" className="btn danger solid" onClick={doDelete}>
                <IconTrash small />
                Xóa ý tưởng
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-wrap">
          <div className="toast" role="status">
            <IconCheck />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function DetailPanel({
  row, detail, loading, error,
  onClose, onTogglePin, onMarkUnread, onAskDelete, onOpenFile, onNoteSaved, onToast,
}: {
  row: Row | null;
  detail: Detail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onTogglePin: () => void;
  onMarkUnread: () => void;
  onAskDelete: () => void;
  onOpenFile: (id: string) => void;
  onNoteSaved: (at: string | null, note: string) => void;
  onToast: (m: string) => void;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const noteLoaded = useRef(false);

  // Ghi chu chi nap mot lan, khi chi tiet ve - tranh de len thu admin dang go
  useEffect(() => {
    if (detail && !noteLoaded.current) {
      setNote(detail.adminNote ?? '');
      noteLoaded.current = true;
    }
  }, [detail]);

  // Phan dau panel ve ngay bang du lieu co san tren dong danh sach
  const head = detail ?? row;
  const d = head ? domainBySlug(head.domain) : null;
  const dirty = detail ? note !== (detail.adminNote ?? '') : false;

  async function saveNote() {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/ideas/${detail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote: note }),
      });
      if (!res.ok) throw new Error('Chưa lưu được ghi chú.');
      const data = await res.json();
      onNoteSaved(data.noteSavedAt, note);
      onToast('Đã lưu ghi chú.');
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Chưa lưu được ghi chú.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="panel" aria-label="Chi tiết ý tưởng" aria-busy={loading}>
      <div className="panel-h only-desktop">
        <span className="badge-read" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <IconCheck small />
          Đã đọc · tự động khi mở
        </span>
        <button type="button" className="btn ghost icon" aria-label="Đóng chi tiết" onClick={onClose}>
          <IconClose />
        </button>
      </div>

      <div className="m-top only-mobile" style={{ position: 'sticky', top: 0, zIndex: 1, paddingLeft: 8 }}>
        <button type="button" className="btn ghost" style={{ gap: 6 }} onClick={onClose}>
          <IconBack />
          Danh sách
        </button>
        <span className="badge-read" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, paddingRight: 12 }}>
          <IconCheck small />
          Đã đọc
        </span>
      </div>

      <div className="panel-b">
        {/* Tieu de va meta hien ngay, khong cho server */}
        {head && d && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="d-title">{head.title}</h2>
            <div className="d-meta">
              <span className={`tag ${d.tagClass}`}>{d.label}</span>
              {head.authorName
                ? <span>{head.authorName}</span>
                : <span className="anon">Ẩn danh</span>}
              <span>{formatLong(head.createdAt)}</span>
              {head.isPinned && (
                <span className="pin-on"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  <IconPin small style={{ fill: 'currentColor' }} />
                  Đã ghim
                </span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="banner warn" role="alert">
            <IconClose />
            <span>{error}</span>
          </div>
        )}

        {/* Noi dung, tep, ghi chu: skeleton trong luc tai */}
        {!detail && !error ? (
          <DetailSkeleton />
        ) : detail ? (
          <>
            <div className="d-text">
              {detail.description.split(/\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
            </div>

            {detail.files.length > 0 && (
              <div>
                <h3 className="sec-h">Tệp đính kèm · {detail.files.length}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {detail.files.map((f) => {
                    const isImage = f.mimeType.startsWith('image/');
                    const { Icon, cls } = fileIcon(f.mimeType);
                    return isImage ? (
                      <div key={f.id} className="imgprev">
                        <span className="cap-name" title={f.fileName}
                          style={{ fontSize: 13, fontWeight: 600 }}>
                          {f.fileName}
                        </span>
                        <button type="button" className="chipbtn" onClick={() => onOpenFile(f.id)}>
                          <IconEye small />
                          Xem ảnh
                        </button>
                      </div>
                    ) : (
                      <div key={f.id} className="file">
                        <span className={`thumb ${cls}`}><Icon /></span>
                        <span className="fmeta">
                          <span className="fname" title={f.fileName}>{f.fileName}</span>
                          <span className="fsub">{formatBytes(f.fileSize)}</span>
                        </span>
                        <button type="button" className="btn sm"
                          aria-label={`Tải ${f.fileName}`} onClick={() => onOpenFile(f.id)}>
                          <IconDownload small />
                          Tải về
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="note">
              <label className="sec-h" htmlFor="admin-note" style={{ margin: 0 }}>
                Ghi chú nội bộ · chỉ admin thấy
              </label>
              <textarea
                className="textarea" id="admin-note"
                placeholder="Ghi lại việc cần làm, người cần hỏi…"
                value={note} onChange={(e) => setNote(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span className={detail.noteSavedAt ? 'fsub' : 'note-empty'}>
                  {detail.noteSavedAt ? `Đã lưu lúc ${formatTime(detail.noteSavedAt)}` : 'Chưa có ghi chú'}
                </span>
                <button type="button" className="btn sm primary"
                  onClick={saveNote} disabled={saving || !dirty}>
                  {saving ? 'Đang lưu…' : 'Lưu ghi chú'}
                </button>
              </div>
            </div>

            <div className="actions" style={{ borderTop: '1px solid var(--line)', paddingTop: 20 }}>
              <button type="button" className="btn" onClick={onMarkUnread}>Đánh dấu chưa đọc</button>
              <button type="button" className="btn" onClick={onTogglePin}>
                <IconPin small />
                {detail.isPinned ? 'Bỏ ghim' : 'Ghim'}
              </button>
              <button type="button" className="btn danger" style={{ marginLeft: 'auto' }} onClick={onAskDelete}>
                <IconTrash small />
                Xóa
              </button>
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
}

/** Khung xam trong luc cho noi dung chi tiet ve. */
function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }} aria-hidden="true">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span className="sk sk-anim" style={{ height: 13, width: '100%' }} />
        <span className="sk sk-anim" style={{ height: 13, width: '92%' }} />
        <span className="sk sk-anim" style={{ height: 13, width: '74%' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span className="sk sk-anim" style={{ height: 11, width: 120 }} />
        <span className="sk sk-anim" style={{ height: 64, borderRadius: 12 }} />
      </div>
      <span className="sk sk-anim" style={{ height: 120, borderRadius: 14 }} />
    </div>
  );
}
