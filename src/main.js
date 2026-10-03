import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createPequenito } from './model.js';
import './style.css';
import './guide.js';

const canvas = document.querySelector('#scene');
const stage = document.querySelector('.stage');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const labels = { idle: 'Original', happy: 'Feliz', curious: 'Curioso', blink: 'Guiño', sleepy: 'Dormilón', love: 'Enamorado', dizzy: 'Mareado', excited: 'Emocionado', angry: 'Enojado', sad: 'Triste', surprised: 'Sorprendido', shy: 'Tímido', scared: 'Asustado', confused: 'Confundido', laugh: 'Risueño', focused: 'Concentrado' };
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true }); }
catch { document.querySelector('#scene-error').hidden = false; }

if (renderer) start();

function start() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#202824');
  scene.fog = new THREE.Fog('#202824', 16, 34);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.025);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.65;
  room.dispose();
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const target = new THREE.Vector3(0, 1.28, 0);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 20;
  controls.minPolarAngle = 0.22;
  controls.maxPolarAngle = Math.PI * 0.72;
  controls.target.copy(target);

  scene.add(new THREE.HemisphereLight(0xeafcea, 0x172c22, 1.5));
  const key = new THREE.DirectionalLight(0xf4ffe9, 2.8);
  key.position.set(-3.5, 7, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 7; key.shadow.camera.bottom = -5;
  key.shadow.normalBias = 0.035; key.shadow.bias = -0.0003; key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc3e1ff, 3); rim.position.set(4, 4, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffd891, 0.8); fill.position.set(4, -1, 4); scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#17231b', roughness: 0.97, metalness: 0.08 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.29; floor.receiveShadow = true; scene.add(floor);
  const { root, clips, materials } = createPequenito();
  // A dual-colour OLED changes colour at a fixed screen row, even when eyes move.
  for (const material of [materials.cyan, materials.lime]) {
    material.onBeforeCompile = shader => {
      shader.uniforms.oledCyan = { value: new THREE.Color(0x05fce7) };
      shader.uniforms.oledYellow = { value: new THREE.Color(0xcde94b) };
      shader.vertexShader = 'varying float vOledY;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvOledY = (modelMatrix * vec4(transformed, 1.0)).y;');
      shader.fragmentShader = 'varying float vOledY; uniform vec3 oledCyan; uniform vec3 oledYellow;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(oledCyan, oledYellow, step(0.335, vOledY));');
    };
    material.customProgramCacheKey = () => 'fixed-oled-band-v1';
  }
  scene.add(root);
  const mixer = new THREE.AnimationMixer(root);
  const actions = Object.fromEntries(clips.map(clip => [clip.name, mixer.clipAction(clip)]));
  let active = 'idle';
  let currentAction = actions[active];
  let paused = reducedMotion;
  let speed = 1;
  let currentView = 'front';
  let currentEnvironment = 'studio';
  currentAction.play();
  mixer.update(0);
  let frameCount = 0;
  let previousTime = performance.now();

  function view(name) {
    const narrow = stage.clientWidth < 520;
    const distance = narrow ? 13.5 : 11.8;
    const positions = { front: [2.6, 2.2, distance], side: [distance, 2.3, 1.4], back: [-2, 2.3, -distance] };
    camera.position.set(...positions[name]);
    controls.target.copy(target); controls.update();
    currentView = name;
    document.querySelectorAll('[data-view]').forEach(b => { const selected = b.dataset.view === name; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', selected); });
  }
  function setAnimation(name) {
    if (!actions[name]) throw new Error('Expresión desconocida.');
    if (name !== active) {
      const next = actions[name];
      next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
      currentAction.crossFadeTo(next, 0.22, false);
      currentAction = next; active = name;
      if (paused) { mixer.update(0.23); }
    } else { currentAction.time = 0; mixer.update(0); }
    document.querySelectorAll('[data-animation]').forEach(b => { const selected = b.dataset.animation === active; b.classList.toggle('active', selected); b.setAttribute('aria-pressed', selected); });
    document.querySelector('#active-label').textContent = labels[active];
    updateProgress();
    return { expression: active, label: labels[active], paused, speed };
  }
  function setPaused(value) {
    paused = value;
    document.querySelector('#pause').setAttribute('aria-label', paused ? 'Reproducir animación' : 'Pausar animación');
    document.querySelector('#play-label').textContent = paused ? 'Reproducir' : 'Pausar';
    document.querySelector('#play-icon').textContent = paused ? '▷' : 'Ⅱ';
  }
  function updateProgress() {
    const duration = currentAction.getClip().duration;
    document.querySelector('#progress').style.width = `${currentAction.time / duration * 100}%`;
    document.querySelector('#time-label').textContent = `${currentAction.time.toFixed(1)} / ${duration.toFixed(1)} s`;
  }
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize(); view('front'); setPaused(paused);
  controls.addEventListener('start', () => document.querySelectorAll('[data-view]').forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed', false); }));
  document.querySelectorAll('[data-animation]').forEach(b => b.addEventListener('click', () => setAnimation(b.dataset.animation)));
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => view(b.dataset.view)));
  document.querySelector('#reset-view').addEventListener('click', () => view('front'));
  document.querySelector('#pause').addEventListener('click', () => setPaused(!paused));
  document.querySelector('#speed').addEventListener('input', e => { speed = Number(e.target.value); document.querySelector('#speed-value').textContent = `${speed}×`; });
  canvas.addEventListener('keydown', e => {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key)) {
      e.preventDefault();
      if (e.key === 'Home') view('front');
      else {
        const offset = camera.position.clone().sub(controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        if (e.key === 'ArrowLeft') spherical.theta -= .15;
        if (e.key === 'ArrowRight') spherical.theta += .15;
        if (e.key === 'ArrowUp') spherical.phi -= .12;
        if (e.key === 'ArrowDown') spherical.phi += .12;
        if (e.key === '+') spherical.radius *= .9;
        if (e.key === '-') spherical.radius *= 1.1;
        spherical.phi = THREE.MathUtils.clamp(spherical.phi, .22, Math.PI * .72);
        spherical.radius = THREE.MathUtils.clamp(spherical.radius, 5, 20);
        camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(controls.target)); controls.update();
      }
    }
  });
  document.querySelectorAll('[data-environment]').forEach(b => b.addEventListener('click', () => {
    currentEnvironment = b.dataset.environment;
    const themes = { studio: ['#202824','#17231b',1], night: ['#101825','#111a29',0.8], light: ['#d4d9d0','#a0ad98',1.15] };
    const [bg, ground, exposure] = themes[currentEnvironment];
    scene.background.set(bg); scene.fog.color.set(bg); floor.material.color.set(ground); renderer.toneMappingExposure = exposure;
    stage.classList.toggle('light-stage', currentEnvironment === 'light');
    document.querySelectorAll('[data-environment]').forEach(button => { const selected = b === button; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected); });
  }));
  document.querySelector('#snapshot').addEventListener('click', () => {
    renderer.render(scene, camera);
    canvas.toBlob(blob => {
      if (!blob) return toast('No se pudo guardar la imagen.');
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = `pequenito-${active}.png`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 3000); toast('Tu imagen está lista.');
    }, 'image/png');
  });
  renderer.setAnimationLoop(now => {
    const delta = Math.min((now - previousTime) / 1000, .08); previousTime = now;
    if (document.hidden) return;
    if (!paused && !document.hidden) mixer.update(delta * speed);
    controls.update(); renderer.render(scene, camera);
    if (frameCount++ % 4 === 0) updateProgress();
  });
  canvas.addEventListener('webglcontextlost', () => { document.querySelector('#scene-error').hidden = false; });
  try { Promise.resolve(document.modelContext?.registerTool({
    name: 'set_pequenito_expression', title: 'Cambiar expresión de Pequeñito',
    description: 'Selecciona una de las dieciséis expresiones en la demo 3D y devuelve el estado de reproducción.',
    inputSchema: { type: 'object', properties: { expression: { type: 'string', enum: Object.keys(labels) } }, required: ['expression'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) { if (!input || !Object.hasOwn(labels, input.expression) || Object.keys(input).some(k => k !== 'expression')) throw new Error('Expresión no válida.'); return setAnimation(input.expression); }
  })).catch(() => {}); } catch { /* The visual controls work in browsers without WebMCP. */ }
}
let toastTimer;
function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3000); }
