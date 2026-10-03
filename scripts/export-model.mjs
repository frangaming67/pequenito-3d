import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Box3, Vector3 } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createPequenito } from '../src/model.js';

// GLTFExporter uses the browser FileReader API to assemble its binary buffers.
// The model has no image textures, so Blob is the only browser API needed here.
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    result = null;
    error = null;
    onload = null;
    onloadend = null;
    onerror = null;

    readAsArrayBuffer(blob) {
      this.read(blob, (buffer) => buffer);
    }

    readAsDataURL(blob) {
      this.read(blob, (buffer) =>
        `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(buffer).toString('base64')}`,
      );
    }

    async read(blob, transform) {
      try {
        this.result = transform(await blob.arrayBuffer());
        this.onload?.({ target: this });
      } catch (error) {
        this.error = error;
        this.onerror?.({ target: this });
      } finally {
        this.onloadend?.({ target: this });
      }
    }
  };
}

const output = new URL('../public/models/', import.meta.url);
const { root, clips } = createPequenito();
root.updateMatrixWorld(true);

const binary = await new GLTFExporter().parseAsync(root, {
  binary: true,
  animations: clips,
  onlyVisible: false,
  trs: true,
});

let meshCount = 0;
let triangleCount = 0;
root.traverse((object) => {
  if (!object.isMesh) return;
  meshCount += 1;
  triangleCount += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
});
const bounds = new Box3().setFromObject(root);
const manifest = {
  name: 'Pequeñito',
  file: 'pequenito.glb',
  format: 'glTF 2.0 binary',
  byteLength: binary.byteLength,
  meshes: meshCount,
  triangles: triangleCount,
  bounds: {
    min: bounds.min.toArray(),
    max: bounds.max.toArray(),
    size: bounds.getSize(new Vector3()).toArray(),
  },
  animations: clips.map((clip) => ({ name: clip.name, durationSeconds: clip.duration })),
};

await mkdir(output, { recursive: true });
await writeFile(new URL('pequenito.glb', output), Buffer.from(binary));
await writeFile(new URL('manifest.json', output), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Exported ${fileURLToPath(new URL('pequenito.glb', output))}`);
console.log(`${(binary.byteLength / 1024).toFixed(1)} KiB · ${meshCount} meshes · ${triangleCount.toLocaleString('en-US')} triangles`);
console.log(`Animations (${clips.length}): ${clips.map((clip) => clip.name).join(', ')}`);
