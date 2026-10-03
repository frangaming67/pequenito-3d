/*
 * Pequenito: 16 animated faces for Seeed Studio XIAO ESP32C3.
 * Display: SSD1306, 128x64, I2C, 3.3 V. A yellow/cyan panel has a
 * PHYSICAL colour boundary: rows 0..15 yellow, rows 16..63 cyan/blue.
 * This monochrome framebuffer cannot choose or move those colours.
 *
 * D4 / GPIO6 -> SDA, D5 / GPIO7 -> SCL, 3V3 -> VCC, GND -> GND.
 * Normally-open button: D2 / GPIO4 -> button -> GND (INPUT_PULLUP).
 * Short click: next expression and manual mode.
 * Hold >= 1 second: toggle automatic cycling, every 8 seconds.
 * All animation/button scheduling uses millis(); no animation delays.
 */

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <math.h>

constexpr uint8_t SDA_PIN = 6;
constexpr uint8_t SCL_PIN = 7;
constexpr uint8_t BUTTON_PIN = 4;
constexpr uint16_t SCREEN_WIDTH = 128;
constexpr uint16_t SCREEN_HEIGHT = 64;
constexpr uint32_t I2C_HZ = 400000;
constexpr uint32_t FRAME_MS = 1000 / 30;  // approximately 30 frames/s
constexpr uint32_t AUTO_MS = 8000;
constexpr uint32_t DEBOUNCE_MS = 28;
constexpr uint32_t LONG_PRESS_MS = 1000;
constexpr uint32_t STATUS_MS = 1200;
constexpr float TAU = 6.28318530718f;

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1,
                         I2C_HZ, I2C_HZ);

enum Expression : uint8_t {
  IDLE, HAPPY, CURIOUS, BLINK, SLEEPY, LOVE, DIZZY, EXCITED,
  ANGRY, SAD, SURPRISED, SHY, SCARED, CONFUSED, LAUGH, FOCUSED,
  EXPRESSION_COUNT
};
const char *const EXPRESSION_NAMES[EXPRESSION_COUNT] = {
  "idle", "happy", "curious", "blink", "sleepy", "love", "dizzy", "excited",
  "angry", "sad", "surprised", "shy", "scared", "confused", "laugh", "focused"
};

Expression expression = IDLE;
bool automatic = true;
bool displayReady = false;
bool rawPressed = false;
bool stablePressed = false;
bool longPressHandled = false;
bool statusVisible = true;
uint32_t rawChangedAt = 0;
uint32_t pressedAt = 0;
uint32_t expressionAt = 0;
uint32_t lastAutoAt = 0;
uint32_t lastFrameAt = 0;
uint32_t lastDisplayAttemptAt = 0;
uint32_t statusAt = 0;

// Explicit prototypes also make these enum-taking functions safe for the
// Arduino sketch preprocessor across IDE/core versions.
void selectExpression(Expression next, uint32_t now);
void drawFace(Expression current, uint32_t elapsed);

int16_t pixel(float value) { return static_cast<int16_t>(lroundf(value)); }

void eye(int16_t x, int16_t y, int16_t width, int16_t height) {
  width = max(static_cast<int16_t>(2), width);
  height = max(static_cast<int16_t>(2), height);
  const int16_t radius = min(static_cast<int16_t>(7),
                            static_cast<int16_t>(min(width, height) / 2));
  display.fillRoundRect(x - width / 2, y - height / 2, width, height,
                        radius, SSD1306_WHITE);
}

// A compact parabolic stroke. Positive depth makes a U (smile); negative
// depth makes an arch (happy eyelid or sad mouth). Three pixels thick.
void arc(int16_t x, int16_t y, int16_t halfWidth, int16_t depth) {
  for (int16_t dx = -halfWidth; dx <= halfWidth; ++dx) {
    const float u = static_cast<float>(dx) / halfWidth;
    const int16_t py = y + pixel(depth * (1.0f - u * u));
    display.drawFastVLine(x + dx, py, 3, SSD1306_WHITE);
  }
}

void barMouth(int16_t x, int16_t y, int16_t width = 11) {
  display.fillRoundRect(x - width / 2, y, width, 4, 2, SSD1306_WHITE);
}

void openMouth(int16_t x, int16_t y, int16_t width, int16_t height) {
  display.fillRoundRect(x - width / 2, y, width, height,
                        min(width, height) / 2, SSD1306_WHITE);
  if (width > 6 && height > 6) {
    display.fillRoundRect(x - width / 2 + 2, y + 2, width - 4, height - 4,
                          min(width - 4, height - 4) / 2, SSD1306_BLACK);
  }
}

void heart(int16_t x, int16_t y, int16_t size) {
  const int16_t r = max(static_cast<int16_t>(2), static_cast<int16_t>(size / 3));
  display.fillCircle(x - r, y - r / 2, r, SSD1306_WHITE);
  display.fillCircle(x + r, y - r / 2, r, SSD1306_WHITE);
  display.fillTriangle(x - 2 * r, y, x + 2 * r, y, x, y + size,
                        SSD1306_WHITE);
}

void spiral(int16_t x, int16_t y, float phase, bool clockwise) {
  int16_t previousX = x, previousY = y;
  for (uint8_t segment = 1; segment <= 48; ++segment) {
    const float amount = static_cast<float>(segment) / 48;
    const float angle = phase + (clockwise ? 1 : -1) * amount * TAU * 1.65f;
    const int16_t nextX = x + pixel(cosf(angle) * (1 + 10 * amount));
    const int16_t nextY = y + pixel(sinf(angle) * (1 + 10 * amount));
    display.drawLine(previousX, previousY, nextX, nextY, SSD1306_WHITE);
    display.drawLine(previousX + 1, previousY, nextX + 1, nextY,
                     SSD1306_WHITE);
    previousX = nextX;
    previousY = nextY;
  }
}

void tear(int16_t x, int16_t y) {
  display.fillTriangle(x, y - 5, x - 3, y, x + 3, y, SSD1306_WHITE);
  display.fillCircle(x, y + 1, 3, SSD1306_WHITE);
}

void cheeks(int16_t x, int16_t y) {
  for (int16_t side = -1; side <= 1; side += 2) {
    for (int16_t line = 0; line < 3; ++line) {
      const int16_t cx = x + side * 34 + line * 4;
      display.drawLine(cx, y, cx - 2, y + 5, SSD1306_WHITE);
    }
  }
}

void drawFace(Expression current, uint32_t elapsed) {
  const float t = (elapsed % 120000UL) / 1000.0f;
  const float wave = sinf(t * TAU);
  int16_t cx = 64, cy = 23;
  display.clearDisplay();

  switch (current) {
    case IDLE: {
      cx += pixel(5 * sinf(t * 1.05f));
      cy += pixel(sinf(t * 1.6f));
      const uint32_t phase = elapsed % 4800;
      const int16_t h = (phase >= 1550 && phase < 1690) ? 3 : 27;
      eye(cx - 21, cy, 18, h);
      eye(cx + 21, cy, 18, h);
      barMouth(cx, cy + 20);
      break;
    }
    case HAPPY:
      cy += pixel(2 * sinf(t * 4));
      arc(cx - 21, cy, 10, -6);
      arc(cx + 21, cy, 10, -6);
      arc(cx, cy + 16, 10, 5);
      break;
    case CURIOUS: {
      const float glance = sinf(t * 1.5f);
      cx += pixel(6 * glance);
      eye(cx - 21, cy - pixel(2 * glance), 18, pixel(24 - 7 * glance));
      eye(cx + 21, cy + pixel(2 * glance), 18, pixel(24 + 7 * glance));
      barMouth(cx + pixel(2 * glance), cy + 20, 7);
      break;
    }
    case BLINK: {
      const uint32_t phase = elapsed % 2400;
      const bool wink = (phase >= 500 && phase < 820) ||
                        (phase >= 1120 && phase < 1300);
      eye(cx - 21, cy, 18, wink ? 3 : 27);
      eye(cx + 21, cy, 18, 27);
      arc(cx, cy + 18, 8, 3);
      break;
    }
    case SLEEPY:
      cy += pixel(2 + 2 * sinf(t * 1.8f));
      eye(cx - 21, cy, 18, pixel(4 + 2 * (1 + sinf(t * 1.6f))));
      eye(cx + 21, cy, 18, pixel(4 + 2 * (1 + sinf(t * 1.6f))));
      openMouth(cx, cy + 15, 6, pixel(7 + 3 * sinf(t * 1.6f)));
      display.setCursor(104, 8 - pixel(3 * sinf(t * 2)));
      display.print('z');
      break;
    case LOVE: {
      const int16_t size = pixel(10 + 2 * sinf(t * 5.5f));
      heart(cx - 21, cy - 3, size);
      heart(cx + 21, cy - 3, size);
      arc(cx, cy + 17, 9, 4);
      break;
    }
    case DIZZY:
      cx += pixel(2 * sinf(t * 3));
      spiral(cx - 21, cy, t * 3, true);
      spiral(cx + 21, cy, -t * 3, false);
      display.drawLine(cx - 7, 44, cx - 2, 41, SSD1306_WHITE);
      display.drawLine(cx - 2, 41, cx + 2, 45, SSD1306_WHITE);
      display.drawLine(cx + 2, 45, cx + 7, 42, SSD1306_WHITE);
      break;
    case EXCITED:
      cy -= pixel(3 * fabsf(sinf(t * 6)));
      eye(cx - 21, cy, 21, 30);
      eye(cx + 21, cy, 21, 30);
      openMouth(cx, cy + 20, 12, 10);
      display.drawFastVLine(108, 13, 8, SSD1306_WHITE);
      display.drawFastHLine(104, 17, 9, SSD1306_WHITE);
      break;
    case ANGRY:
      cx += pixel(sinf(t * 10));
      eye(cx - 21, cy, 21, 23);
      eye(cx + 21, cy, 21, 23);
      display.fillTriangle(cx - 33, cy - 13, cx - 9, cy - 13,
                            cx - 9, cy - 3, SSD1306_BLACK);
      display.fillTriangle(cx + 9, cy - 13, cx + 33, cy - 13,
                            cx + 9, cy - 3, SSD1306_BLACK);
      arc(cx, 45, 8, -4);
      break;
    case SAD:
      cy += pixel(2 + sinf(t * 1.2f));
      eye(cx - 21, cy, 17, 21);
      eye(cx + 21, cy, 17, 21);
      display.fillTriangle(cx - 31, cy - 12, cx - 12, cy - 12,
                            cx - 31, cy - 3, SSD1306_BLACK);
      display.fillTriangle(cx + 12, cy - 12, cx + 31, cy - 12,
                            cx + 31, cy - 3, SSD1306_BLACK);
      tear(cx + 29, 35 + static_cast<int16_t>((elapsed % 1400) / 90));
      arc(cx, 47, 7, -4);
      break;
    case SURPRISED:
      cy -= pixel(1 + sinf(t * 2.3f));
      eye(cx - 21, cy, 20, 32);
      eye(cx + 21, cy, 20, 32);
      openMouth(cx, cy + 20, 10, pixel(10 + 2 * sinf(t * 3)));
      break;
    case SHY:
      cx += pixel(4 * sinf(t * 1.4f));
      eye(cx - 20, cy + 2, 14, 19);
      eye(cx + 20, cy + 2, 14, 19);
      cheeks(cx - 4, cy + 12);
      barMouth(cx, cy + 22, 6);
      break;
    case SCARED:
      cx += pixel(2 * sinf(t * 24));
      eye(cx - 21, cy, 21, 30);
      eye(cx + 21, cy, 21, 30);
      display.fillRoundRect(cx - 26, cy - 9, 10, 18, 4, SSD1306_BLACK);
      display.fillRoundRect(cx + 16, cy - 9, 10, 18, 4, SSD1306_BLACK);
      tear(cx + 40, 13 + pixel(2 * wave));
      openMouth(cx, cy + 20, 7, 9);
      break;
    case CONFUSED:
      cx += pixel(3 * sinf(t * 1.7f));
      eye(cx - 21, cy + 2, 19, 12);
      eye(cx + 21, cy - 2, 17, 30);
      display.drawLine(cx - 6, 45, cx + 6, 41, SSD1306_WHITE);
      display.drawLine(cx - 6, 46, cx + 6, 42, SSD1306_WHITE);
      display.setCursor(105, 5 + pixel(2 * wave));
      display.print('?');
      break;
    case LAUGH:
      cy += pixel(3 * sinf(t * 8));
      arc(cx - 21, cy, 11, -7);
      arc(cx + 21, cy, 11, -7);
      display.fillRoundRect(cx - 11, cy + 13, 22, 16, 7, SSD1306_WHITE);
      display.fillRect(cx - 11, cy + 12, 22, 5, SSD1306_BLACK);
      break;
    case FOCUSED:
      cx += pixel(4 * sinf(t * 0.8f));
      eye(cx - 21, cy, 21, 8);
      eye(cx + 21, cy, 21, 8);
      barMouth(cx, cy + 19, 13);
      display.drawFastHLine(47, 57, 34, SSD1306_WHITE);
      display.fillRect(47 + static_cast<int16_t>((elapsed / 90) % 30),
                        54, 4, 4, SSD1306_WHITE);
      break;
    default:
      break;
  }

  if (statusVisible) {
    display.fillRect(0, 54, SCREEN_WIDTH, 10, SSD1306_BLACK);
    display.setCursor(automatic ? 52 : 46, 55);
    display.print(automatic ? "AUTO" : "MANUAL");
  }
  display.display();
}

void reportState() {
  Serial.print(F("Expression: "));
  Serial.print(EXPRESSION_NAMES[expression]);
  Serial.print(F(" | mode: "));
  Serial.println(automatic ? F("AUTO (8 s)") : F("MANUAL"));
}

void showStatus(uint32_t now) {
  statusVisible = true;
  statusAt = now;
}

void selectExpression(Expression next, uint32_t now) {
  expression = next;
  expressionAt = now;
  lastAutoAt = now;
  reportState();
}

void handleButton(uint32_t now) {
  const bool sample = digitalRead(BUTTON_PIN) == LOW;
  if (sample != rawPressed) {
    rawPressed = sample;
    rawChangedAt = now;
  }
  if (static_cast<uint32_t>(now - rawChangedAt) >= DEBOUNCE_MS &&
      stablePressed != rawPressed) {
    stablePressed = rawPressed;
    if (stablePressed) {
      pressedAt = now;
      longPressHandled = false;
    } else if (!longPressHandled) {
      automatic = false;
      selectExpression(static_cast<Expression>((expression + 1) % EXPRESSION_COUNT), now);
      showStatus(now);
    }
  }
  if (stablePressed && !longPressHandled &&
      static_cast<uint32_t>(now - pressedAt) >= LONG_PRESS_MS) {
    longPressHandled = true;
    automatic = !automatic;
    lastAutoAt = now;
    showStatus(now);
    reportState();
  }
}

bool beginDisplay() {
  uint8_t address = 0;
  for (uint8_t candidate = 0x3C; candidate <= 0x3D; ++candidate) {
    Wire.beginTransmission(candidate);
    if (Wire.endTransmission() == 0) {
      address = candidate;
      break;
    }
  }
  if (address == 0) {
    Serial.println(F("OLED not found at 0x3C/0x3D. Check 3V3, GND, SDA=6, SCL=7."));
    return false;
  }
  // Wire is already configured with explicit ESP32C3 pins: periphBegin=false.
  if (!display.begin(SSD1306_SWITCHCAPVCC, address, true, false)) {
    Serial.println(F("OLED framebuffer allocation failed."));
    return false;
  }
  display.clearDisplay();
  display.setRotation(0);  // row 0 must stay in the physical top colour band
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setTextWrap(false);
  display.ssd1306_command(SSD1306_SETCONTRAST);
  display.ssd1306_command(0x7F);
  display.display();
  Serial.print(F("SSD1306 128x64 ready at 0x"));
  Serial.println(address, HEX);
  return true;
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  rawPressed = stablePressed = digitalRead(BUTTON_PIN) == LOW;
  Wire.begin(SDA_PIN, SCL_PIN, I2C_HZ);
  Wire.setTimeOut(25);
  const uint32_t now = millis();
  rawChangedAt = pressedAt = expressionAt = lastAutoAt = lastFrameAt = now;
  lastDisplayAttemptAt = statusAt = now;
  Serial.println(F("Pequenito | XIAO ESP32C3 | 16 expressions"));
  displayReady = beginDisplay();
  reportState();
}

void loop() {
  const uint32_t now = millis();
  handleButton(now);
  if (automatic && !stablePressed &&
      static_cast<uint32_t>(now - lastAutoAt) >= AUTO_MS) {
    selectExpression(static_cast<Expression>((expression + 1) % EXPRESSION_COUNT), now);
  }
  if (statusVisible && static_cast<uint32_t>(now - statusAt) >= STATUS_MS) {
    statusVisible = false;
  }
  if (!displayReady &&
      static_cast<uint32_t>(now - lastDisplayAttemptAt) >= 2000) {
    lastDisplayAttemptAt = now;
    displayReady = beginDisplay();
  }
  if (displayReady && static_cast<uint32_t>(now - lastFrameAt) >= FRAME_MS) {
    lastFrameAt = now;  // never queue old frames after a slow I2C transfer
    drawFace(expression, now - expressionAt);
  }
  yield();
}
