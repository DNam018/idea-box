import { IconBulb } from '@/components/icons';

/** Skeleton khop voi o "Dang tai" trong artboard ListStates. */
export default function Loading() {
  return (
    <div className="page">
      <header className="topbar">
        <span className="brand">
          <span className="logo"><IconBulb /></span>
          Idea Box · Quản trị
        </span>
      </header>
      <main className="a-wrap">
        <div className="a-head"><h1>Ý tưởng</h1></div>
        <div className="card tablebox" aria-busy="true" aria-label="Đang tải danh sách">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[3, 2, 4, 3, 2].map((flex, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 16, alignItems: 'center', padding: '16px 20px',
                  borderBottom: i < 4 ? '1px solid var(--line)' : undefined,
                }}
              >
                <span className="sk sk-anim" style={{ height: 14, flex }} />
                <span className="sk sk-anim" style={{ height: 24, width: 120, borderRadius: 999 }} />
                <span className="sk sk-anim" style={{ height: 14, width: 90 }} />
                <span className="sk sk-anim" style={{ height: 14, width: 70 }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
