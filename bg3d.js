/* =====================================================================
   ZAVIER'S 7TH — 3D BACKGROUND: extruded "7" that rotates with scroll
   Classic script (works on file:// too). Needs global THREE (UMD build
   loaded from CDN in index.html). Fails soft: adds .no-webgl so the
   CSS outline-7 fallback shows. Respects prefers-reduced-motion
   (static frame) unless the page is opened with ?motion=1.
   ===================================================================== */

(function () {
  'use strict';

  var canvas = document.getElementById('bg3d');
  /* Motion is ON by default; ?motion=0 renders a static frame instead */
  var reducedMotion = /[?&]motion=0/.test(window.location.search);

  function bail() {
    document.documentElement.classList.add('no-webgl');
    if (canvas) canvas.style.display = 'none';
  }

  if (!canvas || typeof THREE === 'undefined') { bail(); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.outputEncoding = THREE.sRGBEncoding;
  } catch (err) {
    console.warn('WebGL unavailable, using CSS fallback seven.', err);
    bail();
    return;
  }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.z = 7.5;

  /* ---- Build the "7" glyph (unit box, y-up) and extrude ---- */
  var shape = new THREE.Shape();
  shape.moveTo(0.04, 1.0);
  shape.lineTo(1.0, 1.0);
  shape.lineTo(1.0, 0.78);
  shape.lineTo(0.50, 0.0);
  shape.lineTo(0.16, 0.0);
  shape.lineTo(0.60, 0.72);
  shape.lineTo(0.04, 0.72);
  shape.closePath();

  var geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.42,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 5,
    curveSegments: 8,
  });
  geometry.center();

  var material = new THREE.MeshStandardMaterial({
    color: 0x2A2050,
    metalness: 0.92,
    roughness: 0.26,
  });
  var seven = new THREE.Mesh(geometry, material);
  scene.add(seven);

  /* ---- Party-colored lighting rig (legacy light units) ---- */
  scene.add(new THREE.AmbientLight(0x2A2040, 1.2));
  var key = new THREE.DirectionalLight(0xFFF0DD, 1.3);
  key.position.set(2, 3, 5);
  scene.add(key);
  var magenta = new THREE.PointLight(0xFF3D8A, 2.6, 0, 1);
  magenta.position.set(-5, 2, 4);
  scene.add(magenta);
  var gold = new THREE.PointLight(0xFFC53D, 2.0, 0, 1);
  gold.position.set(5, -2, 4);
  scene.add(gold);
  var violet = new THREE.PointLight(0x8B5CF6, 2.4, 0, 1);
  violet.position.set(0, 5, -5);
  scene.add(violet);

  /* ---- Responsive placement ---- */
  var baseY = 0.12;
  function layout() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (w < 700) {
      seven.scale.setScalar(2.4);
      baseY = 0.3;
      seven.position.set(0, baseY, 0);
    } else {
      seven.scale.setScalar(3.3);
      baseY = 0.12;
      seven.position.set(0.7, baseY, 0);
    }
  }
  layout();

  /* ---- Motion state ---- */
  var mouseX = 0, mouseY = 0;
  var rotY = 0.55, rotX = -0.12;
  var clock = new THREE.Clock();

  window.addEventListener('mousemove', function (e) {
    mouseX = e.clientX / window.innerWidth - 0.5;
    mouseY = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  function renderStatic() {
    seven.rotation.set(-0.12, 0.55, -0.06);
    renderer.render(scene, camera);
  }

  var running = true;
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running && !reducedMotion) requestAnimationFrame(loop);
  });

  function loop() {
    if (!running) return;
    var t = clock.getElapsedTime();

    /* Scroll drives the main rotation; idle time keeps it alive */
    var targetRotY = 0.55 + window.scrollY * 0.0028 + t * 0.14 + mouseX * 0.35;
    var targetRotX = -0.12 + Math.sin(t * 0.4) * 0.08 + mouseY * 0.22;

    rotY += (targetRotY - rotY) * 0.06;
    rotX += (targetRotX - rotX) * 0.06;

    seven.rotation.y = rotY;
    seven.rotation.x = rotX;
    seven.rotation.z = -0.06 + Math.sin(t * 0.5) * 0.04;
    seven.position.y = baseY + Math.sin(t * 0.7) * 0.14;

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', function () {
    layout();
    if (reducedMotion) renderStatic();
  });

  if (reducedMotion) {
    renderStatic();
  } else {
    requestAnimationFrame(loop);
  }
})();
