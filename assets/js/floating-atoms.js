class FloatingAtoms {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.atoms = [];
    this.numAtoms = 40; // Number of floating atoms
    
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.time = 0;
    this.initAtoms();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    // Don't re-init immediately on resize to prevent resetting positions, just ensure bounds
  }

  initAtoms() {
    this.atoms = [];
    for (let i = 0; i < this.numAtoms; i++) {
        this.addAtom(true);
    }
  }

  addAtom(randomY = false) {
      // Create a floating atom
      this.atoms.push({
          x: Math.random() * this.canvas.width,
          y: randomY ? Math.random() * this.canvas.height : this.canvas.height + 20,
          speedY: -Math.random() * 0.3 - 0.1, // Float slowly upwards
          speedX: (Math.random() - 0.5) * 0.2, // Drift sideways
          radius: Math.random() * 2 + 1,
          phase: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.02 + 0.01,
          colorType: Math.random() > 0.5 ? 'cyan' : 'red'
      });
  }

  animate() {
    // Clear canvas so the underlying CSS grid shows through
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.time += 0.01;

    for (let i = 0; i < this.atoms.length; i++) {
      let atom = this.atoms[i];
      
      // Update position
      atom.y += atom.speedY;
      atom.x += atom.speedX + Math.sin(this.time * atom.wobbleSpeed + atom.phase) * 0.3;
      
      // Wrap around or remove
      if (atom.y < -20) {
          this.atoms.splice(i, 1);
          i--;
          this.addAtom();
          continue;
      }
      
      // Draw atom
      this.ctx.beginPath();
      this.ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
      
      let baseR, baseG, baseB;
      if (atom.colorType === 'cyan') {
          baseR = 0; baseG = 255; baseB = 200;
      } else {
          baseR = 255; baseG = 50; baseB = 80;
      }

      this.ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, 0.8)`;
      this.ctx.fill();
      
      // Draw glow
      this.ctx.beginPath();
      this.ctx.arc(atom.x, atom.y, atom.radius * 3, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, 0.15)`;
      this.ctx.fill();
    }

    requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener("DOMContentLoaded", () => {
    new FloatingAtoms("floating-atoms-canvas");
});
