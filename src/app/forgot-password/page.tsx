'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, LockKeyhole, MailCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/components/providers/AuthProvider';
import { validatePassword } from '@/lib/auth';
import { updateServerUserPassword } from '@/lib/auth-client';

type ResetPhase = 'request' | 'verify' | 'set-password';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [phase, setPhase] = useState<ResetPhase>(() => {
    if (typeof window === 'undefined') return 'request';

    try {
      const stored = window.sessionStorage.getItem('studyflow_reset_draft');
      if (!stored) return 'request';
      const parsed = JSON.parse(stored) as { identifier?: string; email?: string; username?: string; phase?: ResetPhase };
      return parsed.phase || (parsed.identifier ? 'verify' : 'request');
    } catch {
      return 'request';
    }
  });
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const stored = window.sessionStorage.getItem('studyflow_reset_draft');
      if (!stored) return '';
      const parsed = JSON.parse(stored) as { email?: string };
      return parsed.email || '';
    } catch {
      return '';
    }
  });
  const [username, setUsername] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const stored = window.sessionStorage.getItem('studyflow_reset_draft');
      if (!stored) return '';
      const parsed = JSON.parse(stored) as { username?: string };
      return parsed.username || '';
    } catch {
      return '';
    }
  });
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'smtp' | 'dev-console' | ''>('');

  useEffect(() => {
    if (isReady && user) {
      router.replace('/dashboard');
    }
  }, [isReady, router, user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const draft = {
      identifier,
      email,
      username,
      phase,
    };
    window.sessionStorage.setItem('studyflow_reset_draft', JSON.stringify(draft));
  }, [identifier, email, username, phase]);

  async function sendCode(isResend = false) {
    const typed = identifier.trim();
    setError('');
    setSuccess('');

    if (!typed) {
      setError('Enter your username or registered email address.');
      return;
    }

    if (isResend) {
      setResendLoading(true);
    } else {
      setLoading(true);
    }

    try {
      // Look up user on server
      const lookupRes = await fetch('/api/auth/lookup-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: typed }),
      });

      const lookupData = (await lookupRes.json()) as { error?: string; email?: string; username?: string; firstName?: string };
      if (!lookupRes.ok || !lookupData.email || !lookupData.username) {
        setError(lookupData.error || 'No matching account was found.');
        return;
      }

      const matched = lookupData as { email: string; username: string; firstName?: string };
      const response = await fetch('/api/auth/password-reset/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: matched.email,
          username: matched.username,
          firstName: matched.firstName || '',
        }),
      });

      const payload = (await response.json()) as { error?: string; deliveryMode?: 'smtp' | 'dev-console' };
      if (!response.ok) {
        setError(payload.error || 'Failed to send reset code.');
        return;
      }

      setEmail(matched.email);
      setUsername(matched.username);
      setDeliveryMode(payload.deliveryMode || '');
      setPhase('verify');
      setSuccess(
        payload.deliveryMode === 'dev-console'
          ? 'Reset code generated. Check the server console in development.'
          : `A verification code was sent to the email linked to ${matched.username}.`
      );
    } finally {
      if (isResend) {
        setResendLoading(false);
      } else {
        setLoading(false);
      }
    }
  }

  async function verifyCode() {
    setError('');
    setSuccess('');

    if (!email || !code.trim()) {
      setError('Enter the verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error || 'Verification failed.');
        return;
      }

      setPhase('set-password');
      setSuccess('Code verified. Choose a new password below.');
    } finally {
      setLoading(false);
    }
  }

  async function setPassword() {
    setError('');
    setSuccess('');

    const nextPassword = newPassword.trim();
    const nextConfirm = confirmPassword.trim();

    if (!nextPassword || !nextConfirm) {
      setError('Both password fields are required.');
      return;
    }

    if (nextPassword !== nextConfirm) {
      setError('Passwords do not match.');
      return;
    }

    const passwordError = validatePassword(nextPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const ok = await updateServerUserPassword(email, nextPassword);
      if (!ok) {
        setError('Could not update the password.');
        return;
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('studyflow_reset_draft');
      }

      setSuccess('Password updated successfully. Redirecting to login...');
      window.setTimeout(() => {
        router.replace('/login');
        router.refresh();
      }, 900);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-2rem)] overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--surface)] via-[var(--background)] to-[var(--secondary)]/10 px-4 py-8 sm:px-8 lg:px-12">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-[var(--secondary)]/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--primary)]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.section
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6 text-[var(--text-primary)]"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--surface-dark)] bg-[var(--surface)]/80 px-4 py-2 text-sm shadow-sm backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
            Account recovery
          </div>

          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
              Recover your StudyFlow account with a secure code.
            </h1>
            <p className="max-w-lg text-base text-[var(--text-secondary)] sm:text-lg">
              Enter your username or the registered email, verify the code sent to the linked inbox, and set a new password.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              'Username or email lookup',
              'Purpose-built reset verification',
              'Password confirmation step',
              'Same StudyFlow visual language',
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
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-white shadow-lg shadow-[var(--secondary)]/20">
                <MailCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Forgot password</h2>
              <p className="text-sm text-[var(--text-secondary)]">We&apos;ll verify your identity before changing the password.</p>
            </div>

            {phase === 'request' && (
              <div className="space-y-4">
                <Input
                  label="Username or Email"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Enter your username or email"
                  autoComplete="username email"
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

                <Button onClick={() => void sendCode()} className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? 'Sending code...' : 'Send Verification Code'}
                </Button>

                <p className="text-center text-sm text-[var(--text-secondary)]">
                  Remembered your password?{' '}
                  <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
                    Back to login
                  </Link>
                </p>
              </div>
            )}

            {phase === 'verify' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Enter the 6-digit code sent to <span className="font-medium text-[var(--text-primary)]">{username || identifier}</span>
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

                <Button onClick={() => void verifyCode()} className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? 'Verifying...' : 'Verify Code'}
                </Button>

                <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
                  <button
                    type="button"
                    onClick={() => {
                      setPhase('request');
                      setCode('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setSuccess('');
                    }}
                    className="font-medium text-[var(--primary)] hover:underline"
                  >
                    Change account
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendCode(true)}
                    disabled={resendLoading}
                    className="font-medium text-[var(--primary)] hover:underline disabled:opacity-50"
                  >
                    {resendLoading ? 'Resending...' : 'Resend code'}
                  </button>
                </div>
              </div>
            )}

            {phase === 'set-password' && (
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Create a new password"
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
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your new password"
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

                <Button onClick={() => void setPassword()} className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                  {loading ? 'Updating password...' : 'Update Password'}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}