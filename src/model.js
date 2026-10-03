import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Everything is ordinary mesh geometry and glTF-compatible animation tracks.
// The reference is a small exposed-electronics OLED keychain, not a toy body.
export function createPequenito() {
  const root = new THREE.Group();
  root.name = 'Pequenito';
  const hardware = new THREE.Group();
  hardware.name = 'Hardware';
  root.add(hardware);
  const materials = {
    pcb: new THREE.MeshStandardMaterial({ color: 0x103331, roughness: 0.58, metalness: 0.22 }),
    pcbBack: new THREE.MeshStandardMaterial({ color: 0x17413b, roughness: 0.53, metalness: 0.18 }),
    silver: new THREE.MeshStandardMaterial({ color: 0xa9b4b7, metalness: 0.94, roughness: 0.25 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x4b5c5d, metalness: 0.86, roughness: 0.37 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xbe9432, metalness: 0.77, roughness: 0.31 }),
    copper: new THREE.MeshStandardMaterial({ color: 0x6f7550, metalness: 0.55, roughness: 0.46 }),
    ceramic: new THREE.MeshStandardMaterial({ color: 0xc2a980, roughness: 0.64 }),
    chip: new THREE.MeshStandardMaterial({ color: 0x101416, roughness: 0.67, metalness: 0.12 }),
    white: new THREE.MeshStandardMaterial({ color: 0xc6d0c4, roughness: 0.64 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xabc9c5, metalness: 0, roughness: 0.11, transparent: true, opacity: 0.27, transmission: 0.12, thickness: 0.08, ior: 1.49, clearcoat: 1, depthWrite: false }),
    acrylicEdge: new THREE.MeshPhysicalMaterial({ color: 0xb7cfcb, roughness: 0.15, metalness: 0.08, transparent: true, opacity: 0.55, clearcoat: 1, depthWrite: false }),
    amber: new THREE.MeshPhysicalMaterial({ color: 0x9e6d0b, roughness: 0.31, metalness: 0.12, transparent: true, opacity: 0.79, clearcoat: 0.75, depthWrite: false }),
    display: new THREE.MeshPhysicalMaterial({ color: 0x020608, roughness: 0.23, metalness: 0.03, clearcoat: 0.55, clearcoatRoughness: 0.18 }),
    cyan: new THREE.MeshBasicMaterial({ color: 0x05fce7, toneMapped: false }),
    lime: new THREE.MeshBasicMaterial({ color: 0xcde94b, toneMapped: false }),
    red: new THREE.MeshStandardMaterial({ color: 0x7e1d17, roughness: 0.72 }),
    tealWire: new THREE.MeshStandardMaterial({ color: 0x056652, roughness: 0.63 }),
    blackWire: new THREE.MeshStandardMaterial({ color: 0x161b18, roughness: 0.73 }),
    battery: new THREE.MeshStandardMaterial({ color: 0xb7b9ad, metalness: 0.66, roughness: 0.5 }),
  };

  let serial = 0;
  const addMesh = (geometry, material, name, parent = hardware) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${name}_${serial++}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const box = (name, w, h, d, x, y, z, material, radius = 0.01, parent = hardware) => {
    const geometry = radius > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d);
    const mesh = addMesh(geometry, material, name, parent);
    mesh.position.set(x, y, z);
    return mesh;
  };
  function roundedShape(w, h, r, x = -w / 2, y = -h / 2) {
    const s = new THREE.Shape();
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function frame(name, w, h, border, depth, r, x, y, z, material) {
    const shape = roundedShape(w, h, r);
    const hole = roundedShape(w - 2 * border, h - 2 * border, Math.max(0.01, r - border));
    shape.holes.push(new THREE.Path(hole.getPoints(8).reverse()));
    const mesh = addMesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6 }), material, name);
    mesh.position.set(x, y, z);
    return mesh;
  }
  function tube(name, points, radius, material, parent = hardware, segments = 28) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return addMesh(new THREE.TubeGeometry(curve, segments, radius, 7, false), material, name, parent);
  }
  function rod(name, a, b, radius, material, parent = hardware) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const mesh = addMesh(new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), 10), material, name, parent);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    return mesh;
  }

  // Layered board, battery and acrylic case, with readable depth from the side.
  box('RearAcrylic', 2.2, 2.35, 0.065, 0, 0, -0.207, materials.glass, 0.035);
  box('MainCircuitBoard', 2.1, 2.24, 0.066, 0, 0, -0.095, materials.pcb, 0.028);
  box('BatteryFoil', 1.55, 1.53, 0.105, 0, -0.07, -0.18, materials.battery, 0.045);
  box('BatteryLabel', 1.20, 0.92, 0.006, 0, -0.04, -0.239, materials.chip, 0);
  for (let i = 0; i < 4; i++) box('BatteryLabelRule', 0.6 - i * 0.07, 0.026, 0.003, -0.14, 0.15 - i * 0.10, -0.244, materials.white, 0);
  frame('ClearCaseRim', 2.2, 2.35, 0.075, 0.40, 0.115, 0, 0, -0.205, materials.acrylicEdge);
  frame('FrontAcrylicOutline', 2.16, 2.3, 0.026, 0.025, 0.1, 0, 0, 0.202, materials.silver);
  frame('BoardSilkscreenPerimeter', 1.99, 2.11, 0.014, 0.006, 0.06, 0, -0.01, 0.116, materials.white);
  box('DisplayBacking', 1.88, 1.62, 0.135, 0, -0.035, 0.058, materials.chip, 0.025);
  frame('DisplayMetalBezel', 1.86, 1.61, 0.026, 0.032, 0.025, 0, -0.035, 0.139, materials.darkMetal);
  frame('DisplayFineBorder', 1.79, 1.54, 0.011, 0.006, 0.012, 0, -0.035, 0.176, materials.white);
  box('OLEDGlass', 1.745, 1.495, 0.047, 0, -0.035, 0.208, materials.display, 0.014);
  // The OLED has a barely visible inactive strip at its bottom.
  box('DisplayInactiveEdge', 1.52, 0.08, 0.004, 0, -0.702, 0.235, materials.chip, 0);
  box('DisplayFlex', 0.59, 0.255, 0.015, 0, -0.975, 0.14, materials.gold, 0.003);
  box('DisplayFlexCentre', 0.29, 0.24, 0.025, 0, -0.975, 0.16, materials.chip, 0.002);
  for (const x of [-0.234, 0.234]) {
    for (let j = 0; j < 6; j++) box('FlexContact', 0.054, 0.013, 0.003, x, -0.88 - j * 0.035, 0.151, materials.copper, 0);
  }
  box('BottomConnector', 0.86, 0.077, 0.08, 0, -1.099, 0.06, materials.white, 0.012);

  // Four physical standoffs with slotted screw heads; top hardware is brass.
  for (const x of [-0.86, 0.86]) for (const y of [-0.98, 0.91]) {
    const screwMaterial = y > 0 ? materials.gold : materials.silver;
    const shaft = addMesh(new THREE.CylinderGeometry(0.062, 0.062, 0.38, 12), materials.silver, 'Standoff');
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(x, y, -0.005);
    const washer = addMesh(new THREE.CylinderGeometry(0.118, 0.118, 0.018, 20), screwMaterial, 'ScrewWasher');
    washer.rotation.x = Math.PI / 2;
    washer.position.set(x, y, 0.214);
    const cap = addMesh(new THREE.CylinderGeometry(0.084, 0.098, 0.052, 6), screwMaterial, 'HexScrew');
    cap.rotation.x = Math.PI / 2;
    cap.position.set(x, y, 0.246);
    const slot = box('ScrewSlot', 0.105, 0.018, 0.003, x, y, 0.274, materials.darkMetal, 0.001);
    slot.rotation.z = x * 0.4;
    box('MountSilkscreen', 0.24, 0.012, 0.007, x, y - 0.139, 0.124, materials.white, 0);
  }

  box('HeaderPCB', 2.02, 0.48, 0.075, 0, 0.96, -0.005, materials.pcbBack, 0.017);
  box('AmberHeaderCover', 2.08, 0.45, 0.115, 0, 0.98, 0.113, materials.amber, 0.025);
  for (let i = 0; i < 4; i++) {
    const x = -0.27 + i * 0.18;
    box('HeaderSocket', 0.135, 0.115, 0.07, x, 0.83, 0.20, materials.gold, 0.002);
    box('HeaderSocketHole', 0.063, 0.043, 0.008, x, 0.83, 0.24, materials.darkMetal, 0);
    box('HeaderSocketTrace', 0.018, 0.105, 0.007, x, 0.955, 0.16, materials.gold, 0);
    box('HeaderLegend', 0.07, 0.013, 0.003, x, 0.735, 0.16, materials.white, 0);
  }
  box('HeaderController', 0.33, 0.23, 0.052, -0.58, 1.10, 0.06, materials.chip, 0.008);
  box('HeaderCapacitor', 0.2, 0.08, 0.066, 0.59, 1.10, 0.04, materials.ceramic, 0.008);
  tube('RedPowerWire', [[-0.88, 1.02, -0.08], [-0.96, 1.40, -0.04], [-0.70, 1.49, -0.015], [-0.28, 1.33, 0.03], [-0.12, 1.10, 0.03]], 0.047, materials.red);
  tube('GreenPowerWire', [[0.31, 1.10, -0.055], [0.20, 1.47, -0.03], [0.27, 1.62, -0.06], [0.46, 1.53, -0.08], [0.52, 1.16, -0.08]], 0.043, materials.tealWire);
  tube('BlackPowerWire', [[-0.32, 1.16, -0.12], [-0.19, 1.44, -0.13], [0.035, 1.52, -0.11], [0.12, 1.13, -0.08]], 0.034, materials.blackWire);
  box('TopRingAnchor', 0.34, 0.155, 0.08, 0.02, 1.24, -0.105, materials.darkMetal, 0.022);

  // Back components, solder pads and routed traces make orbiting meaningful.
  box('BackMicrocontroller', 0.53, 0.48, 0.075, 0.54, 0.73, -0.158, materials.chip, 0.006);
  for (let i = 0; i < 8; i++) for (const side of [-1, 1]) {
    box('ChipPin', 0.12, 0.025, 0.024, 0.54 + side * 0.298, 0.55 + i * 0.052, -0.146, materials.silver, 0);
  }
  for (let i = 0; i < 11; i++) {
    const x = -0.91 + i * 0.18;
    const pad = addMesh(new THREE.CylinderGeometry(0.032, 0.032, 0.008, 10), materials.gold, 'BackGoldTestPad');
    pad.rotation.x = Math.PI / 2;
    pad.position.set(x, -1.025, -0.135);
    box('BackTrace', 0.013, 0.14 + (i % 3) * 0.09, 0.005, x, -0.83, -0.133, materials.copper, 0);
  }
  for (let i = 0; i < 6; i++) {
    box('MiniCapacitor', 0.082, 0.035, 0.052, -0.82 + i * 0.14, 0.88, -0.137, materials.ceramic, 0.006);
    box('CapacitorSolder', 0.017, 0.048, 0.061, -0.865 + i * 0.14, 0.88, -0.137, materials.silver, 0.001);
  }
  box('SidePowerSwitch', 0.105, 0.28, 0.14, 1.084, 0.30, -0.02, materials.darkMetal, 0.014);
  box('PowerSwitchSlider', 0.022, 0.112, 0.12, 1.145, 0.35, -0.02, materials.chip, 0.005);
  box('USBMetalHousing', 0.43, 0.14, 0.25, 0, -1.145, -0.036, materials.silver, 0.025);
  box('USBPortDark', 0.32, 0.006, 0.14, 0, -1.22, -0.036, materials.chip, 0.002);

  // Double winding split ring and long, asymmetrical spring-gate carabiner.
  for (let layer = 0; layer < 2; layer++) {
    const pts = [];
    for (let i = 0; i <= 68; i++) {
      const angle = -Math.PI / 2 + i / 68 * Math.PI * 1.96;
      pts.push([0.035 + Math.cos(angle) * 0.285, 1.94 + Math.sin(angle) * 0.565, -0.105 + layer * 0.052 + Math.cos(angle) * 0.047]);
    }
    tube('SplitKeyRing', pts, 0.026, materials.silver, hardware, 88);
  }
  tube('CarabinerSpine', [[0.018, 2.35, -0.086], [-0.20, 2.41, -0.086], [-0.30, 2.71, -0.086], [-0.73, 3.85, -0.086], [-0.71, 4.11, -0.086], [-0.53, 4.32, -0.086], [-0.37, 4.39, -0.086]], 0.049, materials.silver, hardware, 50);
  tube('CarabinerLowerHook', [[0.018, 2.35, -0.086], [0.17, 2.50, -0.086], [0.145, 2.67, -0.086], [0.032, 2.80, -0.086]], 0.049, materials.silver, hardware, 22);
  rod('CarabinerSpringGate', [0.034, 2.79, -0.086], [-0.205, 4.18, -0.086], 0.032, materials.silver);
  rod('CarabinerGateTop', [-0.205, 4.18, -0.086], [-0.276, 4.315, -0.086], 0.044, materials.darkMetal);
  rod('CarabinerGateCollar', [0.029, 2.82, -0.086], [0.011, 2.95, -0.086], 0.052, materials.silver);
  const hinge = addMesh(new THREE.CylinderGeometry(0.031, 0.031, 0.108, 14), materials.darkMetal, 'CarabinerHinge');
  hinge.rotation.x = Math.PI / 2;
  hinge.position.set(0.025, 2.858, -0.078);

  // Face geometry sits just above the black glass. The split colours reproduce
  // the two-colour OLED; unlike a canvas texture these also export to GLB.
  const face = new THREE.Group();
  face.name = 'Face';
  face.position.set(0, 0.19, 0.236);
  root.add(face);
  const eyeWidth = 0.292, eyeHeight = 0.465, split = 0.072;
  function eye(name, x) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(x, 0.053, 0.003);
    face.add(group);
    const r = 0.128, l = -eyeWidth / 2, rr = eyeWidth / 2, bottom = -eyeHeight / 2, top = eyeHeight / 2;
    const lower = new THREE.Shape();
    lower.moveTo(l, split); lower.lineTo(l, bottom + r);
    lower.quadraticCurveTo(l, bottom, l + r, bottom);
    lower.lineTo(rr - r, bottom); lower.quadraticCurveTo(rr, bottom, rr, bottom + r);
    lower.lineTo(rr, split); lower.closePath();
    const upper = new THREE.Shape();
    upper.moveTo(l, split); upper.lineTo(rr, split); upper.lineTo(rr, top - r);
    upper.quadraticCurveTo(rr, top, rr - r, top); upper.lineTo(l + r, top);
    upper.quadraticCurveTo(l, top, l, top - r); upper.closePath();
    addMesh(new THREE.ShapeGeometry(lower, 12), materials.cyan, `${name}Cyan`, group);
    addMesh(new THREE.ShapeGeometry(upper, 12), materials.lime, `${name}Yellow`, group);
    return group;
  }
  const leftEye = eye('EyeLeft', -0.306);
  const rightEye = eye('EyeRight', 0.306);
  function faceMesh(name, shape, material, x, y) {
    const mesh = addMesh(new THREE.ShapeGeometry(shape, 14), material, name, face);
    mesh.name = name;
    mesh.position.set(x, y, 0.006);
    mesh.castShadow = false;
    return mesh;
  }
  const mouth = faceMesh('MouthBar', roundedShape(0.196, 0.067, 0.032), materials.cyan, 0, -0.176);
  const smile = new THREE.Shape();
  smile.moveTo(-0.129, 0.035); smile.quadraticCurveTo(0, -0.05, 0.129, 0.035);
  smile.lineTo(0.111, -0.029); smile.quadraticCurveTo(0, -0.122, -0.111, -0.029); smile.closePath();
  const mouthSmile = faceMesh('MouthSmile', smile, materials.cyan, 0, -0.137);
  mouthSmile.scale.setScalar(0.001);
  const sleepyMouth = faceMesh('MouthSleep', roundedShape(0.064, 0.095, 0.03), materials.cyan, 0, -0.19);
  sleepyMouth.scale.setScalar(0.001);
  function heartShape() {
    const s = new THREE.Shape();
    s.moveTo(0, -0.19);
    s.bezierCurveTo(-0.035, -0.115, -0.204, -0.004, -0.176, 0.099);
    s.bezierCurveTo(-0.15, 0.213, -0.04, 0.214, 0, 0.119);
    s.bezierCurveTo(0.04, 0.214, 0.15, 0.213, 0.176, 0.099);
    s.bezierCurveTo(0.204, -0.004, 0.035, -0.115, 0, -0.19);
    return s;
  }
  const heartLeft = faceMesh('HeartLeft', heartShape(), materials.cyan, -0.306, 0.053);
  const heartRight = faceMesh('HeartRight', heartShape(), materials.cyan, 0.306, 0.053);
  heartLeft.scale.setScalar(0.001); heartRight.scale.setScalar(0.001);
  function dizzyEye(name, x) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(x, 0.053, 0.007);
    face.add(group);
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const a = i / 64 * Math.PI * 3.8, r = 0.02 + i / 64 * 0.145;
      points.push([Math.cos(a) * r, Math.sin(a) * r, 0]);
    }
    tube(`${name}Spiral`, points, 0.021, materials.cyan, group, 64);
    group.scale.setScalar(0.001);
    return group;
  }
  const spiralLeft = dizzyEye('SpiralLeft', -0.306), spiralRight = dizzyEye('SpiralRight', 0.306);

  // Extra expression shapes keep the new emotions legible at keychain scale.
  // Hidden shapes are scaled down rather than toggled so their state exports.
  const browLeft = faceMesh('BrowLeft', roundedShape(0.30, 0.043, 0.021), materials.lime, -0.306, 0.337);
  const browRight = faceMesh('BrowRight', roundedShape(0.30, 0.043, 0.021), materials.lime, 0.306, 0.337);
  const mouthFrown = faceMesh('MouthFrown', smile, materials.cyan, 0, -0.26);
  mouthFrown.rotation.z = Math.PI;
  const grimace = new THREE.Shape();
  grimace.moveTo(-0.135, 0.022); grimace.lineTo(-0.045, -0.011); grimace.lineTo(0.045, 0.022); grimace.lineTo(0.135, -0.011);
  grimace.lineTo(0.135, -0.046); grimace.lineTo(0.045, -0.013); grimace.lineTo(-0.045, -0.046); grimace.lineTo(-0.135, -0.013); grimace.closePath();
  const mouthGrimace = faceMesh('MouthGrimace', grimace, materials.cyan, 0, -0.215);
  function ovalRing(w, h, thickness) {
    const shape = new THREE.Shape();
    shape.absellipse(0, 0, w / 2, h / 2, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absellipse(0, 0, w / 2 - thickness, h / 2 - thickness, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return shape;
  }
  const mouthRound = faceMesh('MouthRound', ovalRing(0.154, 0.202, 0.041), materials.cyan, 0, -0.251);
  const roundLeft = faceMesh('RoundLeft', ovalRing(0.31, 0.415, 0.077), materials.cyan, -0.306, 0.062);
  const roundRight = faceMesh('RoundRight', ovalRing(0.31, 0.415, 0.077), materials.cyan, 0.306, 0.062);
  const droplet = new THREE.Shape();
  droplet.moveTo(0, 0.10);
  droplet.bezierCurveTo(-0.026, 0.057, -0.081, -0.003, -0.054, -0.052);
  droplet.bezierCurveTo(-0.026, -0.096, 0.05, -0.075, 0.06, -0.024);
  droplet.bezierCurveTo(0.063, 0.012, 0.016, 0.071, 0, 0.10);
  const tear = faceMesh('Tear', droplet, materials.cyan, -0.422, -0.152);
  const sweat = faceMesh('Sweat', droplet, materials.lime, 0.555, 0.24);
  function faceGroup(name, x, y) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(x, y, 0.009);
    face.add(group);
    return group;
  }
  function cheek(name, x) {
    const group = faceGroup(name, x, -0.173);
    for (let i = -1; i <= 1; i++) {
      const stripe = addMesh(new THREE.ShapeGeometry(roundedShape(0.018, 0.09, 0.009)), materials.lime, `${name}Stripe`, group);
      stripe.position.x = i * 0.04;
      stripe.rotation.z = -0.24;
    }
    return group;
  }
  const cheekLeft = cheek('CheekLeft', -0.475), cheekRight = cheek('CheekRight', 0.475);
  const questionMark = faceGroup('QuestionMark', 0.60, 0.22);
  tube('QuestionHook', [[-0.06, 0.081, 0], [-0.048, 0.121, 0], [0.016, 0.134, 0], [0.059, 0.09, 0], [0.024, 0.04, 0], [0, 0.003, 0]], 0.017, materials.lime, questionMark, 20);
  const questionDot = addMesh(new THREE.CircleGeometry(0.018, 12), materials.lime, 'QuestionDot', questionMark);
  questionDot.position.y = -0.054;
  function squeezeEye(name, x, sign) {
    const group = faceGroup(name, x, 0.045);
    tube(`${name}Chevron`, [[-sign * 0.125, 0.117, 0], [sign * 0.084, 0, 0], [-sign * 0.125, -0.117, 0]], 0.034, materials.cyan, group, 18);
    return group;
  }
  const squeezeLeft = squeezeEye('SqueezeLeft', -0.306, 1), squeezeRight = squeezeEye('SqueezeRight', 0.306, -1);
  const laughShape = new THREE.Shape();
  laughShape.moveTo(-0.175, 0.077); laughShape.lineTo(0.175, 0.077);
  laughShape.bezierCurveTo(0.175, -0.208, -0.175, -0.208, -0.175, 0.077);
  const laughHole = new THREE.Path();
  laughHole.moveTo(-0.127, 0.029); laughHole.bezierCurveTo(-0.12, -0.127, 0.12, -0.127, 0.127, 0.029); laughHole.closePath();
  laughShape.holes.push(laughHole);
  const mouthLaugh = faceMesh('MouthLaugh', laughShape, materials.cyan, 0, -0.213);
  const focusReticle = faceGroup('FocusReticle', 0, 0.035);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    tube('FocusCorner', [[sx * 0.46, sy * 0.30, 0], [sx * 0.60, sy * 0.30, 0], [sx * 0.60, sy * 0.19, 0]], 0.012, materials.lime, focusReticle, 8);
  }
  const focusScan = faceMesh('FocusScan', roundedShape(1.08, 0.013, 0.006), materials.cyan, 0, 0.21);
  const extras = [browLeft, browRight, mouthFrown, mouthGrimace, mouthRound, roundLeft, roundRight, tear, sweat, cheekLeft, cheekRight, questionMark, squeezeLeft, squeezeRight, mouthLaugh, focusReticle, focusScan];
  extras.forEach(node => node.scale.setScalar(0.001));

  // All clips key the same transforms, including hidden alternate eye/mouth
  // meshes. Switching or cross-fading clips cannot leave stale expressions.
  const animated = [face, leftEye, rightEye, mouth, mouthSmile, sleepyMouth, heartLeft, heartRight, spiralLeft, spiralRight, ...extras];
  const defaults = new Map(animated.map(node => [node.name, { position: node.position.toArray(), quaternion: node.quaternion.toArray(), scale: node.scale.toArray() }]));
  const vec = (x, y = x, z = 1) => [x, y, z];
  const qz = angle => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle).toArray();
  const hidden = [0.001, 0.001, 0.001];
  const channel = (times, values) => ({ times, values });
  function clip(name, duration, overrides = {}) {
    const tracks = [];
    for (const node of animated) for (const property of ['position', 'quaternion', 'scale']) {
      const key = `${node.name}.${property}`;
      const data = overrides[key] || channel([0, duration], [defaults.get(node.name)[property], defaults.get(node.name)[property]]);
      const Track = property === 'quaternion' ? THREE.QuaternionKeyframeTrack : THREE.VectorKeyframeTrack;
      tracks.push(new Track(key, data.times, data.values.flat()));
    }
    return new THREE.AnimationClip(name, duration, tracks);
  }
  const facePositions = coords => coords.map(([x, y]) => [x, 0.19 + y, 0.236]);
  const eyesScale = (times, heights, widths = 1) => channel(times, heights.map((h, i) => vec(Array.isArray(widths) ? widths[i] : widths, h)));
  const constant = (duration, v) => channel([0, duration], [v, v]);
  const clips = [];
  const idleT = [0, 0.9, 1.48, 1.56, 1.65, 2.15, 2.65, 3.2, 3.65, 4.2, 4.55, 5.15, 5.9, 6.5, 6.58, 6.69, 7.35, 8];
  clips.push(clip('idle', 8, {
    'EyeLeft.scale': eyesScale(idleT, [1, 1, 1, 0.09, 1, 0.83, 1.09, 1, 0.94, 0.97, 1, 1, 1, 1, 0.09, 1, 1, 1]),
    'EyeRight.scale': eyesScale(idleT, [1, 1, 1, 0.09, 1, 0.83, 0.93, 1, 1.1, 0.97, 1, 1, 1, 1, 0.09, 1, 1, 1]),
    'Face.position': channel([0, 1.8, 2.4, 3.1, 3.8, 4.3, 4.8, 6.4, 7.1, 8], facePositions([[0, 0], [0, 0], [-0.125, 0.024], [-0.125, 0.024], [0.13, 0.036], [0.1, 0.036], [0, 0], [0, 0], [-0.045, 0.01], [0, 0]])),
    'Face.quaternion': channel([0, 1.8, 2.5, 3.25, 3.8, 4.4, 5, 8], [0, 0, -0.15, -0.15, 0.18, 0.06, 0, 0].map(qz)),
    'MouthBar.scale': channel([0, 2.1, 2.7, 4.2, 4.8, 8], [vec(1), vec(1), vec(0.72, 0.9), vec(0.72, 0.9), vec(1), vec(1)]),
  }));
  const blinkT = [0, 0.50, 0.60, 0.69, 0.92, 1.02, 1.12, 2.4];
  clips.push(clip('blink', 2.4, {
    'EyeLeft.scale': eyesScale(blinkT, [1, 1, 0.085, 1, 1, 0.085, 1, 1], [1, 1, 1.05, 1, 1, 1.05, 1, 1]),
    'EyeRight.scale': eyesScale(blinkT, [1, 1, 1, 1, 1, 1, 1, 1]),
  }));
  clips.push(clip('happy', 3.2, {
    'EyeLeft.scale': eyesScale([0, 0.4, 1.0, 1.25, 1.5, 2.0, 2.5, 3.2], [0.72, 0.58, 0.58, 0.19, 0.58, 0.72, 0.58, 0.72], 1.12),
    'EyeRight.scale': eyesScale([0, 0.4, 1.0, 1.25, 1.5, 2.0, 2.5, 3.2], [0.72, 0.58, 0.58, 0.19, 0.58, 0.72, 0.58, 0.72], 1.12),
    'MouthBar.scale': constant(3.2, hidden),
    'MouthSmile.scale': channel([0, 0.6, 1.2, 1.8, 2.6, 3.2], [vec(1), vec(1.2), vec(1), vec(1.2), vec(1.05), vec(1)]),
    'Face.position': channel([0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2], facePositions([[0, 0], [0, 0.043], [0, 0], [0, 0.06], [0, 0], [0, 0.043], [0, 0], [0, 0.043], [0, 0]])),
    'Face.quaternion': channel([0, 0.8, 1.6, 2.4, 3.2], [0, -0.055, 0.055, -0.055, 0].map(qz)),
  }));
  clips.push(clip('curious', 4, {
    'Face.quaternion': channel([0, 0.7, 1.4, 2.1, 3.1, 4], [0.0, -0.24, -0.24, 0.22, 0.22, 0].map(qz)),
    'Face.position': channel([0, 0.7, 1.4, 2.1, 3.1, 4], facePositions([[0, 0], [-0.10, 0.025], [-0.10, 0.025], [0.10, 0.035], [0.10, 0.035], [0, 0]])),
    'EyeLeft.scale': eyesScale([0, 0.7, 1.4, 2.1, 3.1, 4], [1, 0.70, 0.70, 1.1, 1.1, 1]),
    'EyeRight.scale': eyesScale([0, 0.7, 1.4, 2.1, 3.1, 4], [1, 1.1, 1.1, 0.70, 0.70, 1]),
    'MouthBar.scale': constant(4, vec(0.64, 0.9)),
  }));
  clips.push(clip('sleepy', 4, {
    'EyeLeft.scale': eyesScale([0, 1.1, 1.8, 2.1, 2.9, 3.5, 4], [0.38, 0.29, 0.08, 0.08, 0.25, 0.43, 0.38]),
    'EyeRight.scale': eyesScale([0, 1.1, 1.8, 2.1, 2.9, 3.5, 4], [0.38, 0.29, 0.08, 0.08, 0.25, 0.43, 0.38]),
    'Face.position': channel([0, 1.5, 2.5, 3.5, 4], facePositions([[0, -0.025], [0, -0.09], [0, -0.09], [0, -0.015], [0, -0.025]])),
    'Face.quaternion': channel([0, 1.5, 2.5, 3.5, 4], [-0.03, -0.09, -0.09, -0.02, -0.03].map(qz)),
    'MouthBar.scale': constant(4, hidden),
    'MouthSleep.scale': channel([0, 1.4, 2.1, 2.8, 4], [vec(0.6, 0.8), vec(1, 1.25), vec(1.35, 1.6), vec(0.7, 1), vec(0.6, 0.8)]),
  }));
  const loveT = [0, 0.35, 0.6, 0.83, 1.4, 1.75, 2.0, 2.23, 2.8];
  const heartPulse = channel(loveT, [0.93, 1.13, 1, 1.1, 0.93, 1.13, 1, 1.1, 0.93].map(s => vec(s)));
  clips.push(clip('love', 2.8, {
    'EyeLeft.scale': constant(2.8, hidden), 'EyeRight.scale': constant(2.8, hidden),
    'HeartLeft.scale': heartPulse, 'HeartRight.scale': heartPulse,
    'MouthBar.scale': constant(2.8, hidden), 'MouthSmile.scale': constant(2.8, vec(1)),
    'Face.quaternion': channel([0, 0.7, 1.4, 2.1, 2.8], [0, -0.08, 0, 0.08, 0].map(qz)),
  }));
  clips.push(clip('dizzy', 3.6, {
    'EyeLeft.scale': constant(3.6, hidden), 'EyeRight.scale': constant(3.6, hidden),
    'SpiralLeft.scale': constant(3.6, vec(1)), 'SpiralRight.scale': constant(3.6, vec(1)),
    'SpiralLeft.quaternion': channel([0, 0.9, 1.8, 2.7, 3.6], [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI * 2].map(qz)),
    'SpiralRight.quaternion': channel([0, 0.9, 1.8, 2.7, 3.6], [0, -Math.PI / 2, -Math.PI, -Math.PI * 1.5, -Math.PI * 2].map(qz)),
    'Face.quaternion': channel([0, 0.9, 1.8, 2.7, 3.6], [0, 0.15, 0, -0.15, 0].map(qz)),
    'MouthBar.scale': constant(3.6, vec(0.62, 1.25)),
  }));
  clips.push(clip('excited', 2.4, {
    'EyeLeft.scale': eyesScale([0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4], [1.06, 1.18, 0.83, 1.18, 1.06, 1.18, 0.83, 1.18, 1.06], 1.12),
    'EyeRight.scale': eyesScale([0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4], [1.06, 1.18, 0.83, 1.18, 1.06, 1.18, 0.83, 1.18, 1.06], 1.12),
    'MouthBar.scale': constant(2.4, hidden),
    'MouthSmile.scale': channel([0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4], [1, 1.25, 1, 1.25, 1, 1.25, 1, 1.25, 1].map(s => vec(s))),
    'Face.position': channel([0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4], facePositions([[0, 0], [-0.04, 0.065], [0, 0], [0.04, 0.065], [0, 0], [-0.04, 0.065], [0, 0], [0.04, 0.065], [0, 0]])),
    'Face.quaternion': channel([0, 0.6, 1.2, 1.8, 2.4], [0, -0.075, 0, 0.075, 0].map(qz)),
  }));
  clips.push(clip('angry', 3.2, {
    'EyeLeft.scale': constant(3.2, vec(1.10, 0.48)), 'EyeRight.scale': constant(3.2, vec(1.10, 0.48)),
    'EyeLeft.quaternion': constant(3.2, qz(-0.29)), 'EyeRight.quaternion': constant(3.2, qz(0.29)),
    'BrowLeft.scale': constant(3.2, vec(1.14)), 'BrowRight.scale': constant(3.2, vec(1.14)),
    'BrowLeft.quaternion': constant(3.2, qz(-0.42)), 'BrowRight.quaternion': constant(3.2, qz(0.42)),
    'BrowLeft.position': constant(3.2, [-0.306, 0.224, 0.006]), 'BrowRight.position': constant(3.2, [0.306, 0.224, 0.006]),
    'MouthBar.scale': constant(3.2, hidden), 'MouthGrimace.scale': constant(3.2, vec(1.12)),
    'Face.position': channel([0, 0.55, 0.63, 0.71, 0.79, 0.87, 1.45, 2.0, 2.08, 2.16, 2.24, 2.32, 3.2], facePositions([[0, 0], [0, 0], [-0.027, 0.007], [0.027, -0.007], [-0.027, 0.007], [0, 0], [0, 0], [0, 0], [-0.027, 0.007], [0.027, -0.007], [-0.027, 0.007], [0, 0], [0, 0]])),
  }));
  clips.push(clip('sad', 4, {
    'EyeLeft.scale': constant(4, vec(0.94, 0.58)), 'EyeRight.scale': constant(4, vec(0.94, 0.58)),
    'EyeLeft.quaternion': constant(4, qz(0.19)), 'EyeRight.quaternion': constant(4, qz(-0.19)),
    'BrowLeft.scale': constant(4, vec(0.92)), 'BrowRight.scale': constant(4, vec(0.92)),
    'BrowLeft.quaternion': constant(4, qz(0.34)), 'BrowRight.quaternion': constant(4, qz(-0.34)),
    'BrowLeft.position': constant(4, [-0.306, 0.26, 0.006]), 'BrowRight.position': constant(4, [0.306, 0.26, 0.006]),
    'MouthBar.scale': constant(4, hidden), 'MouthFrown.scale': constant(4, vec(1.06)),
    'Tear.scale': channel([0, 0.35, 0.7, 1.9, 2.12, 2.3, 2.6, 3.6, 3.8, 4], [hidden, hidden, vec(0.9), vec(0.9), hidden, hidden, vec(0.9), vec(0.9), hidden, hidden]),
    'Tear.position': channel([0, 0.35, 1.9, 2.12, 2.3, 3.6, 3.8, 4], [[-0.422, -0.095, 0.006], [-0.422, -0.095, 0.006], [-0.422, -0.44, 0.006], [-0.422, -0.45, 0.006], [-0.422, -0.095, 0.006], [-0.422, -0.44, 0.006], [-0.422, -0.45, 0.006], [-0.422, -0.095, 0.006]]),
    'Face.position': channel([0, 1.8, 3, 4], facePositions([[0, -0.02], [0, -0.065], [0, -0.045], [0, -0.02]])),
    'Face.quaternion': channel([0, 1.8, 3, 4], [-0.025, -0.055, -0.035, -0.025].map(qz)),
  }));
  clips.push(clip('surprised', 2.8, {
    'EyeLeft.scale': constant(2.8, hidden), 'EyeRight.scale': constant(2.8, hidden),
    'RoundLeft.scale': channel([0, 0.22, 0.65, 1.7, 2.15, 2.8], [vec(0.9), vec(1.18), vec(1), vec(1), vec(1.1), vec(0.9)]),
    'RoundRight.scale': channel([0, 0.22, 0.65, 1.7, 2.15, 2.8], [vec(0.9), vec(1.18), vec(1), vec(1), vec(1.1), vec(0.9)]),
    'BrowLeft.scale': constant(2.8, vec(0.74)), 'BrowRight.scale': constant(2.8, vec(0.74)),
    'BrowLeft.position': constant(2.8, [-0.306, 0.369, 0.006]), 'BrowRight.position': constant(2.8, [0.306, 0.369, 0.006]),
    'MouthBar.scale': constant(2.8, hidden),
    'MouthRound.scale': channel([0, 0.22, 0.65, 1.7, 2.15, 2.8], [vec(0.7), vec(1.23), vec(1), vec(1), vec(1.18), vec(0.7)]),
    'Face.position': channel([0, 0.22, 0.65, 1.7, 2.15, 2.8], facePositions([[0, 0], [0, 0.035], [0, 0], [0, 0], [0, 0.018], [0, 0]])),
  }));
  clips.push(clip('shy', 4.2, {
    'EyeLeft.scale': eyesScale([0, 0.7, 1.5, 2.2, 2.8, 3.4, 4.2], [0.42, 0.23, 0.23, 0.59, 0.23, 0.42, 0.42], 0.84),
    'EyeRight.scale': eyesScale([0, 0.7, 1.5, 2.2, 2.8, 3.4, 4.2], [0.42, 0.23, 0.23, 0.23, 0.23, 0.42, 0.42], 0.84),
    'CheekLeft.scale': channel([0, 0.7, 1.5, 2.2, 3.4, 4.2], [vec(0.72), vec(1.14), vec(1.02), vec(1.2), vec(0.9), vec(0.72)]),
    'CheekRight.scale': channel([0, 0.7, 1.5, 2.2, 3.4, 4.2], [vec(0.72), vec(1.14), vec(1.02), vec(1.2), vec(0.9), vec(0.72)]),
    'MouthBar.scale': constant(4.2, hidden), 'MouthSmile.scale': constant(4.2, vec(0.67)),
    'Face.position': channel([0, 0.8, 1.6, 2.3, 3.4, 4.2], facePositions([[0.035, -0.01], [0.095, -0.055], [0.095, -0.055], [0.045, -0.025], [-0.015, -0.025], [0.035, -0.01]])),
    'Face.quaternion': channel([0, 0.8, 1.6, 2.3, 3.4, 4.2], [-0.06, -0.17, -0.17, -0.10, 0.02, -0.06].map(qz)),
  }));
  const scaredT = [0, 0.15, 0.30, 0.45, 0.60, 0.75, 0.90, 1.05, 1.20, 1.35, 1.50, 1.65, 1.80, 1.95, 2.10, 2.25, 2.40, 2.55, 2.70, 2.85, 3];
  clips.push(clip('scared', 3, {
    'EyeLeft.scale': constant(3, hidden), 'EyeRight.scale': constant(3, hidden),
    'RoundLeft.scale': constant(3, vec(0.86, 1.15)), 'RoundRight.scale': constant(3, vec(0.86, 1.15)),
    'BrowLeft.scale': constant(3, vec(0.8)), 'BrowRight.scale': constant(3, vec(0.8)),
    'BrowLeft.quaternion': constant(3, qz(0.42)), 'BrowRight.quaternion': constant(3, qz(-0.42)),
    'MouthBar.scale': constant(3, hidden), 'MouthRound.scale': constant(3, vec(0.9, 1.44)),
    'Sweat.scale': channel([0, 0.4, 1.3, 1.7, 2.0, 2.6, 3], [vec(0.75), vec(1), vec(1), hidden, hidden, vec(1), vec(0.75)]),
    'Sweat.position': channel([0, 0.4, 1.3, 1.7, 2.0, 2.6, 3], [[0.555, 0.24, 0.006], [0.555, 0.24, 0.006], [0.56, 0.03, 0.006], [0.56, -0.10, 0.006], [0.555, 0.28, 0.006], [0.555, 0.27, 0.006], [0.555, 0.24, 0.006]]),
    'Face.position': channel(scaredT, facePositions(scaredT.map((_, i) => [i === 0 || i === scaredT.length - 1 ? 0 : (i % 2 ? 0.022 : -0.022), -0.026]))),
  }));
  clips.push(clip('confused', 4, {
    'EyeLeft.scale': eyesScale([0, 0.8, 1.6, 2.4, 3.2, 4], [0.48, 0.40, 0.40, 1.05, 1.05, 0.48], [1.12, 1.12, 1.12, 0.92, 0.92, 1.12]),
    'EyeRight.scale': eyesScale([0, 0.8, 1.6, 2.4, 3.2, 4], [1.05, 1.05, 1.05, 0.40, 0.40, 1.05], [0.92, 0.92, 0.92, 1.12, 1.12, 0.92]),
    'MouthBar.scale': constant(4, hidden), 'MouthGrimace.scale': constant(4, vec(0.78)),
    'MouthGrimace.quaternion': channel([0, 1.2, 2.8, 4], [-0.14, -0.14, 0.14, -0.14].map(qz)),
    'QuestionMark.scale': channel([0, 0.4, 1.4, 2, 2.6, 3.5, 4], [vec(0.72), vec(1.14), vec(1), vec(0.85), vec(1.14), vec(1), vec(0.72)]),
    'Face.quaternion': channel([0, 0.8, 1.6, 2.4, 3.2, 4], [-0.13, -0.20, -0.20, 0.14, 0.14, -0.13].map(qz)),
  }));
  const laughT = [0, 0.22, 0.44, 0.66, 0.88, 1.10, 1.32, 1.54, 1.76, 1.98, 2.2, 2.6];
  clips.push(clip('laugh', 2.6, {
    'EyeLeft.scale': constant(2.6, hidden), 'EyeRight.scale': constant(2.6, hidden),
    'SqueezeLeft.scale': constant(2.6, vec(1)), 'SqueezeRight.scale': constant(2.6, vec(1)),
    'MouthBar.scale': constant(2.6, hidden),
    'MouthLaugh.scale': channel(laughT, laughT.map((_, i) => { const pulse = i === laughT.length - 1 ? 0 : i % 2; return vec(1 + pulse * 0.12, 0.88 + pulse * 0.36); })),
    'Face.position': channel(laughT, facePositions(laughT.map((_, i) => [0, i === laughT.length - 1 ? 0 : (i % 2) * 0.045]))),
    'Face.quaternion': channel([0, 0.65, 1.3, 1.95, 2.6], [0.035, -0.08, 0.08, -0.065, 0.035].map(qz)),
  }));
  clips.push(clip('focused', 4, {
    'EyeLeft.scale': constant(4, vec(0.90, 0.34)), 'EyeRight.scale': constant(4, vec(0.90, 0.34)),
    'EyeLeft.position': channel([0, 0.8, 1.6, 2.6, 3.2, 4], [[-0.306, 0.053, 0.003], [-0.40, 0.053, 0.003], [-0.40, 0.053, 0.003], [-0.212, 0.053, 0.003], [-0.212, 0.053, 0.003], [-0.306, 0.053, 0.003]]),
    'EyeRight.position': channel([0, 0.8, 1.6, 2.6, 3.2, 4], [[0.306, 0.053, 0.003], [0.212, 0.053, 0.003], [0.212, 0.053, 0.003], [0.40, 0.053, 0.003], [0.40, 0.053, 0.003], [0.306, 0.053, 0.003]]),
    'MouthBar.scale': constant(4, vec(0.70, 0.55)),
    'FocusReticle.scale': constant(4, vec(1)),
    'FocusScan.scale': channel([0, 0.16, 1.8, 2, 2.16, 3.8, 4], [hidden, vec(1), vec(1), hidden, vec(1), vec(1), hidden]),
    'FocusScan.position': channel([0, 1.8, 2, 3.8, 4], [[0, 0.27, 0.009], [0, -0.225, 0.009], [0, -0.225, 0.009], [0, 0.27, 0.009], [0, 0.27, 0.009]]),
  }));
  root.userData = {
    title: 'Pequeñito — compañero OLED',
    reference: 'Recreation based on the supplied short video; inferred rear construction.',
    units: 'Body width 2.2 scene units. Front faces +Z.',
    animationNames: clips.map(c => c.name),
  };
  root.animations = clips;
  return { root, clips, faceParts: { face, leftEye, rightEye, mouth, mouthSmile, sleepyMouth, heartLeft, heartRight, spiralLeft, spiralRight, browLeft, browRight, mouthFrown, mouthGrimace, mouthRound, roundLeft, roundRight, tear, sweat, cheekLeft, cheekRight, questionMark, squeezeLeft, squeezeRight, mouthLaugh, focusReticle, focusScan }, materials };
}
