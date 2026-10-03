import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AnimationMixer, Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import validator from 'gltf-validator';

const expectedAnimations = ['idle', 'blink', 'happy', 'curious', 'sleepy', 'love', 'dizzy', 'excited', 'angry', 'sad', 'surprised', 'shy', 'scared', 'confused', 'laugh', 'focused'];
const bytes = await readFile(new URL('../public/models/pequenito.glb', import.meta.url));
const report = await validator.validateBytes(new Uint8Array(bytes), {
  uri: 'pequenito.glb',
  format: 'glb',
  maxIssues: 100,
  writeTimestamp: false,
});

for (const issue of report.issues.messages ?? []) {
  if (issue.severity > 1) continue;
  console.log(`${issue.severity === 0 ? 'ERROR' : 'WARNING'} ${issue.code}: ${issue.message} ${issue.pointer ?? ''}`);
}
assert.equal(report.issues.numErrors, 0, 'The exported asset must pass the Khronos glTF validator.');

const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const { scene, animations } = await new GLTFLoader().parseAsync(buffer, '');
assert.deepEqual(
  animations.map((clip) => clip.name).sort(),
  [...expectedAnimations].sort(),
  'The GLB must contain all sixteen named animations.',
);

let vertexCount = 0;
scene.traverse((object) => {
  if (!object.isMesh) return;
  const positions = object.geometry.attributes.position;
  assert.ok(positions?.count > 0, `${object.name}: mesh has no positions.`);
  for (let index = 0; index < positions.count; index += 1) {
    for (const value of [positions.getX(index), positions.getY(index), positions.getZ(index)]) {
      assert.ok(Number.isFinite(value), `${object.name}: non-finite vertex.`);
    }
  }
  vertexCount += positions.count;
});
assert.ok(vertexCount > 0, 'The GLB must contain mesh geometry.');

const box = new Box3();
const size = new Vector3();
function checkBounds(label) {
  scene.updateMatrixWorld(true);
  box.setFromObject(scene);
  box.getSize(size);
  for (const value of [...box.min.toArray(), ...box.max.toArray(), ...size.toArray()]) {
    assert.ok(Number.isFinite(value) && Math.abs(value) < 10, `${label}: model exceeds its 10-unit bounds.`);
  }
}
checkBounds('Rest pose');

// Check the actual exported animation channels at representative poses.
const mixer = new AnimationMixer(scene);
const animationChannels = animations[0].tracks.map(track => track.name).sort();
const expressionChecks = {
  angry: { shown: ['BrowLeft', 'BrowRight', 'MouthGrimace'], hidden: ['Tear', 'CheekLeft'] },
  sad: { shown: ['Tear', 'MouthFrown'], hidden: ['Sweat', 'MouthBar'] },
  surprised: { shown: ['RoundLeft', 'RoundRight', 'MouthRound'], hidden: ['EyeLeft', 'EyeRight'] },
  shy: { shown: ['CheekLeft', 'CheekRight', 'MouthSmile'], hidden: ['MouthBar'] },
  scared: { shown: ['RoundLeft', 'RoundRight', 'MouthRound', 'Sweat'], hidden: ['EyeLeft', 'EyeRight'] },
  confused: { shown: ['QuestionMark', 'MouthGrimace'], hidden: ['MouthBar'] },
  laugh: { shown: ['SqueezeLeft', 'SqueezeRight', 'MouthLaugh'], hidden: ['EyeLeft', 'EyeRight'] },
  focused: { shown: ['FocusReticle', 'FocusScan'], hidden: ['QuestionMark'] },
};
for (const clip of animations) {
  assert.ok(clip.duration > 0 && clip.tracks.length > 0, `${clip.name}: empty animation.`);
  assert.deepEqual(clip.tracks.map(track => track.name).sort(), animationChannels, `${clip.name}: expression transforms must all reset between clips.`);
  const action = mixer.clipAction(clip).play();
  for (const fraction of [0, 0.25, 0.5, 0.75, 0.999]) {
    mixer.setTime(clip.duration * fraction);
    checkBounds(`${clip.name} at ${(fraction * 100).toFixed(1)}%`);
  }
  if (expressionChecks[clip.name]) {
    mixer.setTime(clip.duration * 0.25);
    for (const [visibility, names] of Object.entries(expressionChecks[clip.name])) for (const name of names) {
      const node = scene.getObjectByName(name);
      assert.ok(node, `${clip.name}: missing expression feature ${name}.`);
      assert.ok(visibility === 'shown' ? node.scale.x > 0.1 : node.scale.x < 0.01, `${clip.name}: ${name} should be ${visibility}.`);
    }
  }
  if (clip.name === 'blink') {
    mixer.setTime(0.6);
    assert.ok(scene.getObjectByName('EyeLeft').scale.y < 0.1, 'Wink must close the left eye.');
    assert.ok(scene.getObjectByName('EyeRight').scale.y > 0.95, 'Wink must keep the right eye open.');
  }
  action.stop();
  mixer.setTime(0);
}
mixer.uncacheRoot(scene);

console.log(`Khronos validation passed: ${report.issues.numErrors} errors, ${report.issues.numWarnings} warnings.`);
console.log(`Verified ${vertexCount.toLocaleString('en-US')} finite vertices and bounded geometry across all sixteen animations.`);
console.log(`Animations: ${expectedAnimations.join(', ')}`);
