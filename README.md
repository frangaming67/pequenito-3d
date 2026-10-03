# Pequeñito

Un llavero electrónico recreado en 3D a partir del video de referencia: carcasa de acrílico, placa, pantalla OLED, cables, tornillos, aro y mosquetón. La demo permite girarlo, acercarlo, elegir dieciséis expresiones, cambiar la velocidad, pausar, cambiar la iluminación y guardar una imagen.

## Demo

Demo privada: [Abrir Pequeñito](https://pequenito-3d-fran.panchobasigalupdomin.chatgpt.site). Requiere acceso con la cuenta propietaria.

## Modelo 3D

- [`public/models/pequenito.glb`](public/models/pequenito.glb): geometría, materiales PBR y dieciséis animaciones integradas. Importar en Blender mediante **Archivo → Importar → glTF 2.0**.
- [`public/models/manifest.json`](public/models/manifest.json): nombres y duraciones de las animaciones.
- [`src/model.js`](src/model.js): fuente editable y reproducible del modelo.

| Animación | Expresión |
| --- | --- |
| `idle` | Original: mirada, parpadeos y pequeños gestos |
| `happy` | Feliz |
| `curious` | Curioso |
| `blink` | Guiño |
| `sleepy` | Dormilón |
| `love` | Enamorado |
| `dizzy` | Mareado |
| `excited` | Emocionado |
| `angry` | Enojado |
| `sad` | Triste |
| `surprised` | Sorprendido |
| `shy` | Tímido |
| `scared` | Asustado |
| `confused` | Confundido |
| `laugh` | Risueño |
| `focused` | Concentrado |

La reconstrucción interpreta las formas visibles en el video; los lados, el interior y la parte posterior se completaron a partir de esa referencia. Las medidas son proporciones de visualización, no mediciones físicas. Los gestos se recrearon y ampliaron, por lo que no son una captura exacta cuadro a cuadro. La demo reproduce una banda de color OLED fija; el GLB usa una aproximación con geometría exportable.

## Instructivo y firmware

La página incluye materiales, esquema de conexiones, pantalla recomendada, instalación, montaje, batería opcional, resolución de problemas y código completo.

- [Guía de armado](docs/hardware-guide.md)
- [Firmware y versiones verificadas](firmware/README.md)
- [Código Arduino](firmware/pequenito/pequenito.ino)
- [Kit completo descargable](public/downloads/pequenito-kit.zip)

Firmware compilado para XIAO ESP32C3 con ESP32 core 2.0.17: 266.540 bytes de programa y 13.972 bytes de RAM global. El circuito no se ha ensayado físicamente.

## Ejecutar localmente

Requiere Node.js 22.12 o posterior.

```sh
npm ci
npm run dev
```

Abrir `http://127.0.0.1:5173`. Arrastrar para girar; rueda o gesto de pinza para acercar. Con el visor enfocado, usar flechas, `+`, `-` y `Home`. Los botones y controles funcionan con teclado. Se respeta la preferencia del sistema para reducir movimiento iniciando la animación en pausa.

```sh
npm run export:model
npm run check:model
npm run build
npm run preview
```

`export:model` regenera el GLB. `check:model` comprueba el archivo con el validador de Khronos y verifica las dieciséis animaciones y los límites geométricos. `build` produce una web estática en `dist/`.

## Estructura

```text
src/model.js           Modelo y animaciones Three.js
src/main.js            Visor, iluminación y controles
src/style.css          Interfaz adaptable
scripts/               Exportación y validación del GLB
public/models/         Modelo descargable
.openai/hosting.json   Configuración del sitio privado
```

Los materiales transparentes y emisivos pueden verse diferentes en otros visores según su iluminación y gestión de color. Se necesita WebGL para la demo. Las fuentes de Google Fonts cuentan con fuentes del sistema como alternativa.

Referencia visual proporcionada por el usuario: [reel de Instagram](https://www.instagram.com/reel/Ddwk9uuouR9/). El video, el audio y la interfaz de Instagram se usaron como referencia de análisis y no se incluyen en este repositorio. Código y geometría creados para este proyecto; sin afiliación con el creador del dispositivo original.
