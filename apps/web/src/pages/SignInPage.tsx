import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Dices,
  Eye,
  EyeOff,
  Fingerprint,
  Github,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { getAuthErrorMessage, useAuthStore } from '@scync/ui';
import './SignInPage.css';

type AuthMode = 'signin' | 'create';

const GoogleIcon: React.FC = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const STEPS = [
  {
    n: '01',
    title: 'Authenticate',
    body: 'Google or email/password identifies your vault. It never encrypts anything.',
  },
  {
    n: '02',
    title: 'Set the master key',
    body: 'Create the Vault Master Password next. It stays on this device and is never sent to us.',
  },
  {
    n: '03',
    title: 'Keep the recovery kit',
    body: 'The kit is the only backup. Store it offline — if you lose it and the password, the data is gone.',
  },
];

const randomHex = (bytes: number) => {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
};

export const SignInPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, registerWithEmail } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState<'email' | 'password' | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const generatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(max-width: 900px)').matches) return;
    const timer = window.setTimeout(() => emailRef.current?.focus(), 150);
    return () => window.clearTimeout(timer);
  }, []);

  const handleGoogle = async () => {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg || 'Google sign-in could not be completed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < (mode === 'create' ? 6 : 1)) return;

    setBusy(true);
    setError('');
    try {
      if (mode === 'create') {
        await registerWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg || 'Unable to continue. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const generate = () => {
    const randomEmail = `sc-${randomHex(6)}@scync.local`;
    const pool = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
    const buf = new Uint32Array(16);
    crypto.getRandomValues(buf);

    let nextPassword = '';
    for (let i = 0; i < buf.length; i++) nextPassword += pool[buf[i] % pool.length];

    setEmail(randomEmail);
    setPassword(nextPassword);
    setMode('create');
    setGenerated(true);
    setCopied(null);
    setError('');

    window.requestAnimationFrame(() => {
      if (window.matchMedia('(max-width: 900px)').matches) {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        generatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  };

  const copyText = async (kind: 'email' | 'password') => {
    const text = kind === 'email' ? email : password;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError('');
  };

  const emailLower = email.trim().toLowerCase();
  const submitDisabled = busy || !emailLower || password.length < (mode === 'create' ? 6 : 1);
  const submitLabel = busy
    ? mode === 'create' ? 'Creating account…' : 'Signing in…'
    : mode === 'create' ? 'Create account' : 'Sign in';

  return (
    <div className="auth-page" data-lenis-prevent>
      <div className="auth-noise" aria-hidden="true" />

      <header className="auth-topbar">
        <a className="auth-brand" href="/" aria-label="Scync home">
          <span className="auth-brand-mark">
            <img src="/logo.png" alt="" />
          </span>
          <span className="auth-brand-word">SCYNC</span>
        </a>

        <div className="auth-topbar-meta">
          <span className="auth-status">
            <span className="auth-status-dot" />
            Client-side encryption
          </span>
          <a className="auth-back" href="/">
            <ArrowLeft size={13} />
            Back to site
          </a>
        </div>
      </header>

      <main className="auth-split">
        <section className="auth-brief" aria-labelledby="auth-headline">
          <div className="auth-brief-bg" aria-hidden="true" />
          <div className="auth-brief-inner">
            <div className="auth-kicker">
              <span>//</span>
              Identity layer
            </div>

            <h1 id="auth-headline">
              <span>One login.</span>
              <span>One vault.</span>
              <span className="auth-green">Zero knowledge.</span>
            </h1>

            <p className="auth-lede">
              This is the front door. It identifies your vault — it never holds the key.
              Your master password stays on this device.
            </p>

            <div className="auth-note">
              <Sparkles size={13} />
              No verification. No password reset. No server-side keys.
            </div>

            <div className="auth-steps">
              {STEPS.map(step => (
                <div className="auth-step" key={step.n}>
                  <span className="auth-step-num">{step.n}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="auth-generator" ref={generatorRef}>
              <div className="auth-gen-head">
                <div>
                  <div className="auth-gen-label">
                    <Dices size={13} />
                    Random login
                  </div>
                  <p>No email verification. Generate a made-up identity and save it.</p>
                </div>
                <button type="button" className="auth-gen-btn" onClick={generate}>
                  {generated ? <RefreshCw size={12} /> : <Dices size={12} />}
                  {generated ? 'Regenerate' : 'Generate'}
                </button>
              </div>

              {generated && (
                <div className="auth-gen-output">
                  <div className="auth-gen-row">
                    <span>LOGIN</span>
                    <code>{email}</code>
                    <button
                      type="button"
                      className={`auth-gen-copy ${copied === 'email' ? 'is-copied' : ''}`}
                      onClick={() => copyText('email')}
                      aria-label="Copy generated email"
                    >
                      {copied === 'email' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div className="auth-gen-row">
                    <span>PASSWORD</span>
                    <code>{password}</code>
                    <button
                      type="button"
                      className={`auth-gen-copy ${copied === 'password' ? 'is-copied' : ''}`}
                      onClick={() => copyText('password')}
                      aria-label="Copy generated password"
                    >
                      {copied === 'password' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div className="auth-gen-filled">Filled into the form. Save it now.</div>
                  <div className="auth-gen-warn">
                    <AlertTriangle size={12} />
                    This login cannot be recovered. Nobody, including Scync, can reset it.
                  </div>
                </div>
              )}
            </div>

            <div className="auth-trust">
              <span><ShieldCheck size={12} /> AES-256-GCM</span>
              <span><Fingerprint size={12} /> PBKDF2</span>
              <span><Terminal size={12} /> Open source</span>
            </div>
          </div>
        </section>

        <section className="auth-form-panel" aria-labelledby="auth-form-title">
          <div className="auth-form-wrap" ref={formRef}>
            <div className="auth-form-kicker">
              <span>//</span>
              Vault access
            </div>

            <div className="auth-form-head">
              <h2 id="auth-form-title">
                {mode === 'create' ? 'Create your front door.' : 'Welcome back.'}
              </h2>
              <p>
                {mode === 'create'
                  ? "Pick a login for this vault. You can use any address — even one that doesn't exist."
                  : 'Use the same login that created your vault. Your data is waiting behind it.'}
              </p>
            </div>

            <button
              type="button"
              className="auth-google"
              onClick={handleGoogle}
              disabled={busy}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="auth-divider">
              <span>or continue with email</span>
            </div>

            <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                className={`auth-tab ${mode === 'signin' ? 'is-active' : ''}`}
                onClick={() => switchMode('signin')}
                disabled={busy}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'create'}
                className={`auth-tab ${mode === 'create' ? 'is-active' : ''}`}
                onClick={() => switchMode('create')}
                disabled={busy}
              >
                Create account
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <div className="auth-label-row">
                  <label className="auth-label" htmlFor="auth-email">Email</label>
                  {mode === 'create' && <span className="auth-hint">Any address works</span>}
                </div>
                <input
                  id="auth-email"
                  ref={emailRef}
                  className="auth-input"
                  type="text"
                  name="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={mode === 'create' ? 'e.g. sc-a1b2c3@scync.local' : 'you@example.com'}
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  required
                />
                {mode === 'create' && (
                  <p className="auth-field-note">Nothing is verified and no confirmation is sent.</p>
                )}
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label className="auth-label" htmlFor="auth-password">Password</label>
                  <span className="auth-hint">
                    {mode === 'create' ? 'At least 6 characters' : 'Your account password'}
                  </span>
                </div>
                <div className="auth-pass-wrap">
                  <input
                    id="auth-password"
                    className="auth-input"
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                    placeholder={mode === 'create' ? 'Create a password' : 'Your password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPass(s => !s)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={submitDisabled}>
                {submitLabel}
                {!busy && <ArrowRight size={15} />}
              </button>

              {error && (
                <div className="auth-error" role="alert">
                  <AlertTriangle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </form>

            <div className="auth-footnote">
              <Lock size={14} />
              <p>
                <strong>This login is not your vault key.</strong> It only authenticates you.
                Your Vault Master Password is created next and never leaves this device.
              </p>
            </div>

            <div className="auth-form-links">
              <a href="/">
                <ArrowLeft size={12} />
                Back to scync.space
              </a>
              <a href="https://github.com/hariharen9/Scync" target="_blank" rel="noreferrer">
                <Github size={12} />
                Source
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
