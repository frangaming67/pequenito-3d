# Firmware de Pequeñito

Sketch para **Seeed Studio XIAO ESP32C3** y pantalla **SSD1306 I2C de 128 × 64**, con 16 expresiones dibujadas en el microcontrolador. Abrí [pequenito/pequenito.ino](pequenito/pequenito.ino) en Arduino IDE. La carpeta y el archivo deben conservar el mismo nombre.

El circuito propuesto recrea la apariencia del video; no identifica los componentes originales. El modelo GLB es una visualización y no se carga al microcontrolador. Este firmware redibuja las caras mediante Adafruit GFX.

## Conexión por USB para la primera prueba

Desconectá la alimentación mientras conectás los cables. Usá un módulo OLED I2C de cuatro pines que admita alimentación y niveles lógicos de 3,3 V. Leé sus etiquetas: el orden físico de pines varía entre fabricantes.

| XIAO ESP32C3 | Destino |
| --- | --- |
| 3V3 | VCC de la pantalla |
| GND | GND de la pantalla |
| D4 / GPIO6 | SDA de la pantalla |
| D5 / GPIO7 | SCL de la pantalla |
| D2 / GPIO4 | Un contacto del pulsador normalmente abierto |
| GND | El otro contacto del pulsador |

El botón usa `INPUT_PULLUP`; no conectes el pulsador a 3V3 ni a 5V. El sketch utiliza los números GPIO explícitos `6`, `7` y `4`. Esta correspondencia es específica de la **XIAO ESP32C3**, verificada en el [pinout de Seeed](https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/#pin-map) y el [archivo de pines de Espressif](https://github.com/espressif/arduino-esp32/blob/master/variants/XIAO_ESP32C3/pins_arduino.h).

Alimentá la placa por USB-C con un cable de datos para programar y probar. La batería, el interruptor y el montaje se explican por separado en la [guía de construcción](../docs/hardware-guide.md).

## Pantalla y color

En un OLED bicolor amarillo/cian, los colores son zonas físicas fijas: en el panel previsto las filas **0–15** son amarillas y las **16–63** son cian/azules. El programa enciende o apaga píxeles; no contiene valores RGB ni puede convertir otro panel en uno bicolor. La posición vertical de los ojos atraviesa esa división para reproducir las puntas amarillas del video. Cada expresión mueve o modifica esas formas: el color cambia únicamente al cruzar la banda física.

Un SSD1306 totalmente blanco o azul funciona con las mismas animaciones y muestra el color propio de su panel. Un SH1106 necesita otro controlador y no está cubierto por este sketch. La saturación, el brillo y el tono exactos dependen de la pantalla comprada.

## Instalar y cargar

1. Instalá Arduino IDE 2 y agregá en Preferencias → Gestor de URLs adicionales de tarjetas la URL oficial de Espressif: `https://espressif.github.io/arduino-esp32/package_esp32_index.json`.
2. En el Gestor de placas instalá **esp32 by Espressif Systems**. Seleccioná **XIAO_ESP32C3**; no elijas las variantes S3 o C6.
3. En el Gestor de bibliotecas instalá **Adafruit SSD1306** y **Adafruit GFX Library**, incluyendo la dependencia **Adafruit BusIO** cuando se solicite.
4. Abrí `pequenito/pequenito.ino`, conectá la placa y elegí su puerto USB. Usá la opción **USB CDC On Boot: Enabled** si aparece en el menú de la placa.
5. Pulsá Verificar y luego Subir. Abrí el Monitor serie a **115200 baudios**. Al iniciar informa la dirección del OLED, la expresión y el modo.

Si no aparece el puerto o no permite subir, mantené BOOT, pulsá y soltá RESET, soltá BOOT y volvé a seleccionar el puerto. El procedimiento está documentado por [Seeed para la XIAO ESP32C3](https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/).

La pantalla se busca automáticamente en las direcciones I2C de 7 bits **0x3C** y **0x3D**. Algunos módulos imprimen 0x78/0x7A, que representan la misma dirección en formato de 8 bits. Si no responde, el monitor serie muestra el problema y vuelve a intentar cada dos segundos. Que una dirección responda confirma comunicación I2C; no permite detectar automáticamente si el controlador es SSD1306 o SH1106.

## Uso

- Arranca en **AUTO**, con `idle`, y cambia de expresión cada **8 segundos**.
- Un clic corto avanza una expresión y activa **MANUAL**.
- Mantener pulsado **al menos 1 segundo** alterna AUTO/MANUAL una sola vez por pulsación. Soltar después de una pulsación larga no cambia la cara.
- AUTO/MANUAL se muestra brevemente debajo de la cara al cambiar el modo. La expresión y el modo también se informan por serie.
- El botón tiene antirrebote de 28 ms. Los plazos usan `millis()` con resta unsigned para tolerar su desbordamiento. El dibujo se programa aproximadamente a 30 fps, sin `delay()` en las animaciones. La transferencia I2C es síncrona y el ritmo real depende del módulo y el cableado.

| Identificador | Expresión | Movimiento |
| --- | --- | --- |
| `idle` | Original | Mira a los lados y parpadea |
| `happy` | Feliz | Ojos arqueados y sonrisa que sube y baja |
| `curious` | Curioso | Mira de lado con ojos de diferente altura |
| `blink` | Guiño | Cierra únicamente el ojo izquierdo |
| `sleepy` | Dormilón | Párpados caídos, bostezo y una z |
| `love` | Enamorado | Corazones que laten |
| `dizzy` | Mareado | Espirales que giran en sentidos opuestos |
| `excited` | Emocionado | Ojos grandes, saltitos y destello |
| `angry` | Enojado | Cejas inclinadas y temblor |
| `sad` | Triste | Mirada caída y una lágrima |
| `surprised` | Sorprendido | Ojos altos y boca abierta |
| `shy` | Tímido | Ojos pequeños, rubor y mirada lateral |
| `scared` | Asustado | Temblor rápido, sudor y ojos huecos |
| `confused` | Confundido | Ojos asimétricos y signo de pregunta |
| `laugh` | Riendo | Ojos cerrados, boca grande y rebote |
| `focused` | Concentrado | Párpados estrechos y punto de seguimiento |

Las caras del firmware son interpretaciones para 128 × 64 píxeles de las expresiones de la demo 3D; no son una conversión automática del GLB ni una copia del firmware del video.

## Compilación por línea de comandos

Con Arduino CLI instalado:

```sh
arduino-cli core update-index --additional-urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli core install esp32:esp32@2.0.17 --additional-urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli lib install "Adafruit SSD1306@2.5.17" "Adafruit GFX Library@1.12.6" "Adafruit BusIO@1.17.4"
arduino-cli compile --fqbn esp32:esp32:XIAO_ESP32C3 firmware/pequenito
```

Ejecutá la última línea desde la raíz del repositorio. Si extrajiste solamente la carpeta `firmware`, usá `pequenito` como ruta del sketch.

**Compilación verificada:** Arduino CLI **1.5.1**, core **esp32 2.0.17**, placa `esp32:esp32:XIAO_ESP32C3`, Adafruit SSD1306 **2.5.17**, Adafruit GFX Library **1.12.6** y Adafruit BusIO **1.17.4**. El compilador generó correctamente el firmware: **266.540 bytes de programa (20 %)** y **13.972 bytes de variables globales (4 %)**. La biblioteca reserva además el framebuffer de 1024 bytes durante la ejecución. No se probó con un microcontrolador ni una pantalla física conectados; la compilación no confirma el funcionamiento eléctrico ni el rendimiento sobre hardware real.

En Windows, las rutas muy largas pueden superar el límite de comandos del compilador ESP32. Si ocurre, ubicá el proyecto y los paquetes Arduino en una ruta corta y volvé a compilar.

## Ajustes

En las constantes del sketch podés cambiar `AUTO_MS` (duración de cada expresión), `LONG_PRESS_MS` y `I2C_HZ`. El reloj previsto es 400 kHz; con cables largos o un módulo que no lo admita, bajalo a 100000. A esa velocidad la transferencia de 1024 bytes limita la tasa real a menos de 30 fps. No cambies los pines sin revisar el pinout exacto de la placa.

El sketch no utiliza Wi-Fi, Bluetooth ni acceso a red. El modo elegido se conserva durante esa sesión; al reiniciar vuelve a AUTO.

Referencias de las API: [Adafruit SSD1306](https://github.com/adafruit/Adafruit_SSD1306), [Adafruit GFX](https://github.com/adafruit/Adafruit-GFX-Library) e [instalación oficial Arduino-ESP32](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html).
