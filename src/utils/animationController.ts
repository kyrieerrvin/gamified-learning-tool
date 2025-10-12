/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

export type HeroInitOptions = {
  pastelColors?: string[];
  maxMeshes?: number;
};

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) &&
      window.WebGLRenderingContext
    );
  } catch {
    return false;
  }
}

export async function initHeroThree(
  canvas: HTMLCanvasElement,
  opts?: HeroInitOptions
) {
  const { pastelColors = [
    "#0038A8", // PH Royal Blue
    "#CE1126", // PH Crimson Red
    "#FCD116", // PH Golden Yellow
  ], maxMeshes = 7 } = opts || {};

  const prefersReduced = document.documentElement.classList.contains("reduced-motion");
  if (prefersReduced || !isWebGLAvailable()) {
    // Fallback: static gradient background
    canvas.style.background = "linear-gradient(180deg, #EAF3FF 0%, #FCE7F3 100%)";
    return () => {};
  }

  const THREE = await import("three");

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const width = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || 400;
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 8);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(2, 3, 4);
  scene.add(dir);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xeaeaea, 0.5);
  scene.add(hemi);

  // Create soft spheres
  const meshes: any[] = [];
  const sphere = new THREE.SphereGeometry(1, 24, 24);
  for (let i = 0; i < maxMeshes; i++) {
    const color = new THREE.Color(pastelColors[i % pastelColors.length]);
    const material = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.9 });
    const m = new THREE.Mesh(sphere, material);
    m.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 4, (Math.random() * -4) - 2);
    const s = 0.6 + Math.random() * 0.9;
    m.scale.set(s, s, s);
    scene.add(m);
    meshes.push({ mesh: m, speed: 0.08 + Math.random() * 0.12, phase: Math.random() * Math.PI * 2 });
  }

  let raf = 0;
  const animate = () => {
    for (const item of meshes) {
      item.phase += item.speed * 0.01;
      item.mesh.position.y += Math.sin(item.phase) * 0.003;
      item.mesh.rotation.y += 0.002;
    }
    renderer.render(scene, camera);
    raf = window.requestAnimationFrame(animate);
  };
  animate();

  const onResize = () => {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || 400;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", onResize);

  return () => {
    window.cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    renderer.dispose();
    scene.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.geometry?.dispose?.();
        obj.material?.dispose?.();
      }
    });
  };
}

export function attachSparkles(target: HTMLElement) {
  const rect = target.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const d = document.createElement("span");
    d.className = "sparkle";
    d.style.left = `${Math.random() * rect.width}px`;
    d.style.top = `${Math.random() * rect.height}px`;
    target.appendChild(d);
    setTimeout(() => d.remove(), 900);
  }
}


