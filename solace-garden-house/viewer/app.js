import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.getElementById("view");
const roomEl = document.getElementById("room");
const roomsEl = document.getElementById("rooms");
const blocker = document.getElementById("blocker");
const startBtn = document.getElementById("start");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb7c4cc);
scene.fog = new THREE.Fog(0xb7c4cc, 28, 78);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.08, 160);
const controls = new PointerLockControls(camera, document.body);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const hemi = new THREE.HemisphereLight(0xc9ddff, 0x3d2c18, 0.55);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff0d4, 2.3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 90;
sun.shadow.bias = -0.0004;
scene.add(sun);
scene.add(sun.target);

const fill = new THREE.DirectionalLight(0x9bb6d4, 0.35);
fill.position.set(-12, 10, 8);
scene.add(fill);

const keys = { w: false, a: false, s: false, d: false, shift: false };
let sceneInfo = null;
let colliders = [];
let velocity = new THREE.Vector3();
const eye = 1.62;
const radius = 0.28;
let ready = false;

startBtn.addEventListener("click", () => controls.lock());
controls.addEventListener("lock", () => blocker.classList.add("hidden"));
controls.addEventListener("unlock", () => blocker.classList.remove("hidden"));

addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = true;
  if (e.key === "Shift") keys.shift = true;
});
addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = false;
  if (e.key === "Shift") keys.shift = false;
});
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function circleVsAabb(x, z, min, max, r) {
  const nx = Math.max(min[0], Math.min(x, max[0]));
  const nz = Math.max(min[2], Math.min(z, max[2]));
  const dx = x - nx;
  const dz = z - nz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return null;
  const d = Math.sqrt(d2) || 0.0001;
  const push = r - d;
  return { x: (dx / d) * push, z: (dz / d) * push };
}

function resolve(pos) {
  for (let i = 0; i < 3; i++) {
    for (const c of colliders) {
      const hit = circleVsAabb(pos.x, pos.z, c.min, c.max, radius);
      if (!hit) continue;
      // ignore slabs that are only floor-thin
      if (c.max[1] < 0.35) continue;
      pos.x += hit.x;
      pos.z += hit.z;
    }
  }
  if (sceneInfo?.bounds) {
    const b = sceneInfo.bounds;
    const minX = Math.min(b.min[0], b.max[0]) + 0.4;
    const maxX = Math.max(b.min[0], b.max[0]) - 0.4;
    const minZ = Math.min(b.min[2], b.max[2]) + 0.4;
    const maxZ = Math.max(b.min[2], b.max[2]) - 0.4;
    pos.x = Math.min(maxX, Math.max(minX, pos.x));
    pos.z = Math.min(maxZ, Math.max(minZ, pos.z));
  }
  pos.y = eye;
}

function nearestRoom(pos) {
  if (!sceneInfo) return "Garden";
  let best = "Garden";
  let bestD = 4.2;
  for (const r of sceneInfo.rooms) {
    const dx = pos.x - r.center[0];
    const dz = pos.z - r.center[2];
    const d = Math.hypot(dx, dz);
    const reach = 0.55 * Math.hypot(r.size[0], r.size[1]);
    if (d < reach && d < bestD) {
      best = r.label;
      bestD = d;
    }
  }
  return best;
}

function teleport(room) {
  camera.position.set(room.center[0], eye, room.center[2]);
  resolve(camera.position);
  roomEl.textContent = room.label;
}

function enhanceMaterials(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (!m) continue;
      const n = (m.name || obj.name || "").toLowerCase();
      if (n.includes("glass")) {
        m.transparent = true;
        m.opacity = 0.22;
        m.roughness = 0.05;
        m.metalness = 0.05;
        m.side = THREE.DoubleSide;
        m.depthWrite = false;
      }
      if (n.includes("water")) {
        m.transparent = true;
        m.opacity = 0.62;
        m.roughness = 0.08;
        m.metalness = 0.1;
        m.color = new THREE.Color(0x1a4a52);
      }
      if (n.includes("emit") || n.includes("warm")) {
        m.emissive = new THREE.Color(0xffdc9a);
        m.emissiveIntensity = 1.6;
      }
    }
  });
}

async function boot() {
  const info = await fetch("./assets/scene_info.json").then((r) => r.json());
  sceneInfo = info;
  colliders = info.colliders || [];

  const spawn = info.spawn.position;
  const look = info.spawn.lookAt;
  camera.position.set(spawn[0], spawn[1], spawn[2]);
  camera.lookAt(look[0], look[1], look[2]);

  if (info.sun) {
    const d = info.sun.direction;
    sun.position.set(-d[0] * 40, Math.max(12, -d[1] * 40), -d[2] * 40);
    sun.target.position.set(12.7, 0, -6);
    sun.color.setRGB(info.sun.color[0], info.sun.color[1], info.sun.color[2]);
    sun.intensity = info.sun.intensity ?? 2.3;
  }

  const preferred = [
    "entry",
    "living",
    "dining",
    "kitchen",
    "office",
    "bed2",
    "bed3",
    "primary",
    "primary_bath",
    "west_gallery",
    "east_gallery",
  ];
  const rooms = [...info.rooms].sort((a, b) => {
    const ia = preferred.indexOf(a.id);
    const ib = preferred.indexOf(b.id);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  for (const r of rooms) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = r.label;
    btn.addEventListener("click", () => {
      teleport(r);
      for (const b of roomsEl.querySelectorAll("button")) b.classList.remove("active");
      btn.classList.add("active");
    });
    li.appendChild(btn);
    roomsEl.appendChild(li);
  }

  const loader = new GLTFLoader();
  const gltf = await new Promise((resolve, reject) => {
    loader.load("./assets/house.glb", resolve, undefined, reject);
  });
  enhanceMaterials(gltf.scene);
  scene.add(gltf.scene);
  ready = true;
  roomEl.textContent = nearestRoom(camera.position);
}

const clock = new THREE.Clock();

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, clock.getDelta());
  if (ready && controls.isLocked) {
    const speed = (keys.shift ? 5.6 : 2.8) * dt;
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    controls.getDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    velocity.set(0, 0, 0);
    if (keys.w) velocity.add(forward);
    if (keys.s) velocity.sub(forward);
    if (keys.d) velocity.add(right);
    if (keys.a) velocity.sub(right);
    if (velocity.lengthSq() > 0) {
      velocity.normalize().multiplyScalar(speed);
      camera.position.add(velocity);
      resolve(camera.position);
      roomEl.textContent = nearestRoom(camera.position);
    }
  }
  renderer.render(scene, camera);
}

boot().catch((err) => {
  roomEl.textContent = "Failed to load house.glb — run ./scripts/build.sh";
  console.error(err);
});
tick();
