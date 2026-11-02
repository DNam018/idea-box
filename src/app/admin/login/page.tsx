import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export const metadata = { title: 'Đăng nhập · Idea Box' };

export default function LoginPage() {
  return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
