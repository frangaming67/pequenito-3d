# Armá tu Pequeñito: guía de electrónica y montaje

Esta es una propuesta de construcción para reproducir la cara y el aspecto del llavero del video. Usa una **Seeed Studio XIAO ESP32C3**, una pantalla **SSD1306 I2C de 128 × 64** y un pulsador. Los componentes internos del dispositivo original no se identificaron mediante desmontaje: este circuito es un diseño propio basado en módulos documentados. El montaje físico todavía debe probarse en hardware real.

Primero hacé funcionar la versión alimentada por USB-C. La batería se agrega después de verificar la pantalla, el botón y el programa.

## 1. Materiales

| Cantidad | Componente | Qué elegir |
| --- | --- | --- |
| 1 | Seeed Studio XIAO ESP32C3 | El modelo **ESP32C3** exacto. Otras XIAO pueden tener distintos GPIO y cargadores. |
| 1 | OLED de 0,96 pulgadas | **SSD1306, 128 × 64, I2C de cuatro pines, compatible con alimentación y señales de 3,3 V**. Elegí amarillo arriba y azul abajo para acercarte al video. |
| 1 | Pulsador momentáneo normalmente abierto | Dos contactos eléctricos; también sirve uno de cuatro patas si identificás sus pares. |
| 1 | Cable USB-C de datos | Para alimentar y cargar el firmware desde la computadora. |
| 1 juego | Cables y conectores | Cables cortos de 28–30 AWG para OLED/botón; para batería, 26–28 AWG y conector polarizado adecuado. Colores sugeridos en la tabla siguiente. |
| 1 juego | Carcasa y fijaciones | Frente y dorso aislantes, separadores de nylon, tornillos compatibles con los agujeros del módulo, aro y mosquetón. Medí las piezas antes de cortar. |
| Opcional | Batería LiPo protegida | Una celda de **3,7 V nominal / 4,2 V cargada**, con corriente de carga admitida de **al menos 500 mA**. Ver sección de batería. |
| Opcional | Interruptor de alimentación | SPST, o SPDT usando común y un lateral. Como selección de diseño, usá contactos especificados para **al menos 1 A a 6 V DC**. |

Herramientas: soldador de punta fina, estaño, flux, pinza, pelacables, multímetro, termocontraíble y cinta aislante de poliimida. Una protoboard ayuda en la primera prueba.

Como referencia concreta de pantalla, el fabricante QD documenta la **MC096VY**: SSD1306, amarillo/azul, I2C de cuatro pines, 128 × 64 y alimentación a 3,3 V. Existen muchos módulos parecidos: comprobá controlador, tensión y serigrafía en el que compres. No elijas un SH1106, un módulo SPI de siete pines o uno de 128 × 32 esperando usar este cableado sin cambios. [Ficha del módulo OLED](https://www.lcdwiki.com/0.96inch_OLED_Module_%28IIC-4P_SKU%3AMC096VX%29).

La pantalla bicolor tiene regiones físicas fijas: en los paneles habituales el cuarto superior es amarillo y el resto azul. El firmware enciende píxeles; no puede recolorear cada píxel como una pantalla RGB. La cámara del video hace que el azul parezca cian. [Descripción del panel bicolor](https://www.waveshare.com/wiki/0.96inch_OLED_Module).

## 2. Cableado, señal por señal

Conectá todo con USB y batería desconectados. La posición izquierda/derecha de VCC y GND varía entre fabricantes: **seguí las letras impresas en cada placa**.

| Etiqueta del cable | Color sugerido | XIAO ESP32C3 | Destino |
| --- | --- | --- | --- |
| `OLED +3V3` | Naranja | `3V3` | `VCC` de la pantalla |
| `OLED GND` | Negro | `GND` | `GND` de la pantalla |
| `OLED SDA` | Verde | `D4` / `GPIO6` | `SDA` de la pantalla |
| `OLED SCL` | Azul | `D5` / `GPIO7` | `SCL` de la pantalla |
| `BOTÓN` | Blanco | `D2` / `GPIO4` | Un contacto del pulsador |
| `BOTÓN GND` | Negro | `GND` | El otro contacto del pulsador |

El mapa D4/GPIO6, D5/GPIO7 y D2/GPIO4 corresponde a la **XIAO ESP32C3**, según su fabricante. [Pinout oficial de Seeed](https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/#pin-map).

El botón usa `INPUT_PULLUP`: suelto se lee `HIGH`, apretado se lee `LOW`. **No necesita una resistencia externa**. El pulsador conecta la entrada a masa, nunca a la batería ni a 5 V. Los módulos OLED listos para I2C normalmente incluyen las resistencias del bus; elegí uno con ellas incorporadas. [Entradas y resistencia interna de ESP32](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/gpio.html).

```text
PRIMERA PRUEBA: USB SOLAMENTE

Computadora ── cable USB-C de datos ── XIAO ESP32C3
                                         │
                  3V3 ───────────────────┼── VCC OLED
                  GND ───────────────────┼── GND OLED
           D4 / GPIO6 ────────────────────┼── SDA OLED
           D5 / GPIO7 ────────────────────┼── SCL OLED
           D2 / GPIO4 ── pulsador ── GND   │

La pantalla se alimenta desde 3V3. Los pines 5V y BAT quedan libres.
```

## 3. Armado de la primera versión

1. **Presentá las piezas.** Poné la OLED delante y la XIAO detrás, con el USB-C orientado hacia una abertura accesible. Dejá espacio para el botón y para desconectar el cable. Todavía no cierres la carcasa.
2. **Prepará los cables.** Cortá cuatro para la pantalla y dos para el botón. Unos 5–8 cm alcanzan para una prueba de banco; después podés acortarlos. Etiquetá ambos extremos antes de soldar.
3. **Conectá la pantalla.** Seguí la tabla: primero masa y alimentación, después SDA y SCL. Evitá que un hilo de cobre suelto toque el pin vecino. No conectes VCC al pin 5V.
4. **Identificá el botón.** Con el multímetro en continuidad, elegí dos terminales que estén abiertos al soltar y conectados al apretar. En pulsadores de cuatro patas, algunos pares ya están unidos internamente: usar dos del mismo par dejaría el botón permanentemente activado.
5. **Conectá el botón** entre D2 y GND. Compartí el mismo GND de la XIAO con la pantalla.
6. **Revisá las uniones.** Con todo sin alimentación, buscá puentes de estaño y comprobá que las líneas de alimentación no estén cortocircuitadas. Una lectura que cambia mientras se cargan los condensadores no equivale por sí sola a un cortocircuito; una resistencia estable cercana a cero requiere revisar el montaje.
7. **Conectá USB-C** y cargá el programa como se indica abajo. Si hay calentamiento anormal o un cable queda mal conectado, desconectá la alimentación antes de tocar el circuito.

## 4. Instalar el programa con Arduino IDE

1. Instalá [Arduino IDE](https://www.arduino.cc/en/software) en tu computadora.
2. En **Archivo → Preferencias → URLs adicionales del Gestor de placas**, agregá la URL estable oficial de Espressif:

   ```text
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```

3. Abrí el **Gestor de placas**, buscá `esp32` e instalá **esp32 by Espressif Systems 2.0.17**, la versión con la que se compiló este proyecto. [Instrucciones oficiales de instalación](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html).
4. En **Herramientas → Placa**, elegí **XIAO_ESP32C3**. Seleccioná el puerto de la placa conectada. [Selección de placa de Seeed](https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/#software-preparation).
5. En el **Gestor de bibliotecas**, instalá **Adafruit SSD1306 2.5.17** y **Adafruit GFX Library 1.12.6**. Aceptá instalar **Adafruit BusIO 1.17.4** si aparece como dependencia. [Biblioteca oficial SSD1306](https://github.com/adafruit/Adafruit_SSD1306).
6. Abrí [`firmware/pequenito/pequenito.ino`](../firmware/pequenito/pequenito.ino). Conservá el archivo dentro de la carpeta `pequenito`, con el mismo nombre.
7. Pulsá **Verificar** para compilar. Luego pulsá **Subir**. Las opciones de placa pueden variar con la versión instalada; si necesitás leer el registro por USB, activá **USB CDC On Boot** cuando esa opción esté disponible.
8. Abrí el **Monitor serie a 115200 baudios**. El firmware informa la inicialización de la OLED y las expresiones. Consultá [`firmware/README.md`](../firmware/README.md) para los detalles de la versión incluida.

Si el puerto no aparece o la carga no comienza, probá otro cable de datos. Como recuperación, mantené **BOOT** apretado mientras conectás USB, soltalo y volvé a seleccionar el puerto antes de subir. [Recuperación de carga de Seeed](https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/#q1-my-arduino-ide-is-stuck-when-uploading-code-to-the-board).

## 5. Probar la cara y el botón

- Al arrancar debe aparecer la cara animada, con el modo automático activo.
- Un **clic corto** cambia a la expresión siguiente y pasa a selección manual.
- Una **pulsación de al menos un segundo** alterna el modo automático, que recorre las expresiones cada ocho segundos.
- El firmware incluye **16 expresiones**, dibujadas con primitivas 2D para la OLED. Los movimientos del llavero completo en la demo 3D son una presentación visual: el circuito no contiene motores.
- Probá varias expresiones durante unos minutos antes de soldar o cerrar definitivamente.

| Identificador del programa | Expresión |
| --- | --- |
| `idle` | Original |
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
| `laugh` | Riendo |
| `focused` | Concentrado |

El programa busca las direcciones I2C habituales `0x3C` y `0x3D`. Algunas placas imprimen `0x78` o `0x7A`: esas son representaciones de ocho bits de las mismas direcciones; en Arduino se usan `0x3C` y `0x3D`. [Direcciones documentadas del módulo](https://www.lcdwiki.com/0.96inch_OLED_Module_%28IIC-4P_SKU%3AMC096VX%29).

## 6. Agregar batería, de forma opcional

La XIAO ESP32C3 admite una celda de litio de 3,7 V nominal y tiene cargador integrado. Seeed publica **380 mA de carga rápida y 40 mA de precarga** para este modelo. No confundas este dato con el de otras XIAO ni con la corriente máxima de su regulador. [Especificaciones de alimentación y carga](https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/#specifications).

Para este montaje, elegí una **LiPo protegida, con cables y conector ya instalados**, cuya ficha permita cargar a **500 mA o más**. La capacidad sola no garantiza compatibilidad: una celda de 500 mAh que admite 1 C admite 500 mA; una de 500 mAh limitada a 0,5 C admite solo 250 mA y no sirve para este cargador. Una de 1000 mAh a 0,5 C sí cumple. No conectes una minicelda de 100–200 mAh sin comprobar su corriente admisible.

Como ejemplo documentado, la [Adafruit 1578 de 500 mAh](https://www.adafruit.com/product/1578) incorpora protección y permite carga de hasta 500 mA. Mide aproximadamente 29 × 36 × 4,75 mm: una batería de ese tamaño puede requerir una carcasa mayor que la proporción del modelo visual. Es un ejemplo de especificación, no una garantía de que quepa en cualquier carcasa.

Usá los pads de batería del reverso indicados por Seeed: **positivo al pad BAT y negativo al pad GND de batería**. Identificalos en el [pinout posterior oficial](https://files.seeedstudio.com/wiki/XIAO_WiFi/XIAO_ESP32-C3_back_pinout.png); no deduzcas su posición por una foto girada. El [esquemático oficial de la XIAO ESP32C3](https://files.seeedstudio.com/wiki/XIAO_WiFi/Resources/XIAO_ESP32C3_v1.3_SCH_260116.pdf) muestra esa conexión al circuito de alimentación.

```text
EXTENSIÓN OPCIONAL CON BATERÍA PROTEGIDA 1S

LiPo (+) ── conector ── interruptor ── BAT de XIAO
LiPo (−) ── conector ──────────────── GND de batería de XIAO

USB-C ── entrada USB de XIAO ── cargador integrado ── BAT

XIAO 3V3 ── OLED VCC
XIAO GND ── OLED GND y botón

Interruptor abierto: batería aislada, tampoco carga.
Interruptor cerrado: batería conectada, USB permite cargarla.
USB conectado puede mantener la placa encendida aunque abras el interruptor.
```

1. Desconectá USB y mantené la batería desenchufada del arnés.
2. Soldá el conector y el interruptor al arnés; aislá individualmente cada unión. En un SPDT, usá el contacto común y un lateral; dejá el otro aislado.
3. Soldá el arnés a los pads de la placa. Trabajá con cables preinstalados en la batería; no sueldes sobre la bolsa ni sus lengüetas.
4. Con multímetro, comprobá la polaridad real del conector y que el interruptor corte únicamente el positivo. El color del cable no reemplaza la medición: conectores de otras marcas pueden invertir polaridad.
5. Conectá la batería, cerrá el interruptor y probá la cara sin USB. Para cargar, dejá el interruptor cerrado y conectá USB-C.

La batería debe quedar protegida frente a llaves, bordes, tornillos y presión de la carcasa. No la dobles ni la encierres en resina. Cargá con supervisión sobre una superficie adecuada; si está hinchada, dañada o se calienta de forma anormal, dejá de usarla. Usá solamente la química 1S de 4,2 V de carga indicada, sin añadir otro cargador en paralelo. [Cuidados del fabricante de la batería](https://www.adafruit.com/product/1578), [protección de baterías LiPo](https://learn.adafruit.com/li-ion-and-lipoly-batteries/protection-circuitry).

## 7. Montaje con aspecto de llavero

1. **Tomá medidas del montaje real.** Medí el PCB, la altura de conectores, la batería y el recorrido del botón. Hacé una plantilla de cartón con los agujeros y la abertura USB antes de encargar el acrílico.
2. **Prepará dos placas aislantes.** Como punto de partida podés usar acrílico transparente de 1,5–2 mm, con separadores de nylon. El espesor final entre placas debe acomodar los componentes sin presionarlos.
3. **Fijá la pantalla por el PCB.** No apoyes tornillos sobre el vidrio ni aprietes el flex. Si el módulo tiene agujeros, usalos con tornillos y arandelas adecuados.
4. **Sujetá la XIAO y el botón** a un soporte aislante. Dejá USB, BOOT y RESET accesibles para futuras cargas y recuperación.
5. **Separá la batería de la electrónica** mediante una barrera aislante lisa. Que no toque puntas de soldadura. Sujetala sin comprimir su bolsa.
6. **Ordená el cableado.** Dejá un pequeño margen de movimiento y fijá los cables al soporte para que un tirón no llegue a las soldaduras. Los bucles rojo y turquesa del aspecto del video se pueden reproducir con cable aislado, manteniendo etiquetas y polaridad claras.
7. **Colocá el aro en una oreja de la carcasa.** El peso y los tirones deben recaer en la carcasa, nunca en cables o placas. Cerrá y revisá que ninguna llave pueda tocar partes conductoras.
8. **Hacé la prueba final.** Probá USB, batería si la instalaste, botón, interruptor y las 16 expresiones. Revisá el montaje después de moverlo suavemente.

El archivo GLB de la demo es un modelo visual con proporciones estimadas. **No es un plano mecánico a escala ni un archivo listo para fabricar una carcasa compatible**. Los agujeros, separadores y dimensiones de corte se definen a partir de los componentes que efectivamente compres.

## 8. Si algo no funciona

| Síntoma | Qué comprobar |
| --- | --- |
| Pantalla negra | Serigrafía VCC/GND, alimentación de 3,3 V, SDA/SCL y mensajes del Monitor serie. Confirmá que sea SSD1306 128 × 64 I2C. |
| La pantalla responde, pero la imagen está desplazada | Verificá que el controlador no sea SH1106 ni otro modelo. Confirmá resolución y orientación. |
| El botón no cambia la expresión | Comprobá continuidad entre los dos terminales elegidos solo al apretar y conexión a D2/GND. |
| El botón parece siempre apretado | Revisá que no hayas utilizado dos patas ya unidas internamente o dejado un puente de estaño. |
| No aparece el puerto USB | Probá cable de datos, otro puerto y el procedimiento BOOT de la sección 4. |
| Funciona por USB pero no con batería | Verificá polaridad, interruptor, conexión BAT/GND y tensión con multímetro. No puentes la protección de la batería. |
| No carga con el interruptor apagado | Es el comportamiento previsto de este arnés: la batería queda aislada. Cerralo para cargar. |
| La carcasa no cierra | Aumentá el espacio de los separadores o rediseñá la carcasa. No comprimas la batería ni la pantalla. |

La autonomía depende del brillo, del módulo y de la batería real. Medila después de montar el circuito; este proyecto no incluye una medición física de consumo ni un indicador calibrado de carga restante.

Documentación técnica consultada el **2 de octubre de 2026**. Revisá la revisión de la placa y la ficha de cada componente antes de sustituir piezas.
