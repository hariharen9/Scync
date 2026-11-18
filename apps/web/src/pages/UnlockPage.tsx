import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore, useVaultStore, useUIStore } from '@scync/ui';
import { ArrowRight, Fingerprint, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import './UnlockPage.css';

const OUTER_NODES = 12;
const INNER_NODES = 6;
const OUTER_RADIUS = 132;
const INNER_RADIUS = 78;
const MESH_CENTER = 140;

const polar = (index: number, count: number, radius: number): [number, number] => {
  const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
  return [
    MESH_CENTER + Math.cos(angle) * radius,
    MESH_CENTER + Math.sin(angle) * radius,
  ];
};

const NODE_POS: [number, number][] = [
  ...Array.from({ length: OUTER_NODES }, (_, i) => polar(i, OUTER_NODES, OUTER_RADIUS)),
  ...Array.from({ length: INNER_NODES }, (_, i) => polar(i, INNER_NODES, INNER_RADIUS)),
];

type MeshEdgeDef = { i: number; j: number; kind: 'ring' | 'spoke' };

const MESH_EDGES: MeshEdgeDef[] = (() => {
  const edges: MeshEdgeDef[] = [];

  for (let i = 0; i < OUTER_NODES; i++) {
    edges.push({ i, j: (i + 1) % OUTER_NODES, kind: 'ring' });
  }
  for (let i = 0; i < INNER_NODES; i++) {
    edges.push({ i: OUTER_NODES + i, j: OUTER_NODES + ((i + 1) % INNER_NODES), kind: 'ring' });
  }
  for (let i = 0; i < INNER_NODES; i++) {
    edges.push({ i: OUTER_NODES + i, j: (i * 2) % OUTER_NODES, kind: 'spoke' });
  }

  return edges;
})();

export const UnlockPage: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { vaultMeta, verifyPassword, verifyBiometrics, setDerivedKey, recoverVault } = useVaultStore();
  const { openConfirmModal } = useUIStore();

  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [clockStr, setClockStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Emergency Recovery Kit state
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');

  const passElRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const constellationRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const edgesLayerRef = useRef<SVGGElement>(null);
  const ubtnRef = useRef<HTMLButtonElement>(null);

  // Store node states for vanilla-js rendering
  const nodeEls = useRef<{ el: HTMLDivElement; x: number; y: number; active: boolean }[]>([]);
  const edgesRef = useRef<{
    i: number;
    j: number;
    d: number;
    drawn: boolean;
    lineEl: SVGLineElement | null;
    kind: 'ring' | 'spoke';
  }[]>([]);
  const lastNodeCount = useRef(0);

  const MSGS = [
    'Incorrect password. Try again.',
    'Still incorrect. Check caps lock.',
    'Incorrect. Without the Emergency Kit, this vault cannot be recovered.',
    'Vault remains locked.',
    'Final attempt. One more failure will sign you out.',
  ];

  // --- Lockout Countdown ---
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer(p => p - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // --- Clock ---
  useEffect(() => {
    const pad = (v: number) => String(v).padStart(2, '0');
    const tick = () => {
      const n = new Date();
      setClockStr(`${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`);
      setDateStr(n.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase());
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Canvas Animation ---
  useEffect(() => {
    if (window.matchMedia('(max-width: 900px)').matches) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0, mx = -999, my = -999;

    const resize = () => {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const handleMM = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', handleMM);

    const HEX = '0123456789abcdef';
    class Drop {
      x = 0; y = 0; vy = 0; ch = ''; a = 0; sz = 0; t = 0; ti = 0;
      constructor(init: boolean) {
        this.reset();
        if (init) this.y = Math.random() * window.innerHeight;
      }
      reset() {
        this.x = Math.random() * window.innerWidth;
        this.y = -12;
        this.vy = .14 + Math.random() * .18;
        this.ch = HEX[Math.floor(Math.random() * 16)];
        this.a = .02 + Math.random() * .035;
        this.sz = 10 + Math.random() * 1.5;
        this.t = 0;
        this.ti = 50 + Math.random() * 90;
      }
      tick() {
        this.y += this.vy; this.t++;
        if (this.t > this.ti) { this.ch = HEX[Math.floor(Math.random() * 16)]; this.t = 0; }
        if (this.y > window.innerHeight + 20) this.reset();
      }
      draw(ctx: CanvasRenderingContext2D) {
        const d = Math.hypot(this.x - mx, this.y - my);
        const b = Math.max(0, 1 - d / 170) * .22;
        ctx.globalAlpha = this.a + b;
        ctx.fillStyle = d < 170 ? '#10b981' : '#fff';
        ctx.font = `${this.sz}px DM Mono,monospace`;
        ctx.fillText(this.ch, this.x, this.y);
      }
    }

    const drops = Array.from({ length: 90 }, () => new Drop(true));
    let scanY = 0;
    let animId: number;

    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = .018;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 52) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      drops.forEach(d => { d.tick(); d.draw(ctx); });
      ctx.globalAlpha = 1;

      scanY = (scanY + .45) % H;
      const sg = ctx.createLinearGradient(0, scanY - 70, 0, scanY + 70);
      sg.addColorStop(0, 'transparent');
      sg.addColorStop(.5, 'rgba(16,185,129,.016)');
      sg.addColorStop(1, 'transparent');
      ctx.fillStyle = sg; ctx.fillRect(0, scanY - 70, W, 140);

      const vg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .72);
      vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(5,5,5,.95)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMM);
    };
  }, []);

  // --- Constellation Initialization ---
  useEffect(() => {
    if (!constellationRef.current || !svgRef.current) return;
    const constEl = constellationRef.current;

    // Create Nodes
    nodeEls.current.forEach(n => n.el.remove()); // cleanup old if re-running
    nodeEls.current = [];
    NODE_POS.forEach(([x, y], i) => {
      const el = document.createElement('div');
      el.className = `cnode ${i < OUTER_NODES ? 'cnode-outer' : 'cnode-inner'}`;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.transition = `background .25s ease ${i * 20}ms, border-color .25s ease, box-shadow .25s ease, transform .25s var(--ease)`;
      constEl.appendChild(el);
      nodeEls.current.push({ el, x, y, active: false });
    });

    // Create the structured ring/spoke edges
    edgesRef.current = MESH_EDGES.map(edge => {
      const dx = NODE_POS[edge.i][0] - NODE_POS[edge.j][0];
      const dy = NODE_POS[edge.i][1] - NODE_POS[edge.j][1];
      return { ...edge, d: Math.hypot(dx, dy), drawn: false, lineEl: null };
    });

    // Handle initial password (autofill)
    const target = nodesForLength(password.length);
    for (let i = 0; i < target; i++) activateNode(i);
    lastNodeCount.current = target;
  }, []); // Only on mount

  // --- Constellation Logic ---
  const drawEdge = useCallback((edge: typeof edgesRef.current[0], bright = false) => {
    if (edge.lineEl) {
      if (bright) edge.lineEl.classList.add('bright');
      return;
    }
    const { i, j } = edge;
    const x1 = NODE_POS[i][0], y1 = NODE_POS[i][1];
    const x2 = NODE_POS[j][0], y2 = NODE_POS[j][1];

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(x1)); line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2)); line.setAttribute('y2', String(y2));
    line.setAttribute('stroke-dasharray', String(edge.d));
    line.setAttribute('stroke-dashoffset', String(edge.d));
    line.className.baseVal = `const-line const-line-${edge.kind}`;
    edgesLayerRef.current?.appendChild(line);
    edge.lineEl = line;
    edge.drawn = true;
    requestAnimationFrame(() => line.classList.add('draw'));
    if (bright) line.classList.add('bright');
  }, []);

  const activateNode = useCallback((idx: number) => {
    const n = nodeEls.current[idx];
    if (!n || n.active) return;
    n.active = true;
    n.el.classList.add('active');

    edgesRef.current.forEach(e => {
      const other = (e.i === idx) ? e.j : (e.j === idx ? e.i : -1);
      if (other >= 0 && nodeEls.current[other].active) {
        setTimeout(() => drawEdge(e), 60);
      }
    });
  }, [drawEdge]);

  const deactivateAll = useCallback((flash = false) => {
    if (!nodeEls.current.length) return;
    nodeEls.current.forEach(n => {
      n.active = false;
      if (flash) {
        n.el.style.background = '#ef4444';
        n.el.style.boxShadow = '0 0 10px rgba(239,68,68,.6)';
        n.el.style.borderColor = '#ef4444';
        setTimeout(() => {
          n.el.style.background = '';
          n.el.style.boxShadow = '';
          n.el.style.borderColor = '';
          n.el.classList.remove('active');
        }, 500);
      } else {
        n.el.classList.remove('active');
      }
    });
    if (svgRef.current) {
      svgRef.current.querySelectorAll('line.const-line').forEach(l => l.remove());
    }
    edgesRef.current.forEach(e => { e.lineEl = null; e.drawn = false; });
  }, []);

  const nodesForLength = (len: number) => Math.min(Math.round((len / 10) * NODE_POS.length), NODE_POS.length);

  // --- Password Effect ---
  useEffect(() => {
    if (nodeEls.current.length < NODE_POS.length) return;
    const len = password.length;
    const target = nodesForLength(len);
    if (target > lastNodeCount.current) {
      for (let i = lastNodeCount.current; i < target; i++) activateNode(i);
    } else if (target < lastNodeCount.current) {
      for (let i = target; i < lastNodeCount.current; i++) {
        nodeEls.current[i].active = false;
        nodeEls.current[i].el.classList.remove('active');
      }
      if (svgRef.current) svgRef.current.querySelectorAll('line.const-line').forEach(l => l.remove());
      edgesRef.current.forEach(e => { e.lineEl = null; e.drawn = false; });
      for (let i = 0; i < target; i++) activateNode(i);
    }
    lastNodeCount.current = target;
  }, [password, activateNode]);

  // Focus effect
  useEffect(() => {
    const compact = window.matchMedia('(max-width: 900px)').matches;
    const focusTimer = compact ? null : window.setTimeout(() => passElRef.current?.focus(), 500);
    const handleKD = (e: KeyboardEvent) => {
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && document.activeElement?.tagName !== 'INPUT') {
        passElRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKD);
    return () => {
      if (focusTimer) window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKD);
    };
  }, []);

  const spawnBurst = () => {
    const avatar = document.getElementById('constAvatar');
    if (!avatar) return;
    const rect = avatar.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ['#10b981', '#34d399', '#6ee7b7', '#fff'];

    for (let i = 0; i < 32; i++) {
      const p = document.createElement('div');
      const a = (i / 32) * Math.PI * 2;
      const d = 60 + Math.random() * 110;
      const tx = Math.cos(a) * d;
      const ty = Math.sin(a) * d;
      const sz = 2 + Math.random() * 5;
      const col = colors[Math.floor(Math.random() * colors.length)];
      p.style.cssText = `
        position:fixed;left:${cx}px;top:${cy}px;z-index:60;
        width:${sz}px;height:${sz}px;
        background:${col};border-radius:${Math.random() > .5 ? '50%' : '0'};
        transform:rotate(${Math.random() * 45}deg);
        pointer-events:none;
        box-shadow:0 0 ${sz * 2}px ${col};
        animation:pBurst .7s var(--ease) ${Math.random() * .1}s both;
        --tx:${tx}px;--ty:${ty}px;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }

    for (let i = 0; i < 2; i++) {
      const r = document.createElement('div');
      r.style.cssText = `
        position:fixed;
        left:${cx - 38}px;top:${cy - 38}px;
        width:76px;height:76px;border-radius:50%;
        border:1px solid #10b981;z-index:59;pointer-events:none;
        animation:ringExpand .7s var(--ease) ${i * .18}s both;
      `;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 1000);
    }
  };

  const handleSuccessFlow = (derivedKey: CryptoKey) => {
    setIsSuccess(true);
    const unlit = nodeEls.current.map((_, i) => i).filter(i => !nodeEls.current[i].active);
    unlit.forEach((idx, i) => {
      setTimeout(() => activateNode(idx), i * 35);
    });

    setTimeout(() => {
      edgesRef.current.forEach(e => { if (e.lineEl) e.lineEl.classList.add('bright'); });
    }, unlit.length * 35 + 80);

    setTimeout(() => {
      const badge = document.getElementById('constBadge');
      if (badge) {
        badge.style.background = '#10b981';
        badge.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><rect x="3" y="11" width="18" height="11" rx="1"/><path d="M7 11V7c0-2.7 2.1-5 5-5 1.6 0 3 .7 4 1.8" stroke="#fff" stroke-width="2.5" fill="none"/></svg>`;
      }
      const vtxt = document.getElementById('vtxt');
      if (vtxt) vtxt.textContent = 'Unlocking…';
      const vtag = document.getElementById('vaultTag');
      if (vtag) vtag.style.color = '#10b981';
      const vtdot = document.getElementById('vtdot');
      if (vtdot) {
        vtdot.style.background = '#10b981';
        vtdot.style.animation = 'none';
      }
    }, unlit.length * 35 + 120);

    setTimeout(() => {
      const av = document.getElementById('constAvatar');
      if (av) {
        av.style.animation = 'avatarUnlock .7s ease forwards';
        av.style.borderColor = '#10b981';
      }
    }, unlit.length * 35 + 160);

    setTimeout(() => {
      const flash = document.getElementById('flash');
      if (flash) flash.classList.add('on');
      spawnBurst();
    }, unlit.length * 35 + 280);

    setTimeout(() => {
      nodeEls.current.forEach((n, i) => {
        const cx = 140, cy = 140;
        const nx = NODE_POS[i][0], ny = NODE_POS[i][1];
        const dx = (cx - nx) * 0.4, dy = (cy - ny) * 0.4;
        n.el.style.transition = `transform .5s var(--ease) ${i * 18}ms, opacity .4s ease ${i * 18}ms`;
        n.el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`;
        n.el.style.opacity = '0';
      });
      if (svgRef.current) {
        svgRef.current.style.transition = 'opacity .4s ease';
        svgRef.current.style.opacity = '0';
      }
    }, unlit.length * 35 + 480);

    setTimeout(() => {
      const ui = document.getElementById('userInfo');
      if (ui) { ui.style.transition = 'opacity .4s ease'; ui.style.opacity = '0'; }
      const ct = document.getElementById('controlsLayer');
      if (ct) { ct.style.transition = 'opacity .4s ease'; ct.style.opacity = '0'; }
      const av = document.getElementById('constAvatar');
      if (av) {
        av.style.transition = 'transform .5s var(--ease), box-shadow .3s ease';
        av.style.transform = 'translate(-50%,-50%) scale(1.2)';
      }
    }, unlit.length * 35 + 700);

    // After all animations finish, perform the final state transition
    setTimeout(() => {
      setDerivedKey(derivedKey);
    }, unlit.length * 35 + 1100);
  };

  const handleFailFlow = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setPassword('');
    deactivateAll(true);
    lastNodeCount.current = 0;

    if (nextAttempts >= 5) {
      setErrorText('Too many failed attempts. Signing you out to protect this vault.');
      setTimeout(() => {
        signOut();
      }, 4000);
      return;
    }

    if (nextAttempts === 3) {
      setLockoutTimer(60);
      setErrorText('Security lockout: wait 60 seconds before trying again.');
    } else {
      setErrorText(MSGS[Math.min(nextAttempts - 1, MSGS.length - 1)]);
    }

    passElRef.current?.focus();
  };

  const doUnlock = async () => {
    if (!password || !user || loading || isSuccess || lockoutTimer > 0) return;
    setLoading(true);
    setErrorText('');

    try {
      const key = await verifyPassword(password, user.uid);
      if (key) {
        handleSuccessFlow(key);
      } else {
        handleFailFlow();
      }
    } catch {
      handleFailFlow();
    } finally {
      if (!isSuccess) {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doUnlock();
    }
  };

  const doBio = async () => {
    if (!user || biometricLoading || loading || isSuccess || lockoutTimer > 0) return;
    setBiometricLoading(true);
    setErrorText('');
    try {
      const key = await verifyBiometrics(user.uid);
      if (key) {
        handleSuccessFlow(key);
      } else {
        handleFailFlow();
      }
    } catch {
      handleFailFlow();
    } finally {
      if (!isSuccess) {
        setBiometricLoading(false);
      }
    }
  };

  const handleRecovery = async () => {
    if (!recoveryKey.trim() || !user || recoveryLoading || isSuccess) return;
    setRecoveryLoading(true);
    setRecoveryError('');

    try {
      const res = await recoverVault(user.uid, recoveryKey.trim());
      if (res && res.derivedKey) {
        handleSuccessFlow(res.derivedKey);
      } else {
        setRecoveryError('Invalid recovery key or corrupted recovery record.');
      }
    } catch (err) {
      setRecoveryError(err instanceof Error ? err.message : 'Failed to recover vault.');
    } finally {
      if (!isSuccess) {
        setRecoveryLoading(false);
      }
    }
  };

  const handleSignOut = () => {
    openConfirmModal({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of Scync? Your vault will be locked.',
      confirmText: 'Sign Out',
      danger: false,
      onConfirm: async () => {
        signOut();
      }
    });
  };

  // UI helpers
  const passPct = Math.min(password.length / 20, 1);
  const pbarBg = password.length < 5 ? 'rgba(255,255,255,.08)' : password.length < 12 ? '#10b981' : '#34d399';
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const firstName = displayName.split(/\s+/)[0] || 'there';
  const userEmail = user?.email || '';

  return (
    <div className="unlock-page-root" data-lenis-prevent>
      <canvas ref={canvasRef} className="bgCanvas" />
      <div className="unlock-noise" aria-hidden="true" />
      <div className={`flash ${isSuccess ? 'on' : ''}`} id="flash" />

      <header className="unlock-topbar">
        <a className="unlock-brand" href="/" aria-label="Scync home">
          <span className="unlock-brand-mark">
            <img src="/logo.png" alt="" />
          </span>
          <span className="unlock-brand-word">SCYNC</span>
        </a>

        <div className="unlock-topbar-meta">
          <span className={`unlock-session ${isSuccess ? 'is-open' : ''}`}>
            <span className="unlock-session-dot" />
            {isSuccess ? 'Vault unlocked' : 'Session locked'}
          </span>
          <div className="unlock-clock">
            <span className="unlock-clock-time">{clockStr || '00:00:00'}</span>
            <span className="unlock-clock-date">{dateStr || '---'}</span>
          </div>
        </div>
      </header>

      <main className="unlock-split">
        <section className="unlock-form-panel" aria-labelledby="unlock-title">
          <div className="unlock-form-wrap">
            <div className="unlock-form-kicker">
              <span>//</span>
              <Lock size={11} />
              Vault access
            </div>

            <h1 className="unlock-form-title" id="unlock-title">
              {isSuccess ? 'Vault unlocked.' : 'Unlock your vault.'}
            </h1>
            <p className="unlock-form-lede">
              {isSuccess
                ? 'Opening your encrypted workspace…'
                : `Welcome back, ${firstName}. Use your master password or biometrics.`}
            </p>

            <div className="controls" id="controlsLayer">
              {isRecovering ? (
                <div className="unlock-recovery">
                  <div className="unlock-recovery-label">
                    <ShieldCheck size={13} />
                    Emergency Recovery Kit
                  </div>

                  <div className={`unlock-recovery-field ${recoveryError ? 'has-error' : ''}`}>
                    <input
                      type="text"
                      placeholder="SCYNC-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                      value={recoveryKey}
                      onChange={e => {
                        setRecoveryKey(e.target.value.toUpperCase());
                        setRecoveryError('');
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRecovery();
                        }
                      }}
                      disabled={recoveryLoading || isSuccess}
                      spellCheck={false}
                      autoFocus
                      aria-label="Emergency recovery kit key"
                      autoComplete="off"
                    />
                  </div>

                  {recoveryError && (
                    <div className="unlock-error" role="alert">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{recoveryError}</span>
                    </div>
                  )}

                  <button
                    className={`ubtn ${recoveryLoading ? 'loading' : ''} ${isSuccess ? 'ok' : ''}`}
                    disabled={!recoveryKey.trim() || recoveryLoading || isSuccess}
                    onClick={handleRecovery}
                    type="button"
                  >
                    {isSuccess ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Vault recovered</span>
                      </>
                    ) : (
                      <>
                        <span className="btxt">{recoveryLoading ? 'Decrypting recovery key…' : 'Recover vault'}</span>
                        <div className="spin" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="unlock-recovery-back"
                    onClick={() => {
                      setIsRecovering(false);
                      setRecoveryError('');
                      setRecoveryKey('');
                    }}
                  >
                    ← Return to password unlock
                  </button>
                </div>
              ) : (
                <>
                  <div className="unlock-field">
                    <div className="unlock-label-row">
                      <label className="unlock-label" htmlFor="vault-password">Master password</label>
                      <span className="unlock-hint">Decrypted locally</span>
                    </div>

                    <div className={`pf ${errorText ? 'error' : ''} ${isSuccess ? 'ok' : ''}`} onClick={() => passElRef.current?.focus()}>
                      <div className="pf-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="1" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>

                      <div className="pf-dots">
                        {password.length === 0 && <span className="ph">Enter vault password</span>}
                        {!revealed && password.split('').map((_, i) => (
                          <div key={i} className={`pd ${i === password.length - 1 ? 'last' : ''}`} />
                        ))}
                        {revealed && password.length > 0 && (
                          <span className="rtxt">{password}</span>
                        )}
                      </div>

                      <input
                        id="vault-password"
                        ref={passElRef}
                        type={revealed ? 'text' : 'password'}
                        className="pf-real"
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          setErrorText('');
                        }}
                        onKeyDown={handleKeyDown}
                        autoComplete="current-password"
                        spellCheck={false}
                        aria-label="Vault master password"
                      />

                      <button
                        className="pf-eye"
                        type="button"
                        tabIndex={-1}
                        onClick={e => {
                          e.stopPropagation();
                          setRevealed(!revealed);
                        }}
                        aria-label={revealed ? 'Hide password' : 'Show password'}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {revealed ? (
                            <>
                              <line x1="1" y1="1" x2="23" y2="23" />
                              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 0 1-4.24-4.24" />
                              <path d="M6.51 6.51A10 10 0 0 0 1 12s4 8 11 8c2.12 0 4.09-.62 5.73-1.66" />
                            </>
                          ) : (
                            <>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="pbar">
                    <div className="pbar-inner" style={{ width: `${passPct * 100}%`, background: pbarBg }} />
                  </div>

                  <div className={`err ${errorText ? 'show' : ''}`} role="alert" aria-live="polite">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errorText}</span>
                  </div>

                  <div className={`pips ${attempts > 0 ? 'show' : ''}`}>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`pip ${i < attempts ? 'used' : ''}`} />
                    ))}
                  </div>

                  <button
                    ref={ubtnRef}
                    className={`ubtn ${loading ? 'loading' : ''} ${isSuccess ? 'ok' : ''}`}
                    disabled={password.length === 0 || loading || isSuccess || lockoutTimer > 0}
                    onClick={doUnlock}
                    type="button"
                  >
                    {isSuccess ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Vault unlocked</span>
                      </>
                    ) : (
                      <>
                        <span className="btxt">{lockoutTimer > 0 ? `Locked (${lockoutTimer}s)` : 'Unlock vault'}</span>
                        {lockoutTimer === 0 && <ArrowRight className="bico" size={15} />}
                        <div className="spin" />
                      </>
                    )}
                  </button>

                  {vaultMeta?.biometrics && vaultMeta.biometrics.length > 0 && (
                    <>
                      <div className="or">
                        <div className="or-l" />
                        <div className="or-t">or</div>
                        <div className="or-l" />
                      </div>
                      <button
                        className={`bbtn ${biometricLoading ? 'scanning' : ''}`}
                        onClick={doBio}
                        disabled={biometricLoading || loading || isSuccess || lockoutTimer > 0}
                        type="button"
                      >
                        <div className="fp">
                          <div className="fp-scan-line" />
                          <Fingerprint size={22} strokeWidth={1.6} />
                        </div>
                        <span className="btxt-b">Use biometrics</span>
                        <div className="bspin" />
                      </button>
                    </>
                  )}

                  {vaultMeta?.recovery ? (
                    <button
                      type="button"
                      className="unlock-recovery-link"
                      onClick={() => {
                        setIsRecovering(true);
                        setErrorText('');
                        setRecoveryError('');
                      }}
                    >
                      Forgot master password? <span>Recover with Emergency Kit</span>
                    </button>
                  ) : (
                    <div className="zk">
                      Zero-knowledge vault. Lost passwords <b>cannot</b> be recovered.
                    </div>
                  )}
                </>
              )}

              <div className="unlock-form-footer">
                <button className="so" onClick={handleSignOut} type="button">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
                <span className="unlock-form-footnote">Your key never leaves this device</span>
              </div>
            </div>
          </div>
        </section>

        <section className="unlock-identity" aria-label="Vault identity">
          <div className="unlock-identity-bg" aria-hidden="true" />
          <div className="unlock-identity-inner">
            <div className="unlock-kicker">
              <span>//</span>
              Vault identity
            </div>
            <h2 className="unlock-headline">
              Sealed <span>by design.</span>
            </h2>

            <div className="unlock-constellation-wrap">
              <div className="constellation" ref={constellationRef}>
                <svg className="const-svg" ref={svgRef} viewBox="0 0 280 280" aria-hidden="true">
                  <circle className="mesh-ring mesh-ring-outer" cx="140" cy="140" r="132" />
                  <circle className="mesh-ring mesh-ring-dashed" cx="140" cy="140" r="105" />
                  <circle className="mesh-ring mesh-ring-inner" cx="140" cy="140" r="78" />
                  <circle className="mesh-ring mesh-ring-core" cx="140" cy="140" r="52" />
                  {MESH_EDGES.map((edge, i) => (
                    <line
                      key={`${edge.kind}-${i}`}
                      className={`mesh-edge mesh-edge-${edge.kind}`}
                      x1={NODE_POS[edge.i][0]}
                      y1={NODE_POS[edge.i][1]}
                      x2={NODE_POS[edge.j][0]}
                      y2={NODE_POS[edge.j][1]}
                    />
                  ))}
                  <g ref={edgesLayerRef} />
                </svg>
                <div className="const-glow" />

                <div className="const-avatar" id="constAvatar">
                  <UserAvatar user={user} />
                </div>
                <div className="const-badge" id="constBadge">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#060606">
                    <rect x="3" y="11" width="18" height="11" rx="1" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#060606" strokeWidth="2.5" fill="none" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="user-info" id="userInfo">
              <div className="user-name">{displayName}</div>
              {userEmail && userEmail !== displayName && <div className="user-email">{userEmail}</div>}
              <div className="vault-tag" id="vaultTag" role="status" aria-live="polite">
                <div className="vtdot" id="vtdot" />
                <span id="vtxt">Vault is locked</span>
              </div>
            </div>

            <p className="unlock-brief">
              Your master password decrypts this vault inside your browser. It is never sent,
              stored, or recoverable by Scync.
            </p>

            <div className="unlock-facts">
              <div><ShieldCheck size={13} /><span>Local decryption</span></div>
              <div><Fingerprint size={13} /><span>Biometrics optional</span></div>
              <div><KeyRound size={13} /><span>Emergency kit recovery</span></div>
            </div>

            <div className="unlock-trust">
              <div className="fi">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                AES-256-GCM
              </div>
              <div className="fsep" />
              <div className="fi">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                </svg>
                Zero-knowledge
              </div>
              <div className="fsep" />
              <div className="fi">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="1" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                PBKDF2 · 310k
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
