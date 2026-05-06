import { redirect } from 'next/navigation';
import { getUserFromServerCookie } from '@/lib/auth/session';

export default async function Home() {
  const user = await getUserFromServerCookie();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--surface-dark)] bg-[var(--surface)] p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome to StudyFlow</h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Sign in with GitHub to continue to your study dashboard.
        </p>
        <a
          href="/api/auth/github"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2.5 text-white font-medium hover:opacity-95 transition-opacity"
        >
          Continue with GitHub
        </a>
      </div>
    </div>
  );
}
