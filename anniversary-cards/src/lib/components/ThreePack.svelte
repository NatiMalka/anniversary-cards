<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';

  /** @type {'regular'|'rare'|'legendary'} */
  export let packType = 'regular';
  /** showcase=true for the large overlay view */
  export let showcase = false;

  const LIGHTS = {
    regular:   { color: 0x8a8a9a, intensity: 2.6 },
    rare:      { color: 0xc8c8d4, intensity: 3.2 },
    legendary: { color: 0xf5c451, intensity: 4.0 },
  };

  let canvas;
  let renderer, scene, camera, packMesh, keyLight, particles;
  let raf;
  let clock;
  let hovered = false;
  let mx = 0, my = 0;

  onMount(() => {
    init();
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas.parentElement);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      cleanup();
    };
  });

  function init() {
    const W = canvas.parentElement.offsetWidth  || 130;
    const H = canvas.parentElement.offsetHeight || Math.round(W / 0.706);

    clock  = new THREE.Clock();
    scene  = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 50);
    camera.position.z = showcase ? 3.8 : 4.2;

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping      = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1.4;

    /* pack card mesh — sprite sheet: regular=left, rare=center, legendary=right */
    const OFFSETS = { regular: 0, rare: 1 / 3, legendary: 2 / 3 };
    const geo = new THREE.PlaneGeometry(1.35, 1.35 / 0.706, 1, 1);
    const tex = new THREE.TextureLoader().load('/pack-images.png');
    tex.colorSpace   = THREE.SRGBColorSpace;
    tex.wrapS        = THREE.ClampToEdgeWrapping;
    tex.wrapT        = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1 / 3, 1);
    tex.offset.set(OFFSETS[packType] ?? 0, 0);
    const mat = new THREE.MeshPhysicalMaterial({
      map: tex,
      emissiveMap: tex,                        // pack self-illuminates — always shows its own colours
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.92,
      metalness: 0.55,                         // enough for the coloured light to reflect as shimmer
      roughness: 0.3,
      clearcoat: 0,
    });
    packMesh = new THREE.Mesh(geo, mat);
    scene.add(packMesh);

    /* only the orbiting coloured key light — no white lights */
    const lc = LIGHTS[packType] || LIGHTS.regular;
    keyLight = new THREE.PointLight(lc.color, lc.intensity, 14);
    keyLight.position.set(1.5, 1.5, 2.5);
    scene.add(keyLight);

    if (packType === 'legendary') buildParticles();

    animate();
  }

  function buildParticles() {
    const count = showcase ? 90 : 64;
    const pos   = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 0.88 + Math.random() * 0.4;
      pos[i * 3]     = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.9;
      pos[i * 3 + 2] = Math.sin(a) * 0.22;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xf5c451,
      size: showcase ? 0.052 : 0.032,
      transparent: true,
      opacity: 0.84,
      sizeAttenuation: true,
    });
    particles = new THREE.Points(geo, mat);
    scene.add(particles);
  }

  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    /* float */
    if (packMesh) packMesh.position.y = Math.sin(t * 0.85) * 0.046;

    /* orbit key light */
    if (keyLight) {
      keyLight.position.x = Math.sin(t * 0.55) * 2.2;
      keyLight.position.y = Math.cos(t * 0.35) * 1.8;
    }

    /* mouse tilt */
    if (packMesh) {
      const ty = hovered ? mx * 0.38 : 0;
      const tx = hovered ? -my * 0.26 : 0;
      packMesh.rotation.y += (ty - packMesh.rotation.y) * 0.08;
      packMesh.rotation.x += (tx - packMesh.rotation.x) * 0.08;
    }

    /* particle orbit */
    if (particles) particles.rotation.y = t * 0.22;

    renderer?.render(scene, camera);
  }

  function onResize() {
    if (!canvas?.parentElement || !renderer) return;
    const W = canvas.parentElement.offsetWidth;
    const H = canvas.parentElement.offsetHeight;
    if (!W || !H) return;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H, false);
  }

  function cleanup() {
    scene?.traverse(obj => {
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => m?.dispose());
    });
    renderer?.dispose();
  }

  function onMouseMove(e) {
    const r = canvas.getBoundingClientRect();
    mx =  ((e.clientX - r.left) / r.width  - 0.5) * 2;
    my = -((e.clientY - r.top)  / r.height - 0.5) * 2;
  }
</script>

<canvas
  bind:this={canvas}
  class="three-pack"
  on:mousemove={onMouseMove}
  on:mouseenter={() => (hovered = true)}
  on:mouseleave={() => { hovered = false; mx = 0; my = 0; }}
></canvas>

<style>
  .three-pack {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
