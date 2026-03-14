import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Scene setup ---
const viewer = document.getElementById('viewer');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(45, viewer.clientWidth / viewer.clientHeight, 0.1, 100);
camera.position.set(0, 4, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewer.clientWidth, viewer.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
viewer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 2, 0);
controls.update();

// --- Lighting ---
const ambient = new THREE.AmbientLight(0x404060, 1.2);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

const rimLight = new THREE.DirectionalLight(0xe94560, 0.6);
rimLight.position.set(-5, 5, -5);
scene.add(rimLight);

// --- Ground plane ---
const groundGeo = new THREE.CircleGeometry(5, 64);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x0f3460, roughness: 0.8 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- Material ---
const pieceMat = new THREE.MeshStandardMaterial({
  color: 0xe0e0e0,
  roughness: 0.3,
  metalness: 0.4,
});

// --- Chess piece geometry builders ---
// All pieces are built from lathe geometries (revolution of a profile) for a classic look.

function createLathe(points, segments = 48) {
  const vecs = points.map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(vecs, segments);
  geo.computeVertexNormals();
  return geo;
}

function baseProfile() {
  return [
    [0, 0],
    [1.0, 0],
    [1.0, 0.15],
    [0.85, 0.25],
    [0.75, 0.3],
    [0.75, 0.45],
    [0.8, 0.5],
    [0.65, 0.55],
  ];
}

function createKing() {
  const profile = [
    ...baseProfile(),
    [0.45, 0.8],
    [0.42, 2.8],
    [0.5, 2.9],
    [0.5, 3.0],
    [0.35, 3.1],
    [0.35, 3.3],
    [0.15, 3.4],
    [0.15, 3.7],
    [0.25, 3.7],
    [0.25, 3.85],
    [0.08, 3.85],
    [0.08, 4.1],
    [0.0, 4.1],
  ];
  return createLathe(profile);
}

function createQueen() {
  const profile = [
    ...baseProfile(),
    [0.45, 0.8],
    [0.4, 2.6],
    [0.5, 2.75],
    [0.5, 2.85],
    [0.35, 3.0],
    [0.2, 3.5],
    [0.35, 3.6],
    [0.1, 3.9],
    [0.0, 3.9],
  ];
  const group = new THREE.Group();
  group.add(new THREE.Mesh(createLathe(profile), pieceMat));
  // Crown ball
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 24), pieceMat);
  ball.position.y = 4.0;
  ball.castShadow = true;
  group.add(ball);
  return group;
}

function createRook() {
  const profile = [
    ...baseProfile(),
    [0.5, 0.8],
    [0.48, 2.4],
    [0.55, 2.5],
    [0.55, 2.6],
    [0.45, 2.7],
    [0.45, 3.0],
    [0.6, 3.0],
    [0.6, 3.4],
    [0.0, 3.4],
  ];
  return createLathe(profile, 4); // 4 segments for a square-ish turret top
}

function createBishop() {
  const profile = [
    ...baseProfile(),
    [0.45, 0.8],
    [0.38, 2.5],
    [0.45, 2.65],
    [0.45, 2.75],
    [0.3, 2.9],
    [0.05, 3.6],
    [0.0, 3.6],
  ];
  const group = new THREE.Group();
  group.add(new THREE.Mesh(createLathe(profile), pieceMat));
  // Mitre ball
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), pieceMat);
  ball.position.y = 3.7;
  ball.castShadow = true;
  group.add(ball);
  return group;
}

function createKnight() {
  // Knight is hard to do as a lathe — use a combination of shapes
  const group = new THREE.Group();

  // Base (lathe)
  const baseGeo = createLathe([
    ...baseProfile(),
    [0.45, 0.8],
    [0.4, 1.2],
    [0.0, 1.2],
  ]);
  group.add(new THREE.Mesh(baseGeo, pieceMat));

  // Neck (box, tilted)
  const neckGeo = new THREE.BoxGeometry(0.6, 2.0, 0.5);
  const neck = new THREE.Mesh(neckGeo, pieceMat);
  neck.position.set(0, 2.2, 0);
  neck.rotation.z = 0.15;
  neck.castShadow = true;
  group.add(neck);

  // Head (box + sphere for the snout)
  const headGeo = new THREE.BoxGeometry(0.55, 0.7, 0.5);
  const head = new THREE.Mesh(headGeo, pieceMat);
  head.position.set(0.15, 3.3, 0);
  head.rotation.z = 0.3;
  head.castShadow = true;
  group.add(head);

  // Snout
  const snoutGeo = new THREE.BoxGeometry(0.8, 0.35, 0.4);
  const snout = new THREE.Mesh(snoutGeo, pieceMat);
  snout.position.set(0.55, 3.1, 0);
  snout.rotation.z = 0.1;
  snout.castShadow = true;
  group.add(snout);

  // Ear
  const earGeo = new THREE.ConeGeometry(0.15, 0.4, 12);
  const ear = new THREE.Mesh(earGeo, pieceMat);
  ear.position.set(0.0, 3.7, 0);
  ear.rotation.z = -0.2;
  ear.castShadow = true;
  group.add(ear);

  return group;
}

function createPawn() {
  const profile = [
    ...baseProfile(),
    [0.4, 0.8],
    [0.3, 1.8],
    [0.38, 1.95],
    [0.38, 2.05],
    [0.25, 2.2],
    [0.05, 2.7],
    [0.0, 2.7],
  ];
  const group = new THREE.Group();
  group.add(new THREE.Mesh(createLathe(profile), pieceMat));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), pieceMat);
  ball.position.y = 2.85;
  ball.castShadow = true;
  group.add(ball);
  return group;
}

const pieceBuilders = {
  king: createKing,
  queen: createQueen,
  rook: createRook,
  bishop: createBishop,
  knight: createKnight,
  pawn: createPawn,
};

// --- Piece management ---
let currentPiece = null;

function showPiece(name) {
  if (currentPiece) {
    scene.remove(currentPiece);
  }

  const builder = pieceBuilders[name];
  if (!builder) return;

  const result = builder();

  if (result instanceof THREE.Group) {
    currentPiece = result;
  } else {
    // It's a geometry, wrap it
    const mesh = new THREE.Mesh(result, pieceMat);
    mesh.castShadow = true;
    currentPiece = mesh;
  }

  scene.add(currentPiece);

  // Update label
  document.getElementById('piece-name').textContent =
    name.charAt(0).toUpperCase() + name.slice(1);
}

// --- Sidebar interaction ---
const buttons = document.querySelectorAll('.piece-btn');
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showPiece(btn.dataset.piece);
  });
});

// --- Start ---
showPiece('king');

// --- Animation loop ---
function animate() {
  requestAnimationFrame(animate);
  if (currentPiece) {
    currentPiece.rotation.y += 0.005;
  }
  controls.update();
  renderer.render(scene, camera);
}
animate();

// --- Resize ---
window.addEventListener('resize', () => {
  camera.aspect = viewer.clientWidth / viewer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
});
