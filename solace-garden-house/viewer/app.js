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
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8aa4b5);
scene.fog = new THREE.Fog(0x8aa4b5, 36, 90);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.08, 160);
camera.rotation.order = "YXZ";
const controls = new PointerLockControls(camera, document.body);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
scene.environmentIntensity = 0.55;

scene.add(new THREE.AmbientLight(0xfff3e0, 0.28));
const hemi = new THREE.HemisphereLight(0xc5ddff, 0x4a3820, 0.7);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffe3b0, 2.8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -32;
sun.shadow.camera.right = 32;
sun.shadow.camera.top = 32;
sun.shadow.camera.bottom = -32;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 90;
sun.shadow.bias = -0.00035;
scene.add(sun);
scene.add(sun.target);

const fill = new THREE.DirectionalLight(0x9eb6d0, 0.45);
fill.position.set(-14, 12, 10);
scene.add(fill);

const COURTYARD = new THREE.Vector3(12.7, 1.4, -5.4);
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  shift: false,
  q: false,
  e: false,
  arrowleft: false,
  arrowright: false,
  arrowup: false,
  arrowdown: false,
};
let sceneInfo = null;
let colliders = [];
const eye = 1.62;
const radius = 0.28;
let ready = false;
let dragging = false;
let lastX = 0;
let lastY = 0;

function lookToward(x, y, z) {
  camera.lookAt(x, y, z);
  camera.rotation.z = 0;
}

startBtn.addEventListener("click", () => {
  blocker.classList.add("hidden");
  controls.lock();
});
canvas.addEventListener("click", () => {
  if (ready) {
    blocker.classList.add("hidden");
    controls.lock();
  }
});
controls.addEventListener("lock", () => blocker.classList.add("hidden"));
controls.addEventListener("unlock", () => {
  /* keep exploring with WASD / arrows after unlock */
});

addEventListener("keydown", (e) => {
  const map = {
    KeyW: "w",
    KeyA: "a",
    KeyS: "s",
    KeyD: "d",
    KeyQ: "q",
    KeyE: "e",
    ShiftLeft: "shift",
    ShiftRight: "shift",
    ArrowLeft: "arrowleft",
    ArrowRight: "arrowright",
    ArrowUp: "arrowup",
    ArrowDown: "arrowdown",
  };
  const name = map[e.code];
  if (name) {
    keys[name] = true;
    e.preventDefault();
  }
});
addEventListener("keyup", (e) => {
  const map = {
    KeyW: "w",
    KeyA: "a",
    KeyS: "s",
    KeyD: "d",
    KeyQ: "q",
    KeyE: "e",
    ShiftLeft: "shift",
    ShiftRight: "shift",
    ArrowLeft: "arrowleft",
    ArrowRight: "arrowright",
    ArrowUp: "arrowup",
    ArrowDown: "arrowdown",
  };
  const name = map[e.code];
  if (name) keys[name] = false;
});

canvas.addEventListener("mousedown", (e) => {
  if (controls.isLocked) return;
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});
addEventListener("mouseup", () => {
  dragging = false;
});
addEventListener("mousemove", (e) => {
  if (!dragging || controls.isLocked) return;
  camera.rotation.y -= (e.clientX - lastX) * 0.005;
  camera.rotation.x -= (e.clientY - lastY) * 0.005;
  camera.rotation.x = Math.max(-1.2, Math.min(1.2, camera.rotation.x));
  lastX = e.clientX;
  lastY = e.clientY;
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
      if (c.max[1] < 0.35) continue;
      const hit = circleVsAabb(pos.x, pos.z, c.min, c.max, radius);
      if (!hit) continue;
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
  let bestD = 5.0;
  for (const r of sceneInfo.rooms) {
    const dx = pos.x - r.center[0];
    const dz = pos.z - r.center[2];
    const d = Math.hypot(dx, dz);
    const reach = 0.62 * Math.hypot(r.size[0], r.size[1]);
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
  lookToward(COURTYARD.x, 1.4, COURTYARD.z);
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
      const n = `${m.name || ""} ${obj.name || ""}`.toLowerCase();
      if (n.includes("glass")) {
        m.transparent = true;
        m.opacity = 0.28;
        m.roughness = 0.04;
        m.metalness = 0.08;
        m.color = new THREE.Color(0xd8eef2);
        m.side = THREE.DoubleSide;
        m.depthWrite = false;
      }
      if (n.includes("water")) {
        m.transparent = true;
        m.opacity = 0.7;
        m.roughness = 0.06;
        m.metalness = 0.15;
        m.color = new THREE.Color(0x163e46);
      }
      if (n.includes("emit") || n.includes("warm")) {
        m.emissive = new THREE.Color(0xffd089);
        m.emissiveIntensity = 2.2;
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
  lookToward(look[0], look[1], look[2]);

  if (info.sun) {
    const d = info.sun.direction;
    sun.position.set(-d[0] * 42, Math.max(14, Math.abs(d[1]) * 42), -d[2] * 42);
    sun.target.position.set(12.7, 0, -6);
    sun.color.setRGB(info.sun.color[0], info.sun.color[1], info.sun.color[2]);
    sun.intensity = 2.8;
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
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
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
  if (ready) {
    const turn = 1.6 * dt;
    if (keys.q || keys.arrowleft) camera.rotation.y += turn;
    if (keys.e || keys.arrowright) camera.rotation.y -= turn;
    if (keys.arrowup) camera.rotation.x += turn * 0.7;
    if (keys.arrowdown) camera.rotation.x -= turn * 0.7;
    camera.rotation.x = Math.max(-1.2, Math.min(1.2, camera.rotation.x));

    const speed = (keys.shift ? 5.6 : 2.8) * dt;
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0) forward.normalize();
    right.crossVectors(forward, camera.up).normalize();
    const move = new THREE.Vector3();
    if (keys.w) move.add(forward);
    if (keys.s) move.sub(forward);
    if (keys.d) move.add(right);
    if (keys.a) move.sub(right);
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed);
      camera.position.add(move);
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
