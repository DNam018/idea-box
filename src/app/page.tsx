import Link from 'next/link';
import IdeaForm from '@/components/IdeaForm';
import { IconBulb } from '@/components/icons';

export const metadata = { title: 'Gửi ý tưởng · Idea Box' };

export default function SubmitPage() {
  return (
    <div className="page">
      <header className="topbar plain">
        <Link href="/" className="brand">
          <span className="logo"><IconBulb /></span>
          Idea Box
        </Link>
      </header>

      <main className="u-wrap form-wrap">
        <div className="u-hero">
          <h1>Bạn có ý tưởng gì?</h1>
          <p>Mất chưa đến 30 giây. Chỉ cần tiêu đề, domain và mô tả.</p>
        </div>

        <IdeaForm />

        <p className="u-foot only-desktop">Chỉ quản trị viên đọc được ý tưởng bạn gửi.</p>
      </main>
    </div>
  );
}
