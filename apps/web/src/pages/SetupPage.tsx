import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore, useVaultStore } from '@scync/ui';
import { FiShield, FiLock, FiCheck, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import './SetupPage.css';

export const SetupPage: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { initializeVault } = useVaultStore();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmedOnce, setConfirmedOnce] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const constellationRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const passElRef = useRef<HTMLInputElement>(null);

  const nodeEls = useRef<{ el: HTMLDivElement; x: number; y: number; active: boolean }[]>([]);
  const edgesRef = useRef<{ i: number; j: number; d: number; drawn: boolean; lineEl: SVGLineElement | null }[]>([]);
  const lastCount = useRef(0);

  const NODE_POS = [
    [58, 42], [140, 20], [222, 38], [260, 110], [252, 190],
    [195, 252], [120, 265], [48, 248], [18, 168], [22, 82],
    [88, 88], [200, 96], [210, 200], [78, 205],
  ];

  const N = NODE_POS.length;
  const RING_CIRC = 2 * Math.PI * 140;
  const RING_COLORS: Record<string, string> = { w: '#ef4444', f: '#f59e0b', g: '#60a5fa', s: '#10b981' };
  const STRENGTH_LABELS: Record<string, string> = { w: 'Weak', f: 'Fair', g: 'Good', s: 'Strong' };

  // --- Strength Logic ---
  const calcStrength = (v: string) => {
    if (!v) return { score: 0, key: '' };
    let s = 0;
    if (v.length >= 8) s++;
    if (v.length >= 14) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    if (s <= 1) return { score: s, key: 'w' };
    if (s === 2) return { score: s, key: 'f' };
    if (s === 3) return { score: s, key: 'g' };
    return { score: s, key: 's' };
  };

  const { score, key } = calcStrength(password);
  const isMatch = password && confirm && password === confirm;
  const isMismatch = confirmedOnce && confirm && password !== confirm;

  // --- Canvas Animation ---
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0, mx = -999, my = -999;
    const resize = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const handleMM = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', handleMM);

    const HEX = '0123456789abcdef';
    class Drop {
      x = 0; y = 0; vy = 0; ch = ''; a = 0; sz = 0; t = 0; ti = 0;
      constructor(init: boolean) { this.reset(); if (init) this.y = Math.random() * window.innerHeight; }
      reset() { this.x = Math.random() * window.innerWidth; this.y = -12; this.vy = .14 + Math.random() * .18; this.ch = HEX[Math.floor(Math.random() * 16)]; this.a = .02 + Math.random() * .035; this.sz = 10 + Math.random() * 1.5; this.t = 0; this.ti = 50 + Math.random() * 90; }
      tick() { this.y += this.vy; this.t++; if (this.t > this.ti) { this.ch = HEX[Math.floor(Math.random() * 16)]; this.t = 0; } if (this.y > window.innerHeight + 20) this.reset(); }
      draw(ctx: CanvasRenderingContext2D) {
        const d = Math.hypot(this.x - mx, this.y - my), b = Math.max(0, 1 - d / 170) * .22;
        ctx.globalAlpha = this.a + b; ctx.fillStyle = d < 170 ? '#10b981' : '#fff'; ctx.font = `${this.sz}px DM Mono,monospace`; ctx.fillText(this.ch, this.x, this.y);
      }
    }
    const drops = Array.from({ length: 90 }, () => new Drop(true));
    let scanY = 0, animId: number;
    const loop = () => {
      ctx.clearRect(0, 0, W, H); ctx.globalAlpha = .018; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 52) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      drops.forEach(d => { d.tick(); d.draw(ctx); });
      ctx.globalAlpha = 1; scanY = (scanY + .45) % H;
      const sg = ctx.createLinearGradient(0, scanY - 70, 0, scanY + 70); sg.addColorStop(0, 'transparent'); sg.addColorStop(.5, 'rgba(16,185,129,.016)'); sg.addColorStop(1, 'transparent');
      ctx.fillStyle = sg; ctx.fillRect(0, scanY - 70, W, 140);
      const vg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .72); vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(5,5,5,.95)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', handleMM); };
  }, []);

  // --- Constellation Optimization ---
  const drawEdge = useCallback((edge: typeof edgesRef.current[0], cls = '') => {
    if (edge.lineEl) {
      if (cls) edge.lineEl.className.baseVal = 'const-line draw ' + cls;
      return;
    }
    const { i, j } = edge;
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', String(NODE_POS[i][0])); l.setAttribute('y1', String(NODE_POS[i][1]));
    l.setAttribute('x2', String(NODE_POS[j][0])); l.setAttribute('y2', String(NODE_POS[j][1]));
    l.setAttribute('stroke-dasharray', String(edge.d)); l.setAttribute('stroke-dashoffset', String(edge.d));
    l.className.baseVal = 'const-line';
    svgRef.current?.appendChild(l); edge.lineEl = l; edge.drawn = true;
    requestAnimationFrame(() => l.classList.add('draw', cls));
  }, []);

  const activateNode = useCallback((idx: number, cls = '') => {
    const n = nodeEls.current[idx];
    if (!n || n.active) return;
    n.active = true;
    n.el.className = 'cnode active' + (cls ? ' ' + cls : '');
    edgesRef.current.forEach(e => {
      const other = e.i === idx ? e.j : e.j === idx ? e.i : -1;
      if (other >= 0 && nodeEls.current[other].active) setTimeout(() => drawEdge(e, cls), 60);
    });
  }, [drawEdge]);

  // --- Initialization ---
  useEffect(() => {
    if (!constellationRef.current || !svgRef.current) return;
    const constEl = constellationRef.current;
    nodeEls.current.forEach(n => n.el.remove());
    nodeEls.current = [];
    NODE_POS.forEach(([x, y]) => {
      const el = document.createElement('div');
      el.className = 'cnode'; el.style.left = x + 'px'; el.style.top = y + 'px';
      constEl.appendChild(el);
      nodeEls.current.push({ el, x, y, active: false });
    });
    // Create Edges array
    edgesRef.current = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const d = Math.hypot(NODE_POS[i][0] - NODE_POS[j][0], NODE_POS[i][1] - NODE_POS[j][1]);
        if (d < 135) edgesRef.current.push({ i, j, d, drawn: false, lineEl: null });
      }
    }
  }, []);

  // --- Animation Effects ---
  const flashMismatch = useCallback(() => {
    nodeEls.current.forEach(n => {
      if (!n.active) return;
      n.el.classList.add('mismatch-flash');
      setTimeout(() => n.el.classList.remove('mismatch-flash'), 500);
    });
    edgesRef.current.forEach(e => {
      if (e.lineEl) { e.lineEl.classList.add('mismatch'); setTimeout(() => e.lineEl?.classList.remove('mismatch'), 500); }
    });
  }, []);

  const nodesForLen = (len: number) => Math.min(Math.round((len / 20) * N), N);

  useEffect(() => {
    if (nodeEls.current.length < N) return;
    const target = nodesForLen(password.length);
    if (target > lastCount.current) {
      for (let i = lastCount.current; i < target; i++) activateNode(i);
    } else if (target < lastCount.current) {
      for (let i = target; i < lastCount.current; i++) {
        nodeEls.current[i].active = false;
        nodeEls.current[i].el.className = 'cnode';
      }
      if (svgRef.current) svgRef.current.querySelectorAll('line').forEach(l => l.remove());
      edgesRef.current.forEach(e => { e.lineEl = null; e.drawn = false; });
      for (let i = 0; i < target; i++) activateNode(i);
    }
    lastCount.current = target;
  }, [password, activateNode]);

  useEffect(() => {
    if (isMatch) {
      const unlit = nodeEls.current.map((_, i) => i).filter(i => !nodeEls.current[i].active);
      unlit.forEach((idx, i) => setTimeout(() => activateNode(idx, 'confirmed'), i * 25));
      setTimeout(() => {
        edgesRef.current.forEach(e => { if (e.lineEl) e.lineEl.classList.add('confirm'); });
        nodeEls.current.forEach(n => n.el.classList.add('confirmed'));
      }, unlit.length * 25 + 100);
    } else {
      nodeEls.current.forEach(n => n.el.classList.remove('confirmed'));
      edgesRef.current.forEach(e => { if (e.lineEl) e.lineEl.classList.remove('confirm', 'mismatch'); });
      if (isMismatch) flashMismatch();
    }
  }, [isMatch, isMismatch, activateNode, flashMismatch]);

  // --- Form Logic ---
  const spawnBurst = (cx: number, cy: number) => {
    const colors = ['#10b981', '#34d399', '#6ee7b7', '#fff'];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('div');
      const a = (i / 28) * Math.PI * 2, d = 50 + Math.random() * 100;
      const sz = 2 + Math.random() * 5, col = colors[Math.floor(Math.random() * colors.length)];
      p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;z-index:60;width:${sz}px;height:${sz}px;background:${col};border-radius:${Math.random() > .5 ? '50%' : '0'};pointer-events:none;box-shadow:0 0 ${sz * 2}px ${col};animation:pBurst .7s var(--ease) ${Math.random() * .1}s both;--tx:${Math.cos(a) * d}px;--ty:${Math.sin(a) * d}px`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
    for (let i = 0; i < 2; i++) {
      const r = document.createElement('div');
      r.style.cssText = `position:fixed;left:${cx - 38}px;top:${cy - 38}px;width:76px;height:76px;border-radius:50%;border:1px solid #10b981;z-index:59;pointer-events:none;animation:ringExpand .7s var(--ease) ${i * .2}s both`;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 1000);
    }
  };

  const doCreate = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      await initializeVault(password, user.uid);
      setIsSuccess(true);
      const r = document.getElementById('constAvatar')?.getBoundingClientRect();
      if (r) spawnBurst(r.left + r.width / 2, r.top + r.height / 2);

      // Final transitions
      setTimeout(() => {
        nodeEls.current.forEach((n, i) => {
          const cx = 140, cy = 140, nx = NODE_POS[i][0], ny = NODE_POS[i][1];
          const dx = (cx - nx) * .45, dy = (cy - ny) * .45;
          n.el.style.transition = `transform .5s var(--ease) ${i * 16}ms,opacity .4s ease ${i * 16}ms`;
          n.el.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(0)`;
          n.el.style.opacity = '0';
        });
        if (svgRef.current) svgRef.current.style.opacity = '0';
      }, 350);
    } catch (err) {
      setLoading(false);
    }
  };

  const allRequirementsMet = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && isMatch;

  return (
    <div className="setup-page-root">
      <canvas ref={canvasRef} className="bgCanvas" />

      <a href="/" className="logo">
        <div className="logo-box">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" stroke="#555" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="2" fill="#10b981" />
          </svg>
        </div>
        Scync
      </a>

      <div className="steps">
        <div className="step done">
          <div className="step-num"><FiCheck size={9} strokeWidth={3} /></div>
          <span>Sign in</span>
        </div>
        <div className="step-div" />
        <div className="step active">
          <div className="step-num">2</div>
          <span>Vault password</span>
        </div>
        <div className="step-div" />
        <div className="step">
          <div className="step-num">3</div>
          <span>Done</span>
        </div>
      </div>

      <div className="page" id="page">
        {/* Constellation */}
        <div className="constellation" ref={constellationRef}>
          <svg className="const-svg" ref={svgRef} viewBox="0 0 280 280">
            <circle
              className="strength-ring"
              cx="140"
              cy="140"
              r="140"
              stroke={password ? (RING_COLORS[key] || '#333') : 'transparent'}
              strokeDashoffset={RING_CIRC * (1 - Math.min(score / 5, 1) * 0.9)}
              transform="rotate(-90 140 140)"
            />
          </svg>

          <div className={`strength-label ${password ? 'show' : ''}`} style={{ color: RING_COLORS[key] }}>
            {STRENGTH_LABELS[key]}
          </div>
          <div className="const-glow" style={{ opacity: isSuccess ? 0 : 1 }} />

          <div className="const-avatar" id="constAvatar" style={{ borderColor: isSuccess ? 'var(--green)' : '' }}>
            {isSuccess ? (
              <FiShield size={28} color="var(--green)" />
            ) : (
              <img src="/logo.png" alt="Scync Logo" style={{ width: '140%', height: '140%', objectFit: 'contain' }} />
            )}
          </div>
        </div>

        {/* Header */}
        <div className="header-info" style={{ opacity: isSuccess ? 0 : 1 }}>
          <div className="header-title">Create your vault password</div>
          <div className="header-sub">This is the only key. It never leaves your device.</div>
        </div>

        {/* Controls */}
        <div className="controls" style={{ opacity: isSuccess ? 0 : 1 }}>
          <div className={`pf ${password ? 'has-val' : ''}`} onClick={() => passElRef.current?.focus()}>
            <div className="pf-icon">
              <FiLock size={13} strokeWidth={2} />
            </div>
            <div className="pf-dots">
              {!password && <span className="ph">New vault password</span>}
              {!revealed && password.split('').map((_, i) => (
                <div key={i} className={`pd ${i === password.length - 1 ? 'last' : ''}`} />
              ))}
              {revealed && password && <span className="rtxt">{password}</span>}
            </div>
            <input
              ref={passElRef}
              type={revealed ? "text" : "password"}
              className="pf-real"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              spellCheck={false}
              autoFocus
            />
            <button className="pf-eye" onClick={(e) => { e.stopPropagation(); setRevealed(!revealed); }} tabIndex={-1}>
              {revealed ? <FiEyeOff size={13} /> : <FiEye size={13} />}
            </button>
          </div>

          {/* Strength Bar Row */}
          <div className="strength-row" style={{ opacity: password ? 1 : 0 }}>
            <div className="strength-bars">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`sbar ${i <= score ? key : ''}`} />
              ))}
            </div>
            <div className={`strength-txt ${key}`}>{STRENGTH_LABELS[key]}</div>
          </div>

          {/* Requirements */}
          <div className="reqs">
            <div className={`req ${password.length >= 8 ? 'met' : ''}`}>
              <div className="req-dot" /> 8+ characters
            </div>
            <div className={`req ${/[A-Z]/.test(password) ? 'met' : ''}`}>
              <div className="req-dot" /> Uppercase letter
            </div>
            <div className={`req ${/[0-9]/.test(password) ? 'met' : ''}`}>
              <div className="req-dot" /> Number
            </div>
            <div className={`req ${/[^A-Za-z0-9]/.test(password) ? 'met' : ''}`}>
              <div className="req-dot" /> Symbol
            </div>
          </div>

          {/* Confirm Field */}
          <div className={`pf ${isMatch ? 'match' : isMismatch ? 'mismatch' : ''}`} style={{ marginTop: 4 }} onClick={() => document.getElementById('p2')?.focus()}>
            <div className="pf-icon">
              <FiCheck size={13} strokeWidth={2.5} />
            </div>
            <div className="pf-dots">
              {!confirm && <span className="ph">Confirm vault password</span>}
              {confirm.split('').map((_, i) => (
                <div key={i} className={`pd ${i === confirm.length - 1 ? 'last' : ''} ${isMatch ? 'match-col' : ''}`} />
              ))}
            </div>
            <input
              id="p2"
              type="password"
              className="pf-real"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setConfirmedOnce(true); }}
              autoComplete="new-password"
              spellCheck={false}
            />
            <div className={`pf-status ${confirm ? 'show' : ''}`}>
              {isMatch && <FiCheck size={13} strokeWidth={2.5} color="var(--green)" />}
              {isMismatch && <div style={{ color: 'var(--red)', fontSize: 13, fontWeight: 800 }}>×</div>}
            </div>
          </div>

          <div className={`confirm-status ${isMatch || isMismatch ? 'show' : ''} ${isMatch ? 'ok' : 'bad'}`}>
            {isMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
          </div>

          <button className={`cbtn ${allRequirementsMet ? 'ready' : ''} ${loading ? 'loading' : ''} ${isSuccess ? 'done' : ''}`} onClick={doCreate} disabled={!allRequirementsMet || loading}>
            {isSuccess ? (
              <><FiCheck size={14} strokeWidth={2.5} /><span>Vault Created</span></>
            ) : (
              <>
                <FiShield className="bico" size={13} strokeWidth={2.5} />
                <span className="btxt">Create Vault</span>
                <div className="spin" />
              </>
            )}
          </button>

          <div className="zk">
            <b>There is no password recovery.</b> Write it down somewhere safe.<br />
            <a onClick={signOut}>← Back to sign in</a>
          </div>
        </div>
      </div>

      <div className="foot">
        <div className="fi"><FiShield size={10} />AES-256-GCM</div>
        <div className="fsep" />
        <div className="fi"><FiAlertCircle size={10} />Zero-knowledge</div>
        <div className="fsep" />
        <div className="fi"><FiLock size={10} />PBKDF2 · 310k</div>
      </div>
    </div>
  );
};
