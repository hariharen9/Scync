/**
 * OrbLogomark — the Neon Lattice Orb logo with a live WebGL variant.
 *
 * Renders the static /logo.png by default and, on hover, cross-fades to
 * a live 3D spin of the same orb (see scync-orb.html at the repo root
 * for the original prototype). Used by the landing navbar and the vault
 * app sidebar.
 *
 * three.js is loaded lazily from CDN on first hover; the whole feature
 * degrades gracefully to the static logo when WebGL is unavailable, the
 * CDN is unreachable, or the user prefers reduced motion.
 */
import React, { useEffect, useRef } from 'react';
import { createOrbLogo, type OrbHandle } from './orbLogo';

const ORB_CSS = `
.scync-orb-host canvas {
  position: absolute; inset: 0;
  width: 100% !important; height: 100% !important;
  opacity: 0;
  transition: opacity 250ms ease;
  z-index: 2;
  pointer-events: none;
}
.scync-orb-host .scync-orb-fallback {
  transition: opacity 250ms ease;
  z-index: 1;
}
.scync-orb-host.orb-live .scync-orb-fallback { opacity: 0; }
.scync-orb-host.orb-live canvas { opacity: 1; }
`;

let styleInjected = false;
function injectStyles() {
  if (styleInjected) return;
  const el = document.createElement('style');
  el.textContent = ORB_CSS;
  document.head.appendChild(el);
  styleInjected = true;
}

export interface OrbLogomarkProps {
  /** Box size in px (logo box and canvas). */
  size?: number;
  /** Static image size relative to the box, 0..1. */
  imgScale?: number;
  /** Extra classes on the host box (e.g. "nav-logomark"). */
  className?: string;
  /** Inline styles for the host box. */
  style?: React.CSSProperties;
}

export function OrbLogomark({ size = 28, imgScale = 0.8, className, style }: OrbLogomarkProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!('WebGLRenderingContext' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    injectStyles();
    let handle: OrbHandle | null = null;
    const enter = () => {
      if (!handle) handle = createOrbLogo(host, size, Math.min(imgScale, 0.95));
      handle.activate();
    };
    const leave = () => handle?.deactivate();
    host.addEventListener('pointerenter', enter);
    host.addEventListener('pointerleave', leave);
    host.addEventListener('pointercancel', leave);
    return () => {
      host.removeEventListener('pointerenter', enter);
      host.removeEventListener('pointerleave', leave);
      host.removeEventListener('pointercancel', leave);
      handle?.dispose();
      handle = null;
    };
  }, [size, imgScale]);

  return (
    <div
      ref={hostRef}
      className={className ? `scync-orb-host ${className}` : 'scync-orb-host'}
      style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center', flexShrink: 0, ...style }}
    >
      <img
        src="/logo.png"
        alt="Scync"
        className="scync-orb-fallback"
        style={{ width: size * imgScale, height: size * imgScale, objectFit: 'contain' }}
      />
    </div>
  );
}
