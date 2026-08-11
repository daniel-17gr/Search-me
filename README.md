# 🐾 Search Me - Cute Companion & Smart Search New Tab Extension

**Search Me** is a minimalist, elegant Chrome New Tab extension (Manifest V3) featuring an interactive companion cat, double-click physics toy balls, real-time multi-ball textfield reflections, customizable website shortcuts, and smooth 3D parallax depth effects.

---

## ✨ Features

### 🐈 1. Interactive Companion Cat
* **Natural Animations**: Periodic eye blinking, blush cheek pads, and soft fur details.
* **Smart States**:
  * **Idle / Sleep**: Sleep mode (`z z z`) activates after 9 seconds of inactivity (even while focused on the search field).
  * **Hover / Cuddle**: Hovering over the cat causes happy curved eyes and purring expressions without body jolts.
  * **Typing & Backspace**: Eyes stay wide open while typing, with a annoyed squint when backspacing repeatedly.
  * **Directional Swatting / Kicking**: When balls settle on the search bar, the cat trots over and swats with her **left leg** for left-side pushes and **right leg** for right-side pushes!

### 🎾 2. Double-Click Physics Toy Ball Engine
* **Double-Click Spawning**: Double-click anywhere on the new tab page to spawn vibrant toy balls.
* **Textbook 2D Elastic Vector Collisions**: Realistic billiard-style momentum exchange along normal and tangential vectors (`0.96` restitution).
* **Smooth Surface Rolling**: Realistic friction (`0.985`) allows balls to roll across the entire search bar and slide off the 26px rounded pill ends under natural gravity.
* **AABB Cat Box Collision**: Solid outer boundary preventing balls from ever clipping into or overlapping the cat.
* **Organic Reaction Delays**: The cat tracks settled balls with her eyes and pauses for a random reaction delay (850ms–2500ms) before trotting over to clear them.
* **Thought Bubbles**: Random cute cat thoughts (*"ball! 🧶"*, *"catch! 🐾"*, *"got it! ⚡"*, *"nya! ✨"*).

### 💡 3. Multi-Ball Textfield Reflection Surface
* **Real-time Surface Lighting**: A dedicated `<div class="search-form-reflection">` layer renders multi-stop radial gradients matching the color of every ball resting on or near the search bar.
* **Zero Lag Performance**: The ball elements maintain simple, hardware-accelerated drop shadows (`will-change: left, top`), while surface reflections fade out instantly when balls drop below the search bar.

### 🔗 4. Customizable Lowercase Shortcuts
* **Default Top 5 Links**: Includes `youtube` • `x` • `gmail` • `github` • `gemini` by default.
* **Settings Dialog**: Click the floating paw print icon in the bottom-left corner to add, edit, or delete links.
* **Auto Domain Title Extraction**: Inputting any URL (e.g. `https://news.ycombinator.com`) automatically extracts a clean lowercase name (`ycombinator`).
* **Persistent Storage**: Custom shortcuts persist across sessions via `chrome.storage.local`.
* **Animated Underlines**: Sleek `cubic-bezier` expanding underlines on link hover.

### 🎨 5. Theme-Adaptive Extension Icon
* **Dynamic Palette Switcher**: Automatically switches extension icons (`_light` dark paw for Light Chrome toolbars, `_dark` white paw for Dark Chrome toolbars) based on `prefers-color-scheme`.

### 🌌 6. 3D Parallax Mouse Depth
* **LERP Interpolation**: Mouse movement uses linear interpolation (`current += (target - current) * 0.12`) inside `requestAnimationFrame` for jitter-free 3D depth translation even on high-refresh 1000Hz+ gaming mice.

---

## 🚀 Installation Guide

1. Download or clone this repository to your local machine:
   ```bash
   git clone https://github.com/daniel-17gr/Search-me.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `Search Me` project directory.
6. Open a new tab in Chrome to meet your new cat companion!

---

## 📁 Project File Structure

```
Search Me/
├── manifest.json         # Chrome Extension Manifest V3 configuration
├── newtab.html           # New Tab page layout, SVG graphics & CSS styles
├── newtab.js             # Core physics engine, state machine, shortcuts & animation loop
├── background.js         # Service Worker for CORS-free autocomplete & theme icon switcher
├── icons/                # Extension icon assets (16x16, 32x32, 48x48, 128x128 light & dark)
│   ├── icon16.png
│   ├── icon16_light.png
│   ├── icon16_dark.png
│   ├── icon32.png
│   ├── icon32_light.png
│   ├── icon32_dark.png
│   ├── icon48.png
│   ├── icon48_light.png
│   ├── icon48_dark.png
│   ├── icon128.png
│   ├── icon128_light.png
│   └── icon128_dark.png
└── README.md             # Documentation
```

---

## 🛠️ Built With

* **HTML5 & SVG**: Vector cat graphics, layered UI components, and semantic markup.
* **Vanilla CSS3**: CSS Variables, `cubic-bezier` motion graphs, glassmorphism (`backdrop-filter`), and GPU compositor optimizations (`will-change`).
* **JavaScript (ES6+)**: Custom state machine, 2D vector momentum physics engine, `requestAnimationFrame` loop, and Chrome Extension APIs (`chrome.storage.local`, `chrome.action`, `chrome.runtime`).

---

## 📄 License

MIT License. Built with ❤️ for Chrome users who love cats and clean design.
