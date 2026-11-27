import React, { useEffect, useRef } from 'react';
import './LandingPage.css';
import { OrbLogomark } from '@scync/ui';

const marqueeItems = [
  'AES-256-GCM', 'Zero-Knowledge Architecture', 'PBKDF2-SHA256 \u00b7 310,000 iterations',
  '59+ Built-In Services', '15 Typed Secret Forms', 'Security Cockpit',
  'Emergency Recovery Kit', 'Web Crypto API', 'In-Memory Decryption', 'MIT Licensed', 'Open Source',
  'No Password Storage', 'Fresh IV Per Encrypt', 'Real-Time Sync', 'Recovery Phrases',
  'Password Manager & CSV Import', 'Secret Versioning & Rollback', 'Vault Activity Ledger',
  '2FA Authenticator', 'SSH Key Manager', 'SSL Certificate Manager', 'Non-Extractable Keys',
  'Firebase-Backed', 'Free Forever',
];

const words = ['API keys', 'secrets', 'passwords', '2FA codes', 'SSH keys', 'certificates', 'recovery phrases', 'tokens', 'credentials', 'OAuth tokens'];
const badPlaces = ['Notion', 'Notes', 'Slack', 'Email', 'dotfiles', 'Docs', 'Chat', 'Sheets'];

const heroSecrets = [
  { service: 'STRIPE', name: 'Payments API', value: 'sk_live_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', color: '#818cf8', initial: 'S' },
  { service: 'ANTHROPIC', name: 'Claude API key', value: 'sk-ant-\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', color: '#d4a27a', initial: 'A' },
  { service: 'GITHUB', name: 'Deploy token', value: 'ghp_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', color: '#9aa19e', initial: 'G' },
];

const cliInstall = `git clone https://github.com/hariharen9/Scync-cli.git
cd Scync-cli && npm install && npm run build && npm link`;

const cliDemos = [
  {
    id: 'tui',
    label: 'TUI',
    command: 'scync',
    output: [
      { tone: 'dim', text: 'SCYNC  //  TERMINAL VAULT' },
      { tone: 'ok', text: '✓ vault sealed · agent custody 15m' },
      { tone: 'muted', text: 'DASHBOARD   SECRETS   PROJECTS   PASSWORDS   TOTP   SSH   CERTS' },
      { tone: 'text', text: 'Vault health      ● healthy' },
      { tone: 'text', text: 'Projects          6' },
      { tone: 'warn', text: 'Attention         2 rotations due · 1 certificate expiring' },
      { tone: 'text', text: 'Recent            STRIPE_SECRET_KEY rotated 2m ago' },
      { tone: 'dim', text: '↑↓ move · enter open · / search · u unlock · q quit' },
    ],
  },
  {
    id: 'run',
    label: 'run',
    command: 'scync run --project Payments -- npm run dev',
    output: [
      { tone: 'ok', text: '✓ agent custody active · 15m' },
      { tone: 'ok', text: '✓ 12 secrets decrypted for development' },
      { tone: 'ok', text: '✓ environment injected into child process' },
      { tone: 'dim', text: '→ next dev -p 3000' },
      { tone: 'text', text: 'ready - started server on 0.0.0.0:3000' },
    ],
  },
  {
    id: 'pull',
    label: 'pull',
    command: 'scync pull --project Payments --env production --output .env',
    output: [
      { tone: 'ok', text: '✓ unlocked vault via agent' },
      { tone: 'ok', text: '✓ 18 active secrets matched' },
      { tone: 'ok', text: '✓ wrote .env (0600)' },
      { tone: 'dim', text: '· skipped 2 expired secrets' },
      { tone: 'text', text: 'done in 0.41s' },
    ],
  },
  {
    id: 'push',
    label: 'push',
    command: 'scync push .env --dry-run',
    output: [
      { tone: 'ok', text: '✓ parsed 14 keys from .env' },
      { tone: 'ok', text: '✓ 9 new · 3 updated · 2 unchanged' },
      { tone: 'text', text: '· STRIPE_SECRET_KEY  create' },
      { tone: 'text', text: '· DATABASE_URL      update' },
      { tone: 'warn', text: '! 1 duplicate key collapsed (last wins)' },
      { tone: 'dim', text: 'dry run — nothing written' },
    ],
  },
];

const cliCommandCards = [
  { command: 'scync', label: 'Launch the TUI', desc: 'Full-screen vault, keyboard-first.' },
  { command: 'scync run -- npm start', label: 'Inject secrets', desc: 'No temp files. Child process env only.' },
  { command: 'scync pull --output .env', label: 'Export .env', desc: '0600 file, project and environment aware.' },
  { command: 'scync push .env', label: 'Import .env', desc: 'Dry runs, overwrite confirmation, deduping.' },
  { command: 'scync totp GitHub', label: 'Live TOTP', desc: 'RFC 6238 codes without a phone.' },
  { command: 'scync projects', label: 'Organize', desc: 'Create, rename, recolor and move projects.' },
];

export const LandingPage: React.FC = () => {
  const navRef = useRef<HTMLElement>(null);
  const cursorGlowRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [wordIndex, setWordIndex] = React.useState(0);
  const [place, setPlace] = React.useState({ index: 0, striking: false });
  const [cliTab, setCliTab] = React.useState(0);
  const [cliCopied, setCliCopied] = React.useState(false);
  
  // Live Mockup States
  const [mockSearch, setMockSearch] = React.useState('');
  const [mockActive, setMockActive] = React.useState(false);
  const [mockCopied, setMockCopied] = React.useState(false);
  const [mockUnlocked, setMockUnlocked] = React.useState(false);
  const [mockPass, setMockPass] = React.useState('');

  useEffect(() => {
    const h = (e: MouseEvent) => { if (cursorGlowRef.current) { cursorGlowRef.current.style.left = e.clientX + 'px'; cursorGlowRef.current.style.top = e.clientY + 'px'; } };
    document.addEventListener('mousemove', h);
    return () => document.removeEventListener('mousemove', h);
  }, []);

  useEffect(() => {
    const h = () => navRef.current?.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const els = wrapperRef.current?.querySelectorAll('.reveal');
    if (!els) return;
    const obs = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } }); }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const cards = wrapperRef.current?.querySelectorAll('.feat-card');
    if (!cards) return;
    const obs = new IntersectionObserver((entries) => { entries.forEach((e, i) => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('revealed'), i * 60); obs.unobserve(e.target); } }); }, { threshold: 0.08 });
    cards.forEach(c => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const els = wrapperRef.current?.querySelectorAll('[data-target]');
    if (!els) return;
    const anim = (el: Element) => { const target = parseInt((el as HTMLElement).dataset.target || '0'); if (isNaN(target)) return; const start = performance.now(); const upd = (now: number) => { const t = Math.min((now - start) / 1200, 1); el.textContent = String(Math.round((1 - Math.pow(1 - t, 4)) * target)); if (t < 1) requestAnimationFrame(upd); }; requestAnimationFrame(upd); };
    const obs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { anim(e.target); obs.unobserve(e.target); } }); }, { threshold: 0.5 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setWordIndex(i => (i + 1) % words.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let swapTimer = 0;
    const id = window.setInterval(() => {
      setPlace(p => ({ ...p, striking: true }));
      swapTimer = window.setTimeout(() => {
        setPlace(p => ({ index: (p.index + 1) % badPlaces.length, striking: false }));
      }, 380);
    }, 3800);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(swapTimer);
    };
  }, []);

  useEffect(() => {
    const rows = wrapperRef.current?.querySelectorAll('.spec-row');
    if (!rows) return;
    const fns: Array<[() => void, () => void]> = [];
    rows.forEach(row => { const el = row as HTMLElement; const a = () => { el.style.background = 'rgba(16,185,129,.02)'; }; const b = () => { el.style.background = ''; }; fns.push([a, b]); el.addEventListener('mouseenter', a); el.addEventListener('mouseleave', b); });
    return () => { rows.forEach((row, i) => { const el = row as HTMLElement; el.removeEventListener('mouseenter', fns[i][0]); el.removeEventListener('mouseleave', fns[i][1]); }); };
  }, []);

  useEffect(() => {
    const query = "Stripe";
    const pass = "••••••••";
    let charIdx = 0;
    let phase = 0; // 0: typing pass, 1: unlocking, 2: typing search, 3: found, 4: copied, 5: reset
    let timerId = 0;
    let cancelled = false;

    const schedule = (delay: number) => {
      if (!cancelled) {
        timerId = window.setTimeout(tick, delay);
      }
    };

    const tick = () => {
      if (cancelled) return;
      if (phase === 0) {
        if (charIdx < pass.length) {
          setMockPass(pass.substring(0, charIdx + 1));
          charIdx++;
          schedule(100);
        } else {
          phase = 1;
          schedule(400);
        }
      } else if (phase === 1) {
        setMockUnlocked(true);
        charIdx = 0;
        phase = 2;
        schedule(800);
      } else if (phase === 2) {
        if (charIdx < query.length) {
          setMockSearch(query.substring(0, charIdx + 1));
          charIdx++;
          schedule(150);
        } else {
          phase = 3;
          schedule(600);
        }
      } else if (phase === 3) {
        setMockActive(true);
        phase = 4;
        schedule(800);
      } else if (phase === 4) {
        setMockCopied(true);
        phase = 5;
        schedule(2000);
      } else if (phase === 5) {
        setMockPass('');
        setMockUnlocked(false);
        setMockSearch('');
        setMockActive(false);
        setMockCopied(false);
        charIdx = 0;
        phase = 0;
        schedule(1000);
      }
    };

    schedule(2000);
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, []);

  const handleCopyFlash = (e: React.MouseEvent<HTMLDivElement>) => { const card = e.currentTarget; card.classList.add('copying'); setTimeout(() => card.classList.remove('copying'), 600); };

  const copyCliInstall = async () => {
    try {
      await navigator.clipboard.writeText(cliInstall);
      setCliCopied(true);
      window.setTimeout(() => setCliCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const activeCliDemo = cliDemos[cliTab];

  return (
    <div className="scync-landing" ref={wrapperRef}>

      <div className="cursor-glow" id="cursorGlow" ref={cursorGlowRef}></div>


      <nav id="mainNav" ref={navRef}>
        <a href="#" className="nav-logo">
          <OrbLogomark size={28} imgScale={0.64} className="nav-logomark" />
          Scync
        </a>
        <ul className="nav-links">
          <li><a href="#how">How it works</a></li>
          <li><a href="#security">Security</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#cli">CLI &amp; TUI</a></li>
          <li><a href="https://github.com/hariharen9/Scync" target="_blank" rel="noopener noreferrer">GitHub ↗</a></li>
        </ul>
        <div className="nav-cta">
          <a className="nav-btn-primary" href="/app">
            Launch Scync
          </a>
        </div>
      </nav>


      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-scan" aria-hidden="true" />

        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="hero-kicker-bracket">//</span>
              <span className="hero-kicker-dot" />
              <span>Zero-knowledge secrets manager</span>
              <span className="hero-kicker-sep" />
              <span className="hero-kicker-cli">CLI</span>
            </div>

            <h1 className="hero-title">
              <span className="hero-title-line">
                Stop pasting
                <span className="hero-caret" aria-hidden="true" />
              </span>

              <span className="hero-reel">
                {words.map((word, i) => (
                  <span
                    key={word}
                    className={`hero-reel-word ${i === wordIndex ? 'is-active' : ''}`}
                    aria-hidden={i !== wordIndex}
                  >
                    {word}
                  </span>
                ))}
              </span>

              <span className="hero-title-line hero-place-line">
                into{' '}
                <span className="hero-place">
                  {badPlaces.map((badPlace, i) => (
                    <span
                      key={badPlace}
                      className={`hero-place-word ${i === place.index ? 'is-active' : ''} ${i === place.index && place.striking ? 'is-striking' : ''}`}
                      aria-hidden={i !== place.index}
                    >
                      {badPlace}
                      <span className="hero-place-period">.</span>
                    </span>
                  ))}
                </span>
              </span>
            </h1>

            <p className="hero-lede">
              Every API key, token, and environment secret in one encrypted vault.
              Synced to every device, sealed from the server, and never pasted into
              Notion again.
            </p>

            <div className="hero-actions">
              <a className="hero-primary" href="/app">
                Open your vault
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <polyline points="13 5 20 12 13 19" />
                </svg>
              </a>
              <a className="hero-secondary" href="#cli">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="1" />
                  <polyline points="6 9 10 12 6 15" />
                  <line x1="12" y1="15" x2="18" y2="15" />
                </svg>
                Explore the CLI
              </a>
            </div>

            <div className="hero-proof">
              <span className="hero-proof-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                AES-256-GCM
              </span>
              <span className="hero-proof-sep" />
              <span className="hero-proof-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                Zero-knowledge
              </span>
              <span className="hero-proof-sep" />
              <span className="hero-proof-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                MIT licensed
              </span>
              <span className="hero-proof-sep" />
              <span className="hero-proof-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <rect x="2" y="3" width="20" height="14" rx="1" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                Web · PWA
              </span>
              <span className="hero-proof-sep" />
              <span className="hero-proof-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="1" />
                  <polyline points="6 9 10 12 6 15" />
                  <line x1="12" y1="15" x2="18" y2="15" />
                </svg>
                CLI · TUI
              </span>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-visual-glow" />

            <div className="vault-frame">
              <div className="vault-frame-bar">
                <span className="vault-frame-dot" />
                <span>SCYNC / VAULT</span>
                <span className="vault-frame-status">SEALED</span>
              </div>

              <div className="vault-frame-search">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.5" y2="16.5" />
                </svg>
                <span>Search secrets…</span>
                <kbd>⌘K</kbd>
              </div>

              <div className="vault-frame-list">
                {heroSecrets.map((secret, i) => (
                  <div className={`vault-secret ${i === 0 ? 'is-active' : ''}`} key={secret.service}>
                    <span
                      className="vault-secret-initial"
                      style={{ color: secret.color, borderColor: `${secret.color}44` }}
                    >
                      {secret.initial}
                    </span>
                    <span className="vault-secret-info">
                      <span className="vault-secret-service">{secret.service}</span>
                      <span className="vault-secret-name">{secret.name}</span>
                    </span>
                    <span className="vault-secret-value">{secret.value}</span>
                    <span className="vault-secret-copy">
                      {i === 0 ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="11" height="11" rx="1" />
                          <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
                        </svg>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="vault-frame-footer">
                <span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  AES-256-GCM
                </span>
                <span>CLIENT-SIDE</span>
              </div>
            </div>

            <div className="vault-float vault-float-top">
              <span className="vault-float-dot" />
              ZERO-KNOWLEDGE
            </div>
            <div className="vault-float vault-float-bottom">
              <span className="vault-float-check">✓</span>
              Copied · clears in 30s
            </div>
          </div>
        </div>

        <div className="hero-scroll">
          <span>Scroll to explore</span>
          <div className="hero-scroll-line" />
        </div>
      </section>


      <div className="marquee-section">
        <div className="marquee-track" id="marqueeTrack">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <div key={i} className={"marquee-item" + (i % 4 === 0 ? " highlight" : "")}>
              <div className="marquee-dot"></div>{item}
            </div>
          ))}
        </div>
      </div>




      <section className="section" id="problem">
        <div className="section-inner">
          <div className="section-label reveal">The Problem</div>
          <h2 className="section-h2 reveal reveal-delay-1">You have 47 API keys.<br />You know where zero of them are.</h2>
          <p className="section-sub reveal reveal-delay-2">One in a .env file you're scared to delete. Another in a Slack DM from 2022. The rest? Good luck. Here's where developers actually store secrets — and why all of it is broken.</p>

          <div className="chaos-grid reveal reveal-delay-2">
            <div className="chaos-card">
              <div className="chaos-card-where">
                <div className="chaos-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                </div>
                Notion / Apple Notes
              </div>
              <div className="chaos-card-problem">Zero encryption. Notion staff can read your secrets. <span style={{ color: "var(--t2)" }}>You know this. You still do it.</span></div>
            </div>
            <div className="chaos-card">
              <div className="chaos-card-where">
                <div className="chaos-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </div>
                Slack DMs / Email
              </div>
              <div className="chaos-card-problem">Buried under 3,000 messages. Impossible to find. No versioning. No expiry tracking. Just chaos.</div>
            </div>
            <div className="chaos-card">
              <div className="chaos-card-where">
                <div className="chaos-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                </div>
                .env files
              </div>
              <div className="chaos-card-problem">Per-machine. No sync. You've accidentally pushed one to GitHub at least once. We all have.</div>
            </div>
            <div className="chaos-card">
              <div className="chaos-card-where">
                <div className="chaos-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2" /><path d="M8 10h8M8 14h5" /></svg>
                </div>
                1Password / Bitwarden
              </div>
              <div className="chaos-card-problem">Built for passwords. No metadata, no rotation tracking, no .env import. Using a hammer as a scalpel.</div>
            </div>
            <div className="chaos-card">
              <div className="chaos-card-where">
                <div className="chaos-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                Infisical / Doppler
              </div>
              <div className="chaos-card-problem">Engineering team CI/CD tools. You need a screwdriver — they're handing you a factory.</div>
            </div>
            <div className="chaos-card">
              <div className="chaos-card-where">
                <div className="chaos-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /></svg>
                </div>
                Camera roll screenshot
              </div>
              <div className="chaos-card-problem">Totally unsearchable. Visible in iCloud. Backed up to five places you don't control. Peak "security".</div>
            </div>
          </div>

          <div className="problem-stat reveal">
            <div className="problem-stat-item">
              <div className="pstat-num" data-target="47">0</div>
              <div className="pstat-unit">keys</div>
              <div className="pstat-desc">average secrets a solo developer manages across their projects</div>
            </div>
            <div className="problem-stat-item">
              <div className="pstat-num" data-target="6">0</div>
              <div className="pstat-unit">places</div>
              <div className="pstat-desc">they're spread across when there's no dedicated tool</div>
            </div>
            <div className="problem-stat-item">
              <div className="pstat-num" data-target="0">∞</div>
              <div className="pstat-unit">tools</div>
              <div className="pstat-desc">that are personal-first, zero-knowledge, cross-platform, and open source</div>
            </div>
          </div>
        </div>
      </section>


      <section className="loop-section" id="how">
        <div className="loop-bg"></div>
        <div className="loop-inner">
          <div className="section-label reveal">Core loop</div>
          <h2 className="section-h2 reveal reveal-delay-1">Three steps.<br />That's the whole product.</h2>
          <p className="section-sub reveal reveal-delay-2">Everything in Scync exists to make this loop faster and the secrets inside it more trustworthy.</p>

          <div className="loop-steps reveal reveal-delay-2">
            <div className="loop-step">
              <div className="loop-step-num"><span>1</span> Step one</div>
              <div className="loop-step-title">Unlock vault</div>
              <div className="loop-step-desc">Enter your vault password. It never leaves your device. PBKDF2 derives a 256-bit key that decrypts everything in memory.</div>
            </div>
            <div className="loop-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "relative", zIndex: "1", background: "var(--s1)", padding: "2px" }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </div>
            <div className="loop-step">
              <div className="loop-step-num"><span>2</span> Step two</div>
              <div className="loop-step-title">Find secret</div>
              <div className="loop-step-desc">Search by name, service, or type. In-memory. No network calls. No spinners. Results appear as you type.</div>
            </div>
            <div className="loop-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "relative", zIndex: "1", background: "var(--s1)", padding: "2px" }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </div>
            <div className="loop-step">
              <div className="loop-step-num"><span>3</span> Step three</div>
              <div className="loop-step-title">Copy value</div>
              <div className="loop-step-desc">One click. No confirm dialog. No "are you sure?". The value is on your clipboard. You're done.</div>
            </div>
          </div>


          <div className="vault-mockup reveal reveal-delay-3">
            {!mockUnlocked ? (
              <div className="v-lock-screen">
                <div className="v-lock-icon">🔒</div>
                <div className="v-lock-title">Vault Locked</div>
                <div className="v-pass-field">
                  {mockPass || <span style={{ color: 'var(--t3)' }}>Enter master password</span>}
                  <div className="v-search-cursor"></div>
                </div>
                <div className="v-lock-hint">AES-256-GCM local decryption</div>
              </div>
            ) : (
              <>
                <div className="vault-mockup-header">
                  <div className="v-search-bar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    <div className="v-search-text">
                      {mockSearch || <span style={{ color: 'var(--t3)' }}>Search secrets...</span>}
                      <div className="v-search-cursor"></div>
                    </div>
                  </div>
                </div>
                <div className="vault-mockup-body">
                  <div className={`v-item ${mockActive ? 'active' : ''} ${!mockActive && mockSearch.length > 0 ? 'filtered' : ''}`}>
                    <div className="v-item-dot" style={{ background: 'var(--blue)' }}></div>
                    <div className="v-item-info">
                      <div className="v-item-service">STRIPE</div>
                      <div className="v-item-name">Live Secret Key</div>
                    </div>
                    <div className="v-item-val">••••••••••••••••</div>
                    {mockCopied && (
                      <div className="v-copy-tag">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        COPIED
                      </div>
                    )}
                  </div>
                  <div className={`v-item ${!mockActive && mockSearch.length > 0 ? 'filtered' : ''}`}>
                    <div className="v-item-dot" style={{ background: 'var(--green)' }}></div>
                    <div className="v-item-info">
                      <div className="v-item-service">OPENAI</div>
                      <div className="v-item-name">Project Key</div>
                    </div>
                    <div className="v-item-val">••••••••••••••••</div>
                  </div>
                </div>
                <div className="v-status-bar">
                  <div className="v-status-dot"></div>
                  <span>Vault Decrypted</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="security-section" id="security">
        <div className="sec-glow"></div>
        <div className="security-split">
          <div>
            <div className="section-label reveal">Security model</div>
            <h2 className="section-h2 reveal reveal-delay-1">Zero-knowledge.<br />Not "we promise."<br /><span style={{ color: "var(--green)" }}>Architecturally.</span></h2>
            <p className="section-sub reveal reveal-delay-2" style={{ marginBottom: "0" }}>The server never receives your plaintext. Your vault password never leaves your device. A Firebase breach doesn't expose your secrets. This is enforced by math, not policy.</p>

            <div className="sec-layers reveal reveal-delay-2">
              <div className="sec-layer sec-layer-1">
                <div className="sec-layer-label">Layer 1 — Identity</div>
                <div className="sec-layer-title">Firebase Auth</div>
                <div className="sec-layer-desc">Handles sign-in — Google or email &amp; password. Controls which Firestore documents you can access. <strong style={{ color: "var(--t1)" }}>Does not protect secret content.</strong></div>
              </div>
              <div className="sec-layer sec-layer-2">
                <div className="sec-layer-label">Layer 2 — Hardware</div>
                <div className="sec-layer-title">WebAuthn PRF + Web Crypto</div>
                <div className="sec-layer-desc">Your device's <strong>Secure Enclave</strong> derives encryption keys that never leave the hardware. This "wraps" your Master Password, ensuring even we can't see your biometric link.</div>
              </div>
            </div>
          </div>

          <div>
            <div className="spec-table reveal reveal-delay-1">
              <div className="section-label" style={{ marginBottom: "20px" }}>Encryption spec</div>
              <div className="spec-row">
                <div className="spec-key">Algorithm</div>
                <div className="spec-val"><span>AES-256-GCM</span> — authenticated encryption with integrity verification</div>
              </div>
              <div className="spec-row">
                <div className="spec-key">Key derivation</div>
                <div className="spec-val"><span>PBKDF2-SHA256</span>, <span>310,000</span> iterations — OWASP 2023 recommendation</div>
              </div>
              <div className="spec-row">
                <div className="spec-key">IV</div>
                <div className="spec-val">Fresh <span>12-byte random IV</span> per encryption operation — never reused</div>
              </div>
              <div className="spec-row">
                <div className="spec-key">Key material</div>
                <div className="spec-val">vaultPassword + uid — prevents cross-account attacks</div>
              </div>
              <div className="spec-row">
                <div className="spec-key">Implementation</div>
                <div className="spec-val"><span>Web Crypto API</span> for vault encryption &amp; key derivation — no third-party AES/PBKDF2 code</div>
              </div>
              <div className="spec-row">
                <div className="spec-key">Key storage</div>
                <div className="spec-val"><span>In-memory only</span> — non-extractable CryptoKey, never persisted to disk</div>
              </div>
            </div>

            <div style={{ marginTop: "32px" }} className="reveal reveal-delay-2">
              <div className="section-label" style={{ marginBottom: "14px" }}>What Firebase can see</div>
              <div className="firebase-table">
                <div className="fb-row">
                  <div className="fb-field">Field</div>
                  <div className="fb-access">Firebase sees</div>
                </div>
                <div className="fb-row">
                  <div className="fb-field">Names, services, types, host labels</div>
                  <div className="fb-access plain">Plaintext</div>
                </div>
                <div className="fb-row">
                  <div className="fb-field">Timestamps &amp; expiry dates</div>
                  <div className="fb-access plain">Plaintext</div>
                </div>
                <div className="fb-row">
                  <div className="fb-field" style={{ color: "var(--t1)", fontWeight: "600" }}>Secret values, passwords, notes</div>
                  <div className="fb-access enc">Encrypted blob</div>
                </div>
                <div className="fb-row">
                  <div className="fb-field" style={{ color: "var(--t1)", fontWeight: "600" }}>SSH private keys, 2FA seeds, cert PEMs</div>
                  <div className="fb-access enc">Encrypted blob</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="security-audit">
          <div className="security-audit-copy">
            <div className="section-label reveal">Open source</div>
            <h3 className="security-audit-title reveal reveal-delay-1">Read every line.<br />Audit everything.</h3>
            <p className="security-audit-sub reveal reveal-delay-2">
              Core vault encryption and key derivation use only the browser&apos;s native Web Crypto API. Any developer can read and verify it in under 15 minutes. No black boxes. No &quot;trust us.&quot;
            </p>

            <div className="oss-stats reveal reveal-delay-2">
              <div className="oss-stat">
                <div className="oss-stat-val">MIT</div>
                <div className="oss-stat-label">License</div>
              </div>
              <div className="oss-stat">
                <div className="oss-stat-val">0</div>
                <div className="oss-stat-label">Paid tiers. Ever.</div>
              </div>
              <div className="oss-stat">
                <div className="oss-stat-val">Web</div>
                <div className="oss-stat-label">Native Crypto Core</div>
              </div>
              <div className="oss-stat">
                <div className="oss-stat-val">∞</div>
                <div className="oss-stat-label">Secrets stored</div>
              </div>
            </div>

            <a
              className="security-audit-link reveal reveal-delay-3"
              href="https://github.com/hariharen9/Scync/blob/main/packages/core/src/crypto.ts"
              target="_blank"
              rel="noreferrer"
            >
              Read the crypto source ↗
            </a>
          </div>

          <div className="oss-code reveal reveal-delay-2">
            <div className="oss-code-bar">
              <div className="t-dot" style={{ background: "#ef4444" }}></div>
              <div className="t-dot" style={{ background: "#f59e0b" }}></div>
              <div className="t-dot" style={{ background: "#10b981" }}></div>
              <span style={{ marginLeft: "8px" }}>packages/core/src/crypto.ts</span>
            </div>
            <div className="oss-code-body">
              <div><span className="code-keyword">export async function</span> <span className="code-fn">deriveKey</span>(</div>
              <div>{"  "}password: <span className="code-type">string</span>, uid: <span className="code-type">string</span>, salt: <span className="code-type">Uint8Array</span></div>
              <div>): <span className="code-type">Promise</span>&lt;<span className="code-type">CryptoKey</span>&gt; {"{"}</div>
              <div>{"  "}<span className="code-keyword">const</span> baseKey = <span className="code-keyword">await</span> crypto.subtle.<span className="code-fn">importKey</span>(</div>
              <div>{"    "}<span className="code-str">"raw"</span>, encode(password + uid), <span className="code-str">"PBKDF2"</span>, <span className="code-keyword">false</span>, [<span className="code-str">"deriveKey"</span>]);</div>
              <div>{"  "}<span className="code-keyword">return</span> crypto.subtle.<span className="code-fn">deriveKey</span>(</div>
              <div>{"    "}{"{"} name: <span className="code-str">"PBKDF2"</span>, salt, iterations: <span className="code-num">310_000</span>, hash: <span className="code-str">"SHA-256"</span> {"}"},</div>
              <div>{"    "}baseKey, {"{"} name: <span className="code-str">"AES-GCM"</span>, length: <span className="code-num">256</span> {"}"}, <span className="code-keyword">false</span>, [<span className="code-str">"encrypt"</span>, <span className="code-str">"decrypt"</span>]);</div>
              <div>{"}"}</div>
            </div>
          </div>
        </div>
      </section>


      <section className="section" id="features">
        <div className="section-inner">
          <div className="section-label reveal">Features</div>
          <h2 className="section-h2 reveal reveal-delay-1">Built for how developers actually think about secrets.</h2>
          <p className="section-sub reveal reveal-delay-2">59+ built-in services, 15 typed secret forms, SSH keys, certificates, passwords, and the .env files around them. Organized the way you work.</p>

          <div className="features-grid">


            <div className="feat-card feat-card-large reveal">
              <div className="feat-large-text">
                <div className="feat-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                </div>
                <div className="feat-title">Project-based organization</div>
                <div className="feat-desc">Secrets live in projects, not a flat list. Your Stripe project holds all Stripe keys across environments. Your side project holds everything for that app. Organized the way you actually think.</div>
              </div>
              <div className="feat-large-visual">
                <div className="mini-card" onClick={handleCopyFlash} >
                  <div className="mini-card-dot" style={{ background: "#10b981" }}></div>
                  <div style={{ flex: "1" }}>
                    <div className="mini-card-service">Anthropic</div>
                    <div className="mini-card-name">Claude API Key</div>
                  </div>
                  <div className="mini-card-val">••••••••••••••</div>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="1" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                </div>
                <div className="mini-card" onClick={handleCopyFlash} >
                  <div className="mini-card-dot" style={{ background: "#60a5fa" }}></div>
                  <div style={{ flex: "1" }}>
                    <div className="mini-card-service">GitHub</div>
                    <div className="mini-card-name">Personal Access Token</div>
                  </div>
                  <div className="mini-card-val">••••••••••••••</div>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="1" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                </div>
                <div className="mini-card" onClick={handleCopyFlash} >
                  <div className="mini-card-dot" style={{ background: "#f59e0b" }}></div>
                  <div style={{ flex: "1" }}>
                    <div className="mini-card-service">Stripe</div>
                    <div className="mini-card-name">Secret Key (prod)</div>
                  </div>
                  <div className="mini-card-val">••••••••••••••</div>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="1" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                </div>
                <div className="mini-card" onClick={handleCopyFlash} >
                  <div className="mini-card-dot" style={{ background: "#a78bfa" }}></div>
                  <div style={{ flex: "1" }}>
                    <div className="mini-card-service">OpenAI</div>
                    <div className="mini-card-name">Project API Key</div>
                  </div>
                  <div className="mini-card-val">••••••••••••••</div>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="1" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                </div>
                <div style={{ fontSize: "10.5px", color: "var(--t3)", fontFamily: "var(--mono)", textAlign: "center", paddingTop: "4px" }}>
                  ↑ click any card to copy
                </div>
              </div>
            </div>

            <div className="feat-card reveal reveal-delay-1">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              </div>
              <div className="feat-title">Instant search</div>
              <div className="feat-desc">In-memory. No network round-trips. No spinners. Filter by name, service, type, environment, or status — results update as you type.</div>
            </div>

            <div className="feat-card reveal reveal-delay-1">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
              </div>
              <div className="feat-title">.env import & export</div>
              <div className="feat-desc">Drag your .env file in. Pull a project back out as a .env. The gap between local and stored secrets is one drop away.</div>
            </div>

            <div className="feat-card reveal reveal-delay-2">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
              </div>
              <div className="feat-title">Security Cockpit</div>
              <div className="feat-desc">Live vault health score, 30-day expiry and rotation alerts, plus 1-click quick access to live 2FA codes and SSH keys right from your dashboard.</div>
            </div>

            <div className="feat-card reveal reveal-delay-2">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              </div>
              <div className="feat-title">Biometric Passkeys</div>
              <div className="feat-desc">The first vault to use <strong>Hardware-Backed PRF</strong> in the browser. Unlock with FaceID or Fingerprint using your device&apos;s secure hardware enclave. Native speed, zero-knowledge security.</div>
            </div>

            <div className="feat-card reveal reveal-delay-3">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              </div>
              <div className="feat-title">Zero-Knowledge Sharing</div>
              <div className="feat-desc">Share secrets via encrypted links. Decryption key in URL fragment <strong>never reaches the server</strong>. Set expiry times and view limits.</div>
            </div>

            <div className="feat-card reveal reveal-delay-3">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              </div>
              <div className="feat-title">59+ Services &amp; 15 Secret Forms</div>
              <div className="feat-desc">Purpose-built forms for OpenAI, Anthropic, Supabase, Neon, Clerk, Stripe, 12/24-word <strong>Recovery Phrases</strong>, and a structured <strong>Database URL</strong> builder.</div>
            </div>

            <div className="feat-card reveal reveal-delay-3">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
              </div>
              <div className="feat-title">Emergency Recovery Kit</div>
              <div className="feat-desc">Printable offline HTML kit containing an encrypted recovery key and QR code. Restore your vault if you ever forget your master password.</div>
            </div>

            <div className="feat-card reveal reveal-delay-3">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <div className="feat-title">Passwords & CSV Import</div>
              <div className="feat-desc">Dedicated vault for website credentials with resilient 1-click CSV migration from Bitwarden, 1Password, Chrome, Apple Keychain, and LastPass.</div>
            </div>

            <div className="feat-card reveal reveal-delay-3">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div className="feat-title">Versioning & Rollback</div>
              <div className="feat-desc">Automatic point-in-time snapshots whenever secrets are modified or rotated. Inspect history and roll back previous values with 1 click.</div>
            </div>

            <div className="feat-card reveal reveal-delay-3">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
              </div>
              <div className="feat-title">Vault Activity Ledger</div>
              <div className="feat-desc">A real-time audit ledger right on your dashboard tracking every creation, secret rotation, version rollback, and shared link event.</div>
            </div>

            <div className="feat-card reveal reveal-delay-3">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="1" /><polyline points="6 9 10 12 6 15" /><line x1="12" y1="15" x2="18" y2="15" /></svg>
              </div>
              <div className="feat-title">TUI + CLI. Terminal native.</div>
              <div className="feat-desc">A full-screen terminal vault and a scriptable CLI, backed by the same zero-knowledge core. Same master password, same data, no browser required.</div>
              <a className="feat-inline-link" href="#cli">Explore the CLI →</a>
            </div>
          </div>
        </div>
      </section>

      <section className="cli-section" id="cli">
        <div className="cli-section-glow" aria-hidden="true" />

        <div className="cli-inner">
          <div className="cli-copy reveal">
            <div className="section-label">Terminal native</div>
            <h2 className="section-h2">
              The same vault.<br />
              <span style={{ color: 'var(--green)' }}>In your terminal.</span>
            </h2>
            <p className="section-sub">
              Scync ships with a full-screen TUI and a scriptable CLI. Same master
              password, same zero-knowledge vault, same data as the web app — just
              closer to the work.
            </p>

            <div className="cli-chips">
              <span className="cli-chip"><span className="cli-chip-dot" /> Full-screen TUI</span>
              <span className="cli-chip"><span className="cli-chip-dot" /> Scriptable CLI</span>
              <span className="cli-chip"><span className="cli-chip-dot" /> Agent custody</span>
              <span className="cli-chip"><span className="cli-chip-dot" /> CI-ready</span>
            </div>

            <div className="cli-install">
              <div className="cli-install-head">
                <span>Install from source</span>
                <span className="cli-install-req">Node 20+</span>
              </div>
              <pre className="cli-install-code"><code>{cliInstall}</code></pre>
              <button
                type="button"
                className={`cli-copy-btn ${cliCopied ? 'is-copied' : ''}`}
                onClick={copyCliInstall}
              >
                {cliCopied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="cli-links">
              <a href="https://github.com/hariharen9/Scync-cli#readme" target="_blank" rel="noreferrer">
                Read the CLI guide ↗
              </a>
              <a href="https://github.com/hariharen9/Scync-cli" target="_blank" rel="noreferrer">
                View CLI source ↗
              </a>
            </div>
          </div>

          <div className="cli-demo reveal reveal-delay-1">
            <div className="cli-tabs" role="tablist" aria-label="CLI demo">
              {cliDemos.map((demo, i) => (
                <button
                  key={demo.id}
                  type="button"
                  role="tab"
                  aria-selected={cliTab === i}
                  className={`cli-tab ${cliTab === i ? 'is-active' : ''}`}
                  onClick={() => setCliTab(i)}
                >
                  {demo.label}
                </button>
              ))}
            </div>

            <div className="cli-window">
              <div className="cli-window-bar">
                <span className="cli-dot cli-dot-red" />
                <span className="cli-dot cli-dot-amber" />
                <span className="cli-dot cli-dot-green" />
                <span className="cli-window-title">scync — terminal vault</span>
                <span className="cli-window-status">local</span>
              </div>

              <div className="cli-window-body">
                <div className="cli-command-line">
                  <span className="cli-prompt">$</span>
                  <span className="cli-command">{activeCliDemo.command}</span>
                  <span className="cli-cursor" />
                </div>
                {activeCliDemo.output.map((line, i) => (
                  <div key={i} className={`cli-line cli-line-${line.tone}`}>
                    {line.text}
                  </div>
                ))}
              </div>

              <div className="cli-window-footer">
                <span>v0.1.0</span>
                <span>zero-knowledge · agent custody</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cli-command-grid section-inner reveal reveal-delay-2">
          {cliCommandCards.map(card => (
            <div className="cli-command-card" key={card.command}>
              <code>{card.command}</code>
              <div className="cli-command-label">{card.label}</div>
              <div className="cli-command-desc">{card.desc}</div>
            </div>
          ))}
        </div>
      </section>


      <section className="beyond-section" id="beyond">
        <div className="section-inner">
          <div className="section-label reveal">Advanced Modules</div>
          <h2 className="section-h2 reveal reveal-delay-1">Beyond Secrets.</h2>
          <p className="section-sub reveal reveal-delay-2">The engineering toolbox you've been missing. Fully integrated, zero-knowledge, and built for speed.</p>

          <div className="beyond-grid reveal">
            <div className="beyond-item">
              <div className="beyond-visual">
                <div className="ssh-mockup">
                  <div style={{ color: '#8b949e', marginBottom: '4px' }}># SCYNC SSH CONFIG</div>
                  <div><span style={{ color: '#ff7b72' }}>Host</span> prod-server</div>
                  <div>{"  "}<span style={{ color: '#79c0ff' }}>IdentityFile</span> ~/.ssh/scync-prod.pem</div>
                  <div style={{ marginTop: '8px', color: '#8b949e' }}># Generating new key...</div>
                  <div style={{ color: '#d2a8ff' }}>$ ssh-keygen -t ed25519 -C "scync"</div>
                  <div style={{ color: 'var(--green)' }}>[✓] Keypair generated locally</div>
                  <span className="ssh-cursor"></span>
                </div>
              </div>
              <div className="beyond-text">
                <h3 className="beyond-title">SSH Key Manager</h3>
                <p className="beyond-desc">
                  Generate RSA/Ed25519 pairs locally. Map them to hosts and auto-generate your <code style={{ color: 'var(--green)', fontSize: '12px' }}>~/.ssh/config</code>. Your most sensitive keys, vaulted with hardware-backed security.
                </p>
              </div>
            </div>

            <div className="beyond-item">
              <div className="beyond-visual">
                <div className="tfa-mockup">
                  <div className="tfa-card">
                    <div>
                      <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '2px' }}>GitHub</div>
                      <div className="tfa-code">482 910</div>
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--b2)', borderTopColor: 'var(--green)', animation: 'spin 2s linear infinite' }}></div>
                  </div>
                  <div className="tfa-card" style={{ opacity: 0.6 }}>
                    <div>
                      <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '2px' }}>AWS Production</div>
                      <div className="tfa-code">104 382</div>
                    </div>
                  </div>
                  <div className="tfa-timer">
                    <div className="tfa-progress"></div>
                  </div>
                </div>
              </div>
              <div className="beyond-text">
                <h3 className="beyond-title">2FA Authenticator</h3>
                <p className="beyond-desc">
                  Move your second factors out of siloed apps. Zero-knowledge sync for all your authenticator codes with seamless QR drag-and-drop and real-time countdowns.
                </p>
              </div>
            </div>
            <div className="beyond-item">
              <div className="beyond-visual">
                <div className="cert-mockup">
                  <div className="cert-header">
                    <div className="cert-icon-mini">📜</div>
                    <div>
                      <div className="cert-domain">*.scync.dev</div>
                      <div className="cert-issuer">by Let's Encrypt</div>
                    </div>
                  </div>
                  <div className="cert-meta">
                    <div className="cert-tag">Valid</div>
                    <div className="cert-tag">RSA 2048</div>
                  </div>
                  <div className="cert-expiry">
                    <div className="cert-expiry-bar">
                      <div className="cert-expiry-fill"></div>
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--t3)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>NOV 2026</span>
                      <span>NOV 2027</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="beyond-text">
                <h3 className="beyond-title">Certificate Manager</h3>
                <p className="beyond-desc">
                  Zero-knowledge storage for your PEM/CRT/KEY files. Client-side parsing extracts metadata and tracks expiry dates so you never have a production outage again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="compare-section">
        <div className="compare-inner">
          <div className="section-label reveal">Why Scync</div>
          <h2 className="section-h2 reveal reveal-delay-1">Every other tool misses something.</h2>
          <p className="section-sub reveal reveal-delay-2">Personal-first. Zero-knowledge. Cross-platform. Open source. Terminal-native. Pleasant to use. All six. That's the gap Scync fills.</p>

          <div className="compare-table-wrapper">
            <div className="compare-table reveal">
              <div className="compare-header">
                <div className="compare-cell"></div>
                <div className="compare-cell">1Password</div>
                <div className="compare-cell">Infisical</div>
                <div className="compare-cell">KeePassXC</div>
                <div className="compare-cell">Notion</div>
                <div className="compare-cell highlight">Scync</div>
              </div>
              <div className="compare-row">
                <div className="compare-cell">Zero-knowledge</div>
                <div className="compare-cell"><span className="c-part">partial</span></div>
                <div className="compare-cell"><span className="c-part">partial</span></div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell highlight"><span className="c-yes">✓</span></div>
              </div>
              <div className="compare-row">
                <div className="compare-cell">Built for API keys</div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell highlight"><span className="c-yes">✓</span></div>
              </div>
              <div className="compare-row">
                <div className="compare-cell">CLI + TUI</div>
                <div className="compare-cell"><span className="c-part">partial</span></div>
                <div className="compare-cell"><span className="c-part">partial</span></div>
                <div className="compare-cell"><span className="c-part">partial</span></div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell highlight"><span className="c-yes">✓</span></div>
              </div>
              <div className="compare-row">
                <div className="compare-cell">Cross-platform sync</div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
                <div className="compare-cell highlight"><span className="c-yes">✓</span></div>
              </div>
              <div className="compare-row">
                <div className="compare-cell">Open source</div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell highlight"><span className="c-yes">✓</span></div>
              </div>
              <div className="compare-row">
                <div className="compare-cell">Free forever</div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell"><span className="c-part">free tier</span></div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
                <div className="compare-cell"><span className="c-part">free tier</span></div>
                <div className="compare-cell highlight"><span className="c-yes">✓</span></div>
              </div>
            </div>
          </div>

          <div className="compare-cli-note reveal reveal-delay-2">
            <div>
              <div className="section-label" style={{ marginBottom: '8px' }}>Terminal native</div>
              <p>Same vault in the browser, TUI, or CLI.</p>
            </div>
            <a href="#cli">See the CLI →</a>
          </div>
        </div>
      </section>


      <section className="cta-section" id="get-started">
        <div className="cta-glow"></div>
        <div className="cta-grid"></div>
        <div className="cta-inner">
          <div className="cta-pre reveal">Start now</div>
          <h2 className="cta-h2 reveal reveal-delay-1">The tool that should<br />have always existed.</h2>
          <p className="cta-sub reveal reveal-delay-2">From the moment you first pasted an API key into a Notion page, this is what should have been there instead.</p>
          <div className="reveal reveal-delay-3">
            <a className="google-btn" href="/app" style={{ margin: "0 auto", fontSize: "15px", padding: "15px 28px" }} >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="4" y1="12" x2="20" y2="12" /><polyline points="13 5 20 12 13 19" /></svg>
              Get started — it's free
            </a>
          </div>
          <div className="cta-note reveal reveal-delay-4">No credit card · No team plan · MIT licensed · Open source forever</div>
          <a className="cta-cli-link reveal reveal-delay-4" href="#cli">
            Prefer the terminal? <span>Explore the CLI →</span>
          </a>
        </div>
      </section>


      <footer>
        <div className="footer-logo">
          <div className="nav-logomark" style={{ width: '24px', height: '24px', borderRadius: '4px' }}>
            <img src="/logo.png" alt="" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
          </div>
          Scync
        </div>
        <div className="footer-links">
          <a href="#how">How it works</a>
          <a href="#security">Security</a>
          <a href="#features">Features</a>
          <a href="#cli">CLI &amp; TUI</a>
          <a href="https://github.com/hariharen9/Scync/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>
          <a href="https://github.com/hariharen9/Scync" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://github.com/hariharen9/Scync-cli" target="_blank" rel="noopener noreferrer">CLI GitHub</a>
        </div>
        <div className="footer-copy">
          <span className="copy-text">© 2026 Scync. Free forever.</span>
          <span className="footer-sep">·</span>
          <span className="creator-text">Created by <a href="https://hariharen.space" target="_blank" rel="noopener noreferrer">Hariharen</a></span>
        </div>
      </footer>

    </div>
  );
};
