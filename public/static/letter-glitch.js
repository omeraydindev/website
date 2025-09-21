class LetterGlitch {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.glitchColors = options.glitchColors || ['#2b4539', '#61dca3'];
    this.glitchSpeed = options.glitchSpeed || 50;
    this.centerVignette = options.centerVignette || false;
    this.outerVignette = options.outerVignette !== false; // default true
    this.smooth = options.smooth !== false; // default true
    this.characters = options.characters || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789';
    
    this.canvas = null;
    this.context = null;
    this.animationId = null;
    this.letters = [];
    this.grid = { columns: 0, rows: 0 };
    this.lastGlitchTime = Date.now();
    this.resizeTimeout = null;
    
    this.fontSize = 16;
    this.charWidth = 10;
    this.charHeight = 20;
    
    this.lettersAndSymbols = Array.from(this.characters);
    
    this.init();
  }
  
  init() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with id "${this.containerId}" not found`);
      return;
    }
    
    this.createElements(container);
    this.setupCanvas();
    this.resizeCanvas();
    this.animate();
    this.setupEventListeners();
  }
  
  createElements(container) {
    // Create main container
    const mainDiv = document.createElement('div');
    mainDiv.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      background-color: #000000;
      overflow: hidden;
    `;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      display: block;
      width: 100%;
      height: 100%;
    `;
    
    mainDiv.appendChild(this.canvas);
    
    // Create vignettes
    if (this.outerVignette) {
      const outerVignette = document.createElement('div');
      outerVignette.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        background: radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%);
      `;
      mainDiv.appendChild(outerVignette);
    }
    
    if (this.centerVignette) {
      const centerVignette = document.createElement('div');
      centerVignette.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        background: radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%);
      `;
      mainDiv.appendChild(centerVignette);
    }
    
    container.appendChild(mainDiv);
  }
  
  setupCanvas() {
    this.context = this.canvas.getContext('2d');
  }
  
  setupEventListeners() {
    const handleResize = () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        cancelAnimationFrame(this.animationId);
        this.resizeCanvas();
        this.animate();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Store cleanup function
    this.cleanup = () => {
      cancelAnimationFrame(this.animationId);
      window.removeEventListener('resize', handleResize);
    };
  }
  
  getRandomChar() {
    return this.lettersAndSymbols[Math.floor(Math.random() * this.lettersAndSymbols.length)];
  }
  
  getRandomColor() {
    return this.glitchColors[Math.floor(Math.random() * this.glitchColors.length)];
  }
  
  hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  interpolateColor(start, end, factor) {
    const result = {
      r: Math.round(start.r + (end.r - start.r) * factor),
      g: Math.round(start.g + (end.g - start.g) * factor),
      b: Math.round(start.b + (end.b - start.b) * factor)
    };
    return `rgb(${result.r}, ${result.g}, ${result.b})`;
  }
  
  calculateGrid(width, height) {
    const columns = Math.ceil(width / this.charWidth);
    const rows = Math.ceil(height / this.charHeight);
    return { columns, rows };
  }
  
  initializeLetters(columns, rows) {
    this.grid = { columns, rows };
    const totalLetters = columns * rows;
    this.letters = Array.from({ length: totalLetters }, () => ({
      char: this.getRandomChar(),
      color: this.getRandomColor(),
      targetColor: this.getRandomColor(),
      colorProgress: 1
    }));
  }
  
  resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    if (this.context) {
      this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const { columns, rows } = this.calculateGrid(rect.width, rect.height);
    this.initializeLetters(columns, rows);
    this.drawLetters();
  }
  
  drawLetters() {
    if (!this.context || this.letters.length === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    this.context.clearRect(0, 0, rect.width, rect.height);
    this.context.font = `${this.fontSize}px monospace`;
    this.context.textBaseline = 'top';

    this.letters.forEach((letter, index) => {
      const x = (index % this.grid.columns) * this.charWidth;
      const y = Math.floor(index / this.grid.columns) * this.charHeight;
      this.context.fillStyle = letter.color;
      this.context.fillText(letter.char, x, y);
    });
  }
  
  updateLetters() {
    if (!this.letters || this.letters.length === 0) return;

    const updateCount = Math.max(1, Math.floor(this.letters.length * 0.05));

    for (let i = 0; i < updateCount; i++) {
      const index = Math.floor(Math.random() * this.letters.length);
      if (!this.letters[index]) continue;

      this.letters[index].char = this.getRandomChar();
      this.letters[index].targetColor = this.getRandomColor();

      if (!this.smooth) {
        this.letters[index].color = this.letters[index].targetColor;
        this.letters[index].colorProgress = 1;
      } else {
        this.letters[index].colorProgress = 0;
      }
    }
  }
  
  handleSmoothTransitions() {
    let needsRedraw = false;
    this.letters.forEach(letter => {
      if (letter.colorProgress < 1) {
        letter.colorProgress += 0.05;
        if (letter.colorProgress > 1) letter.colorProgress = 1;

        const startRgb = this.hexToRgb(letter.color);
        const endRgb = this.hexToRgb(letter.targetColor);
        if (startRgb && endRgb) {
          letter.color = this.interpolateColor(startRgb, endRgb, letter.colorProgress);
          needsRedraw = true;
        }
      }
    });

    if (needsRedraw) {
      this.drawLetters();
    }
  }
  
  animate() {
    const now = Date.now();
    if (now - this.lastGlitchTime >= this.glitchSpeed) {
      this.updateLetters();
      this.drawLetters();
      this.lastGlitchTime = now;
    }

    if (this.smooth) {
      this.handleSmoothTransitions();
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  destroy() {
    if (this.cleanup) {
      this.cleanup();
    }
  }
}

// Auto-initialize if the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('letter-glitch-bg');
  if (container) {
    new LetterGlitch('letter-glitch-bg', {
      glitchSpeed: 80,
      centerVignette: false,
      outerVignette: true,
      smooth: true
    });
  }
});
