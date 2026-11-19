/**
 * OrbLogomark — a live WebGL recreation of the Neon Lattice Orb logo
 * (see scync-orb.html at the repo root), mounted inside the small nav
 * logomark box and spun on hover.
 *
 * three.js is loaded lazily from CDN on first hover so the landing page
 * bundle stays unchanged. The scene is built once and reused across
 * hovers; the render loop only runs while the logo is hovered.
 */

export interface OrbHandle {
  activate(): void;
  deactivate(): void;
  dispose(): void;
}

let threePromise: Promise<unknown> | null = null;

function loadThree(): Promise<unknown> {
  const w = window as unknown as { THREE?: unknown };
  if (w.THREE) return Promise.resolve(w.THREE);
  if (!threePromise) {
    threePromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.async = true;
      s.onload = () => {
        if (w.THREE) resolve(w.THREE);
        else { threePromise = null; reject(new Error('three.js loaded but global missing')); }
      };
      s.onerror = () => { threePromise = null; reject(new Error('failed to load three.js from CDN')); };
      document.head.appendChild(s);
    });
  }
  return threePromise;
}

export function createOrbLogo(host: HTMLElement, size: number, fit = 0.68): OrbHandle {
  // fit = fraction of the box the orb should occupy; matches the static
  // logo's apparent size so the cross-fade doesn't change the silhouette
  const wrap = document.createElement('div');
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  host.appendChild(wrap);

  let disposed = false;
  let ready = false;
  let raf = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let THREE: any;

  function frame() {
    raf = 0;
    if (disposed || !ready) return;
    state.group.rotation.y += 0.011;
    state.group.rotation.x += (0.15 - state.group.rotation.x) * 0.04;
    state.renderer.render(state.scene, state.cam);
    raf = requestAnimationFrame(frame);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state: { renderer?: any; scene?: any; cam?: any; group?: any } = {};

  function activate() {
    if (disposed) return;
    void loadThree().then((mod) => {
      if (disposed) return;
      if (!ready) {
        THREE = mod;
        build();
        ready = true;
      }
      host.classList.add('orb-live');
      if (!raf) raf = requestAnimationFrame(frame);
    }).catch(() => {
      // CDN unreachable — silently keep the static logo
    });
  }

  function deactivate() {
    host.classList.remove('orb-live');
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  function dispose() {
    disposed = true;
    deactivate();
    if (ready && THREE) {
      const r = state.renderer as { dispose(): void; forceContextLoss?(): void } | undefined;
      if (r) {
        r.dispose();
        r.forceContextLoss?.();
      }
    }
    wrap.remove();
  }

  function build(): void {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    // orb radius ~1.15 world units; place the camera so it fills `fit` of the frame
    cam.position.z = 1.15 / (Math.tan(THREE.MathUtils.degToRad(35 / 2)) * fit);

    // seeded random so the shape is always the same
    let seed = 11;
    function rnd(): number { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

    // base shape: icosphere, vertices jittered for an organic faceted look
    const base = new THREE.IcosahedronGeometry(1, 1);
    const pa = base.attributes.position;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const verts: any[] = [], map: Record<string, number> = {}, tris: number[] = [];
    for (let i = 0; i < pa.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pa, i);
      const k = [v.x, v.y, v.z].map((n) => Math.round(n * 1000)).join();
      if (!(k in map)) { map[k] = verts.length; verts.push(v); }
      tris.push(map[k]);
    }
    verts.forEach((v) => {
      v.normalize()
        .add(new THREE.Vector3(rnd() - .5, rnd() - .5, rnd() - .5).multiplyScalar(0.24))
        .normalize()
        .multiplyScalar(1 + (rnd() - .5) * 0.12);
    });

    const group = new THREE.Group();
    scene.add(group);

    // dark faceted core
    const coreR = verts.map(() => 0.85 + rnd() * 0.12);
    const pos: number[] = [];
    for (let t = 0; t < tris.length; t++) {
      const p = verts[tris[t]].clone().multiplyScalar(coreR[tris[t]]);
      pos.push(p.x, p.y, p.z);
    }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    cg.computeVertexNormals();
    group.add(new THREE.Mesh(cg, new THREE.MeshStandardMaterial({
      color: 0x2b2e4a, metalness: 0.55, roughness: 0.38, flatShading: true,
    })));

    // metallic edges
    const edges: Record<string, number> = {};
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0xcfcbe6, metalness: 0.8, roughness: 0.25 });
    const up = new THREE.Vector3(0, 1, 0);
    for (let t = 0; t < tris.length; t += 3) {
      for (let e = 0; e < 3; e++) {
        const a = tris[t + e], b = tris[t + (e + 1) % 3];
        const key = Math.min(a, b) + '-' + Math.max(a, b);
        if (edges[key]) continue;
        edges[key] = 1;
        const A = verts[a], B = verts[b];
        const dir = new THREE.Vector3().subVectors(B, A);
        const len = dir.length();
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1, 6), tubeMat);
        tube.position.copy(A).add(B).multiplyScalar(0.5);
        tube.quaternion.setFromUnitVectors(up, dir.normalize());
        tube.scale.y = len;
        group.add(tube);
      }
    }

    // glowing nodes
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const cx = c.getContext('2d')!;
    const gr = cx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(190,120,255,0.9)');
    gr.addColorStop(0.3, 'rgba(140,60,255,0.4)');
    gr.addColorStop(0.65, 'rgba(130,50,255,0.1)');
    gr.addColorStop(1, 'rgba(120,40,255,0)');
    cx.fillStyle = gr; cx.fillRect(0, 0, 256, 256);
    const glowTex = new THREE.CanvasTexture(c);
    glowTex.anisotropy = 4;
    const nodeGeo = new THREE.SphereGeometry(0.048, 20, 20);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xf6ebff });
    const glowMat = new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 });
    verts.forEach((v) => {
      const n = new THREE.Mesh(nodeGeo, nodeMat); n.position.copy(v); group.add(n);
      const s = new THREE.Sprite(glowMat); s.position.copy(v); s.scale.set(0.28, 0.28, 0.28); group.add(s);
    });

    // lights
    scene.add(new THREE.AmbientLight(0x8a7cc8, 0.7));
    const dl = new THREE.DirectionalLight(0xffffff, 1.3); dl.position.set(3, 4, 5); scene.add(dl);
    const pl = new THREE.PointLight(0xa855f7, 2.2, 12); pl.position.set(-3, -2, 3); scene.add(pl);

    state.renderer = renderer;
    state.scene = scene;
    state.cam = cam;
    state.group = group;

    // render one frame immediately so the orb is visible during the fade-in
    group.rotation.y = 0.5;
    renderer.render(scene, cam);
  }

  return { activate, deactivate, dispose };
}
