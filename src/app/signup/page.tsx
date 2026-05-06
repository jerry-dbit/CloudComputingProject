'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Sparkles, UserPlus } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/components/providers/AuthProvider';
import { validatePassword } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const { user, isReady, signup } = useAuth();
  const initialForm = {
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  };

  const [form, setForm] = useState(() => {
    if (typeof window === 'undefined') return initialForm;

    try {
      const stored = window.sessionStorage.getItem('studyflow_signup_draft');
      if (!stored) return initialForm;
      return { ...initialForm, ...(JSON.parse(stored) as typeof initialForm) };
    } catch {
      return initialForm;
    }
  });

  const [phase, setPhase] = useState<'details' | 'verify'>(() => {
    if (typeof window === 'undefined') return 'details';

    try {
      const stored = window.sessionStorage.getItem('studyflow_signup_draft');
      if (!stored) return 'details';
      const parsed = JSON.parse(stored) as typeof initialForm;
      return parsed.email ? 'verify' : 'details';
    } catch {
      return 'details';
    }
  });
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'smtp' | 'dev-console' | ''>('');

  useEffect(() => {
    if (phase === 'details') return;
    window.sessionStorage.setItem('studyflow_signup_draft', JSON.stringify(form));
  }, [form, phase]);

  useEffect(() => {
    if (isReady && user) {
      router.replace('/dashboard');
    }
  }, [isReady, router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const email = form.email.trim();
    const username = form.username.trim();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();

    if (!email || !username || !firstName || !lastName || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verification/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, firstName }),
      });

      const payload = (await res.json()) as { error?: string; deliveryMode?: 'smtp' | 'dev-console' };
      if (!res.ok) {
        setError(payload.error || 'Failed to send verification code.');
        return;
      }

      setDeliveryMode(payload.deliveryMode || '');
      setPhase('verify');
      setSuccess(
        payload.deliveryMode === 'dev-console'
          ? 'Verification code generated. Check the server console for local testing.'
          : `We sent a verification code to ${email}.`
      );
      window.sessionStorage.setItem('studyflow_signup_draft', JSON.stringify(form));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const email = form.email.trim();
    const codeValue = code.trim();

    if (!email || !codeValue) {
      setError('Enter the verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await fetch('/api/auth/verification/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeValue }),
      });

      const verifyPayload = (await verifyRes.json()) as { error?: string };
      if (!verifyRes.ok) {
        setError(verifyPayload.error || 'Verification failed.');
        return;
      }

      const result = await signup({
        username: form.username.trim(),
        email,
        password: form.password.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });

      if ('error' in result) {
        setError(result.error || 'Signup failed.');
        return;
      }

      window.sessionStorage.removeItem('studyflow_signup_draft');
      setSuccess(`Welcome to StudyFlow, ${form.firstName.trim()}. Redirecting you now...`);
      window.setTimeout(() => {
        router.replace('/dashboard');
        router.refresh();
      }, 700);
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setError('');
    setSuccess('');
    setResendLoading(true);

    try {
      const res = await fetch('/api/auth/verification/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          username: form.username.trim(),
          firstName: form.firstName.trim(),
        }),
      });

      const payload = (await res.json()) as { error?: string; deliveryMode?: 'smtp' | 'dev-console' };
      if (!res.ok) {
        setError(payload.error || 'Could not resend verification code.');
        return;
      }

      setDeliveryMode(payload.deliveryMode || '');
      setSuccess('A new verification code has been sent.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-2rem)] overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--surface)] via-[var(--background)] to-[var(--secondary)]/10 px-4 py-8 sm:px-8 lg:px-12">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-[var(--secondary)]/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--primary)]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="order-2 lg:order-1"
        >
          <Card className="mx-auto w-full max-w-xl p-8 shadow-2xl shadow-black/5">
            <div className="mb-6 space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-white shadow-lg shadow-[var(--secondary)]/20">
                <UserPlus className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Create your account</h2>
              <p className="text-sm text-[var(--text-secondary)]">Start a new StudyFlow workspace in seconds.</p>
            </div>

            {phase === 'details' ? (
              <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Enter your email"
                  autoComplete="email"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="First Name"
                    value={form.firstName}
                    onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                  <Input
                    label="Last Name"
                    value={form.lastName}
                    onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                </div>

                <Input
                  label="Username"
                  value={form.username}
                  onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="Choose a username"
                  autoComplete="username"
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Create a password"
                    autoComplete="new-password"
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

                <div className="relative">
                  <Input
                    label="Re-enter Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-3 top-[2.15rem] rounded-md p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-dark)] hover:text-[var(--text-primary)]"
                    aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {error && (
                  <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
                    {success}
                  </div>
                )}

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? 'Sending verification code...' : 'Send Verification Code'}
                </Button>

                <p className="text-center text-sm text-[var(--text-secondary)]">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
                    Log in
                  </Link>
                </p>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={(event) => void handleVerifyCode(event)}>
                <div className="text-center">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Enter the 6-digit code sent to <span className="font-medium text-[var(--text-primary)]">{form.email}</span>
                  </p>
                </div>

                <Input
                  label="Verification Code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                />

                {error && (
                  <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
                    {success}
                  </div>
                )}

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? 'Verifying...' : 'Verify and Create Account'}
                </Button>

                <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
                  <button
                    type="button"
                    onClick={() => {
                      setPhase('details');
                      setSuccess('');
                    }}
                    className="font-medium text-[var(--primary)] hover:underline"
                  >
                    Back to details
                  </button>
                  <button
                    type="button"
                    onClick={() => void resendCode()}
                    disabled={resendLoading}
                    className="font-medium text-[var(--primary)] hover:underline disabled:opacity-50"
                  >
                    {resendLoading ? 'Resending...' : 'Resend code'}
                  </button>
                </div>
              </form>
            )}
          </Card>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="order-1 space-y-6 text-[var(--text-primary)] lg:order-2"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--surface-dark)] bg-[var(--surface)]/80 px-4 py-2 text-sm shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-[var(--secondary)]" />
            Build your private study space
          </div>

          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
              Create an account and keep your study sessions in sync.
            </h1>
            <p className="max-w-lg text-base text-[var(--text-secondary)] sm:text-lg">
              StudyFlow keeps your document library, collaboration rooms, and profile data aligned across the app.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              'Password and username validation',
              'Persistent session cookie + local storage',
              'Dynamic name rendering across the app',
              'Fast access to documents and rooms after signup',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[var(--surface-dark)] bg-[var(--surface)]/80 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}