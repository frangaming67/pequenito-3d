import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { zipSync, strToU8 } from 'fflate';

const base = new URL('../', import.meta.url);
const out = new URL('public/downloads/', base);
const read = path => readFile(new URL(path, base));
const files = {
  'firmware/pequenito/pequenito.ino': new Uint8Array(await read('firmware/pequenito/pequenito.ino')),
  'firmware/README.md': new Uint8Array(await read('firmware/README.md')),
  'docs/guia-de-armado.md': new Uint8Array(await read('docs/hardware-guide.md')),
  'models/pequenito.glb': new Uint8Array(await read('public/models/pequenito.glb')),
  'models/manifest.json': new Uint8Array(await read('public/models/manifest.json')),
  'LEEME.txt': strToU8('PEQUEÑITO — KIT DE ARMADO\n\n1. Leé docs/guia-de-armado.md antes de conectar componentes.\n2. Revisá firmware/README.md para instalar las versiones usadas.\n3. Abrí firmware/pequenito/pequenito.ino en Arduino IDE.\n4. El GLB de models/ contiene el modelo visual y las 16 animaciones.\n\nLa electrónica es una propuesta basada en XIAO ESP32C3; no se ha ensayado físicamente. El GLB no es un plano de fabricación.\n'),
};
await mkdir(out, { recursive: true });
await writeFile(new URL('pequenito-kit.zip', out), zipSync(files, { level: 6 }));
await writeFile(new URL('pequenito.ino', out), files['firmware/pequenito/pequenito.ino']);
await writeFile(new URL('guia-de-armado.md', out), files['docs/guia-de-armado.md']);
console.log(`Kit generated: ${Object.keys(files).length} files, firmware and guide downloads ready.`);
