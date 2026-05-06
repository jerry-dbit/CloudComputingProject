'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, LogIn, ShieldCheck } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/components/providers/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { user, isReady, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isReady && user) {
      router.replace('/dashboard');
    }
  }, [isReady, router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(username, password);
      if ('error' in result) {
        setError(result.error || 'Login failed.');
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-2rem)] overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--surface)] via-[var(--background)] to-[var(--accent)]/10 px-4 py-8 sm:px-8 lg:px-12">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-[var(--primary)]/15 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[var(--secondary)]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6 text-[var(--text-primary)]"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--surface-dark)] bg-[var(--surface)]/80 px-4 py-2 text-sm shadow-sm backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
            Secure StudyFlow access
          </div>

          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
              Sign in to continue your collaborative study flow.
            </h1>
            <p className="max-w-lg text-base text-[var(--text-secondary)] sm:text-lg">
              Manage documents, join live study rooms, and keep your notes in sync from a single workspace.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              'Fast document uploads',
              'Real-time room collaboration',
              'Highlight and annotate together',
              'Theme-aware UI with session persistence',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[var(--surface-dark)] bg-[var(--surface)]/80 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <Card className="mx-auto w-full max-w-md p-8 shadow-2xl shadow-black/5">
            <div className="mb-6 space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20">
                <LogIn className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Welcome back</h2>
              <p className="text-sm text-[var(--text-secondary)]">Log in to your StudyFlow workspace.</p>
            </div>

            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <Input
                label="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-[2.15rem] rounded-md p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-dark)] hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {loading ? 'Signing in...' : 'Log In'}
              </Button>

              <div className="text-right">
                <Link href="/forgot-password" className="text-sm font-medium text-[var(--primary)] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <p className="text-center text-sm text-[var(--text-secondary)]">
                New to StudyFlow?{' '}
                <Link href="/signup" className="font-medium text-[var(--primary)] hover:underline">
                  Create an account
                </Link>
              </p>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}