import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '@scync/ui';
import './AuthPage.css';

const floatData = [
  { service: 'ANTHROPIC', name: 'Claude API Key', color: '#d4a27a', x: '8%', y: '20%', delay: '0s', dur: '7s' },
  { service: 'GITHUB', name: 'Personal Token', color: '#aaa', x: '82%', y: '15%', delay: '1.5s', dur: '9s' },
  { service: 'OPENAI', name: 'Project Key', color: '#10b981', x: '5%', y: '70%', delay: '3s', dur: '8s' },
  { service: 'STRIPE', name: 'Secret Key', color: '#818cf8', x: '80%', y: '72%', delay: '0.8s', dur: '10s' },
  { service: 'NETLIFY', name: 'API Token', color: '#38bdf8', x: '18%', y: '85%', delay: '2s', dur: '7.5s' },
  { service: 'AWS', name: 'Access Key', color: '#f59e0b', x: '74%', y: '45%', delay: '4s', dur: '9.5s' },
];

const marqueeItems = [
  'AES-256-GCM', 'Zero-Knowledge Architecture', 'PBKDF2-SHA256 \u00b7 310,000 iterations',
  'Web Crypto API', 'In-Memory Decryption', 'MIT Licensed', 'Open Source',
  'No Password Storage', 'Fresh IV Per Encrypt', 'Real-Time Sync',
  'Cross-Platform', 'Non-Extractable Keys', 'Firebase-Backed', 'Free Forever',
];

const words = ['API keys', 'secrets', 'tokens', 'credentials', 'OAuth secrets'];

export const AuthPage: React.FC = () => {
  const { signIn } = useAuthStore();
  const navRef = useRef<HTMLElement>(null);
  const cursorGlowRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const heroGridRef = useRef<HTMLDivElement>(null);

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
    let idx = 0;
    const iv = setInterval(() => { idx = (idx + 1) % words.length; const el = wordRef.current; if (!el) return; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; el.style.transition = 'opacity 250ms ease, transform 250ms ease'; setTimeout(() => { if (!el) return; el.innerHTML = words[idx] + '<span class="cursor"></span>'; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 280); }, 2800);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const h = () => { if (heroGridRef.current) heroGridRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`; };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const rows = wrapperRef.current?.querySelectorAll('.spec-row');
    if (!rows) return;
    const fns: Array<[() => void, () => void]> = [];
    rows.forEach(row => { const el = row as HTMLElement; const a = () => { el.style.background = 'rgba(16,185,129,.02)'; }; const b = () => { el.style.background = ''; }; fns.push([a, b]); el.addEventListener('mouseenter', a); el.addEventListener('mouseleave', b); });
    return () => { rows.forEach((row, i) => { const el = row as HTMLElement; el.removeEventListener('mouseenter', fns[i][0]); el.removeEventListener('mouseleave', fns[i][1]); }); };
  }, []);

  const handleCopyFlash = (e: React.MouseEvent<HTMLDivElement>) => { const card = e.currentTarget; card.classList.add('copying'); setTimeout(() => card.classList.remove('copying'), 600); };

  return (
    <div className="scync-landing" ref={wrapperRef}>

      <div className="cursor-glow" id="cursorGlow" ref={cursorGlowRef}></div>


      <nav id="mainNav" ref={navRef}>
        <a href="#" className="nav-logo">
          <div className="nav-logomark">
            <img src="/logo.png" alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
          </div>
          Scync
        </a>
        <ul className="nav-links">
          <li><a href="#how">How it works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#security">Security</a></li>
          <li><a href="https://github.com/hariharen9/Scync" target="_blank">GitHub ↗</a></li>
        </ul>
        <div className="nav-cta">
          <button className="nav-btn-primary" onClick={signIn}>
            Launch Scync 🚀
          </button>
        </div>
      </nav>


      <section className="hero">
        <div className="hero-grid" ref={heroGridRef}></div>
        <div className="hero-glow-center"></div>
        <div className="hero-scan"></div>


        <div className="hero-float-cards" id="floatCards">
          {floatData.map((d, i) => (
            <div key={i} className="float-card" style={{ left: d.x, top: d.y, animationDelay: d.delay, animationDuration: d.dur }}>
              <div className="float-card-dot" style={{ background: d.color }}></div>
              <div>
                <div className="float-card-service" style={{ color: d.color }}>{d.service}</div>
                <div style={{ fontSize: "11px", color: "var(--t2)", fontWeight: "600", letterSpacing: "-.01em", fontFamily: "var(--font)" }}>{d.name}</div>
              </div>
              <div className="float-card-val">••••••••••••</div>
            </div>
          ))}
        </div>

        <div className="hero-badge">
          <div className="hero-badge-dot"></div>
          Open source · Zero-knowledge · Free forever
        </div>

        <h1 className="hero-h1">
          Stop pasting
          <span className="line-green" ref={wordRef}>API keys<span className="cursor"></span></span>
          into Notion.
        </h1>

        <p className="hero-sub">
          Scync is the secrets manager built for developers who are tired of losing credentials across Slack DMs, .env files, and screenshots. One vault. Every device. Server never sees a thing.
        </p>

        <div className="hero-cta">
          <button className="google-btn" onClick={signIn} id="hero-google-btn">
            <svg width="17" height="17" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Continue with Google — it's free
          </button>
          <a href="https://github.com/hariharen9/Scync" target="_blank" className="hero-cta-secondary">
            View on GitHub
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </a>
        </div>

        <div className="hero-trust">
          <div className="trust-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            AES-256-GCM
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
            Zero-knowledge
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            MIT licensed
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="1" /><path d="M8 21h8M12 17v4" /></svg>
            Web · Desktop · Mobile
          </div>
        </div>

        <div className="scroll-indicator">
          <span className="scroll-text">Scroll</span>
          <div className="scroll-line"></div>
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


          <div className="terminal reveal reveal-delay-3">
            <div className="terminal-bar">
              <div className="t-dot" style={{ background: "#ef4444" }}></div>
              <div className="t-dot" style={{ background: "#f59e0b" }}></div>
              <div className="t-dot" style={{ background: "#10b981" }}></div>
              <span style={{ marginLeft: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--t3)" }}>scync — vault unlocked</span>
            </div>
            <div className="terminal-body">
              <div><span className="t-comment">// Your vault. Decrypted. In memory only.</span></div>
              <div>{" "}</div>
              <div><span className="t-key">const</span> vault = <span className="t-fn">await</span> scync.<span className="t-fn">unlock</span>(<span className="t-str">"your-vault-password"</span>);</div>
              <div>{" "}</div>
              <div><span className="t-comment">// Find any secret instantly</span></div>
              <div><span className="t-key">const</span> key = vault.<span className="t-fn">find</span>(<span className="t-str">"openai"</span>);</div>
              <div><span className="t-dim">// → {"{"} name: "OpenAI API Key", service: "OpenAI",</span></div>
              <div><span className="t-dim">//     value: </span><span className="t-val">"sk-proj-xxxxxxxx..."</span><span className="t-dim">, env: "development" {"}"}</span></div>
              <div>{" "}</div>
              <div><span className="t-comment">// Server only ever sees this:</span></div>
              <div><span className="t-dim">{"{"} value: </span><span className="t-val">"Uv8xQz3mK9pL2nR7..."</span><span className="t-dim"> {"}"} </span><span className="t-comment">// ← encrypted blob. useless.</span></div>
              <div>{" "}</div>
              <div><span className="t-key">await</span> navigator.clipboard.<span className="t-fn">writeText</span>(key.value); <span className="t-comment">// done.</span><span className="t-cursor-inline"></span></div>
            </div>
          </div>
        </div>
      </section>


      <section className="section" id="features">
        <div className="section-inner">
          <div className="section-label reveal">Features</div>
          <h2 className="section-h2 reveal reveal-delay-1">Built for how developers actually think about secrets.</h2>
          <p className="section-sub reveal reveal-delay-2">Not passwords. Not team secrets. Not CI/CD pipelines. Your credentials, organized the way you work.</p>

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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              </div>
              <div className="feat-title">Expiry tracking</div>
              <div className="feat-desc">See what's expiring in 30 days. See what hasn't rotated in a year. A quick dashboard scan tells you the health of your entire credential ecosystem.</div>
            </div>

            <div className="feat-card reveal reveal-delay-2">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              </div>
              <div className="feat-title">Recovery code UX</div>
              <div className="feat-desc">Codes are numbered. You mark them used. The remaining count is always visible. Know exactly which code to reach for at 2am when you're locked out.</div>
            </div>

            <div className="feat-card reveal reveal-delay-3">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="1" /><path d="M8 21h8M12 17v4" /></svg>
              </div>
              <div className="feat-title">Web · Desktop · Mobile</div>
              <div className="feat-desc">One React codebase. Three platforms. Web, Electron (Windows), Capacitor (iOS + Android). Identical components, same logic, same encrypted sync.</div>
            </div>

            <div className="feat-card reveal reveal-delay-3">
              <div className="feat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="1" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <div className="feat-title">Always masked by default</div>
              <div className="feat-desc">The primary action is copy — not reveal. Values are hidden until you explicitly toggle them. Your screen is safe in public. One click to copy, no confirmation.</div>
            </div>
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
                <div className="sec-layer-desc">Handles Google Sign-In. Controls which Firestore documents you can access. <strong style={{ color: "var(--t1)" }}>Does not protect secret content.</strong></div>
              </div>
              <div className="sec-layer sec-layer-2">
                <div className="sec-layer-label">Layer 2 — Encryption</div>
                <div className="sec-layer-title">Vault Password + Web Crypto API</div>
                <div className="sec-layer-desc">Operates 100% on your device. Firebase never participates. <strong style={{ color: "var(--t1)" }}>The only thing that can decrypt your secrets.</strong></div>
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
                <div className="spec-val"><span>Web Crypto API only</span> — no third-party crypto libraries</div>
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
                  <div className="fb-field">Secret name, service, type</div>
                  <div className="fb-access plain">Plaintext</div>
                </div>
                <div className="fb-row">
                  <div className="fb-field">Timestamps</div>
                  <div className="fb-access plain">Plaintext</div>
                </div>
                <div className="fb-row">
                  <div className="fb-field" style={{ color: "var(--t1)", fontWeight: "600" }}>Secret value</div>
                  <div className="fb-access enc">Encrypted blob</div>
                </div>
                <div className="fb-row">
                  <div className="fb-field" style={{ color: "var(--t1)", fontWeight: "600" }}>Notes</div>
                  <div className="fb-access enc">Encrypted blob</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="compare-section">
        <div className="compare-inner">
          <div className="section-label reveal">Why Scync</div>
          <h2 className="section-h2 reveal reveal-delay-1">Every other tool misses something.</h2>
          <p className="section-sub reveal reveal-delay-2">Personal-first. Zero-knowledge. Cross-platform. Open source. Pleasant to use. All five. That's the gap Scync fills.</p>

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
                <div className="compare-cell">Cross-platform sync</div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
                <div className="compare-cell highlight"><span className="c-yes">✓</span></div>
              </div>
              <div className="compare-row">
                <div className="compare-cell">Personal-first (not team)</div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
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
              <div className="compare-row">
                <div className="compare-cell">Rotation dashboard</div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell"><span className="c-yes">✓</span></div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell"><span className="c-no">✗</span></div>
                <div className="compare-cell highlight"><span className="c-yes">✓</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="oss-section">
        <div className="oss-inner">
          <div>
            <div className="section-label reveal">Open source</div>
            <h2 className="section-h2 reveal reveal-delay-1" style={{ maxWidth: "400px" }}>Read every line. Audit everything.</h2>
            <p className="section-sub reveal reveal-delay-2">The crypto code uses only the Web Crypto API. Any developer should be able to read and verify it in under 15 minutes. No black boxes. No "trust us."</p>
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
                <div className="oss-stat-label">Crypto API only</div>
              </div>
              <div className="oss-stat">
                <div className="oss-stat-val">∞</div>
                <div className="oss-stat-label">Secrets stored</div>
              </div>
            </div>
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
              <div>{"  "}password: <span className="code-type">string</span>,</div>
              <div>{"  "}uid: <span className="code-type">string</span>,</div>
              <div>{"  "}salt: <span className="code-type">Uint8Array</span></div>
              <div>): <span className="code-type">Promise</span>&lt;<span className="code-type">CryptoKey</span>&gt; {"{"}</div>
              <div>{"  "}<span className="code-keyword">const</span> baseKey = <span className="code-keyword">await</span> crypto.subtle</div>
              <div>{"    "}.<span className="code-fn">importKey</span>(<span className="code-str">"raw"</span>, encode(password + uid),</div>
              <div>{"      "}<span className="code-str">"PBKDF2"</span>, <span className="code-keyword">false</span>, [<span className="code-str">"deriveKey"</span>]);</div>
              <div>{" "}</div>
              <div>{"  "}<span className="code-keyword">return</span> crypto.subtle.<span className="code-fn">deriveKey</span>({"{"}</div>
              <div>{"    "}name: <span className="code-str">"PBKDF2"</span>, salt,</div>
              <div>{"    "}iterations: <span className="code-num">310_000</span>,</div>
              <div>{"    "}hash: <span className="code-str">"SHA-256"</span>,</div>
              <div>{"  "}{"}"}, baseKey, {"{"} name: <span className="code-str">"AES-GCM"</span>,</div>
              <div>{"    "}length: <span className="code-num">256</span> {"}"}, <span className="code-keyword">false</span>,</div>
              <div>{"    "}[<span className="code-str">"encrypt"</span>, <span className="code-str">"decrypt"</span>]);</div>
              <div>{"}"}</div>
            </div>
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
            <button className="google-btn" onClick={signIn} style={{ margin: "0 auto", fontSize: "15px", padding: "15px 28px" }} >
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Continue with Google — it's free
            </button>
          </div>
          <div className="cta-note reveal reveal-delay-4">No credit card · No team plan · MIT licensed · Open source forever</div>
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
          <a href="#features">Features</a>
          <a href="#security">Security</a>
          <a href="https://github.com/hariharen9/Scync/blob/main/LICENSE" target="_blank">MIT License</a>
          <a href="https://github.com/hariharen9/Scync" target="_blank">GitHub</a>
        </div>
        <div className="footer-copy">
          <span className="copy-text">© 2026 Scync. Free forever.</span>
          <span className="footer-sep">·</span>
          <span className="creator-text">Created by <a href="https://hariharen.site" target="_blank">Hariharen</a></span>
        </div>
      </footer>
    </div>
  );
};
