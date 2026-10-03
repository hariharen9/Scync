import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore, getAuthErrorMessage } from '@scync/ui';
import './SignInOverlay.css';

interface SignInOverlayProps {
  onClose: () => void;
}

const GoogleIcon: React.FC = () => (
  <svg width="17" height="17" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const randomHex = (bytes: number) => {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
};

export const SignInOverlay: React.FC<SignInOverlayProps> = ({ onClose }) => {
  const { signInWithGoogle, signInWithEmail, registerWithEmail } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'create'>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState<'email' | 'password' | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // The overlay is mounted fresh on every open, so form state already starts empty.
  // Lock body scroll, focus the email field, and close on Escape while mounted.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => emailRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleGoogle = async () => {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
      // Success: auth state change unmounts this page (VaultGuard takes over).
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setError('');
    try {
      if (mode === 'create') {
        await registerWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const generate = () => {
    const randomEmail = `sc-${randomHex(6)}@scync.local`;
    const pool = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
    const buf = new Uint32Array(16);
    crypto.getRandomValues(buf);
    let pw = '';
    for (let i = 0; i < buf.length; i++) pw += pool[buf[i] % pool.length];
    setEmail(randomEmail);
    setPassword(pw);
    setGenerated(true);
    setError('');
  };

  const copyText = async (kind: 'email' | 'password') => {
    const text = kind === 'email' ? email : password;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const emailLower = email.trim().toLowerCase();
  const submitDisabled = busy || !emailLower || password.length < (mode === 'create' ? 6 : 1);
  const submitLabel = busy ? (mode === 'create' ? 'Creating account…' : 'Signing in…')
    : mode === 'create' ? 'Create my account' : 'Sign in';

  return createPortal(
    <div className="sio-overlay" data-lenis-prevent onClick={onClose}>
      <div className="sio-card" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Sign in to Scync">
        <button className="sio-close" onClick={onClose} title="Close (Esc)" aria-label="Close">✕</button>

        <div className="sio-head">
          <img src="/logo.png" alt="" />
          <h2 className="sio-title">Sign in to Scync</h2>
        </div>
        <p className="sio-sub">This is only the front door. Your data stays sealed behind your vault password.</p>

        <button className="sio-google" onClick={handleGoogle} disabled={busy}>
          <GoogleIcon /> Continue with Google
        </button>

        <div className="sio-or">or use email &amp; password</div>

        <div className="sio-tabs" role="tablist">
          <button
            className={`sio-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => { setMode('signin'); setError(''); }}
          >
            Sign in
          </button>
          <button
            className={`sio-tab ${mode === 'create' ? 'active' : ''}`}
            onClick={() => { setMode('create'); setError(''); }}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="sio-field">
            <label className="sio-field-label" htmlFor="sio-email">
              {mode === 'create' ? 'Email — any address works, even a made-up one' : 'Email'}
            </label>
            <input
              id="sio-email"
              ref={emailRef}
              className="sio-input"
              type="text"
              autoComplete="username"
              placeholder={mode === 'create' ? 'e.g. sc-a1b2c3@scync.local' : 'you@example.com'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div className="sio-field">
            <label className="sio-field-label" htmlFor="sio-pass">Password</label>
            <div className="sio-input-wrap">
              <input
                id="sio-pass"
                className="sio-input"
                type={showPass ? 'text' : 'password'}
                autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                placeholder={mode === 'create' ? 'At least 6 characters' : 'Your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: 74 }}
              />
              <button type="button" className="sio-eye" onClick={() => setShowPass(s => !s)}>
                {showPass ? 'hide' : 'show'}
              </button>
            </div>
          </div>

          {mode === 'create' && (
            <button type="button" className="sio-random-btn" onClick={generate}>
              🎲 Generate a random email &amp; password for me
            </button>
          )}

          {generated && (
            <div className="sio-random-creds">
              <div className="sio-rc-row">
                <span>login&nbsp;<span className="sio-rc-val">{email}</span></span>
                <button className={`sio-copy ${copied === 'email' ? 'done' : ''}`} onClick={() => copyText('email')}>
                  {copied === 'email' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="sio-rc-row">
                <span>password&nbsp;<span className="sio-rc-val">{password}</span></span>
                <button className={`sio-copy ${copied === 'password' ? 'done' : ''}`} onClick={() => copyText('password')}>
                  {copied === 'password' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ color: '#8a8f8e', fontSize: 10, lineHeight: 1.5 }}>
                Save these now — they are your permanent login and can never be recovered.
              </div>
            </div>
          )}

          <button type="submit" className="sio-submit" disabled={submitDisabled}>
            {submitLabel}
          </button>

          {error && <div className="sio-error">{error}</div>}
        </form>

        <div className="sio-divider" />
        <p className="sio-info-title-row">Before you continue — read this</p>
        <div className="sio-info">
          <div className="sio-info-item">
            <div className="sio-info-num">1</div>
            <div className="sio-info-body">
              <strong>You can make up this login.</strong> With email &amp; password, nothing is verified and no
              confirmation is sent. For privacy, use a random one (the 🎲 button) — but <strong>save it</strong>.
              Nobody, including Scync, can reset it for you.
            </div>
          </div>
          <div className="sio-info-item">
            <div className="sio-info-num">2</div>
            <div className="sio-info-body">
              <strong>This login is only authentication.</strong> It just opens the app and identifies your vault.
              Your Google account or email is never used to encrypt anything.
            </div>
          </div>
          <div className="sio-info-item sio-info-warn">
            <div className="sio-info-num">!</div>
            <div className="sio-info-body">
              <strong>Your Vault Master Password is the real key.</strong> You'll create it on the next screen. It is
              different from this login, never sent or stored, and encrypts your secrets. If you forget it and lose
              your <strong>Emergency Recovery Kit</strong>, your data is unrecoverable.
            </div>
          </div>
          <div className="sio-info-item">
            <div className="sio-info-num">3</div>
            <div className="sio-info-body">
              Your vault is tied to whichever login created it. Always return with the <strong>same</strong> Google
              account or email + password, or you'll be starting a fresh vault.
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
