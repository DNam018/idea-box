const TZ = 'Asia/Ho_Chi_Minh';

/** "02/11 · 09:42" - dung trong bang danh sach */
export function formatShort(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const day = new Intl.DateTimeFormat('vi-VN', {
    timeZone: TZ, day: '2-digit', month: '2-digit',
  }).format(date);
  const time = new Intl.DateTimeFormat('vi-VN', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
  return `${day} · ${time}`;
}

/** "02/11/2026 · 09:42" - dung o man chi tiet */
export function formatLong(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const day = new Intl.DateTimeFormat('vi-VN', {
    timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(date);
  const time = new Intl.DateTimeFormat('vi-VN', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
  return `${day} · ${time}`;
}

/** "09:50" - dong "Da luu luc ..." duoi o ghi chu */
export function formatTime(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}
