class QubitGrid {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.qubits = [];
    this.spacing = 60; // spacing between optical tweezers
    
    this.mouseX = -1000;
    this.mouseY = -1000;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });
    window.addEventListener('mouseleave', () => {
      this.mouseX = -1000;
      this.mouseY = -1000;
    });

    this.time = 0;
    this.initGrid();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.initGrid();
  }

  initGrid() {
    this.qubits = [];
    const cols = Math.floor(this.canvas.width / this.spacing) + 2;
    const rows = Math.floor(this.canvas.height / this.spacing) + 2;
    
    const offsetX = (this.canvas.width - (cols - 1) * this.spacing) / 2;
    const offsetY = (this.canvas.height - (rows - 1) * this.spacing) / 2;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // Base coordinate with optical tweezer defect chance (simulate 3D array or partial fill)
        if (Math.random() < 0.1) continue; // 10% empty trap

        this.qubits.push({
          targetX: offsetX + i * this.spacing,
          targetY: offsetY + j * this.spacing,
          x: offsetX + i * this.spacing,
          y: offsetY + j * this.spacing,
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          state: 0, // 0 to 1 representing excitation
          colIdx: i,
          rowIdx: j
        });
      }
    }
  }

  animate() {
    this.ctx.fillStyle = 'rgba(10, 15, 30, 0.3)'; // Deep dark bg for fade effect
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.time += 0.007; // Slower time step
    
    // Sweeping sensing wave
    const waveX = (Math.sin(this.time * 0.5) * 0.5 + 0.5) * this.canvas.width;

    // First draw connections (Rydberg interactions)
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.qubits.length; i++) {
      let q1 = this.qubits[i];
      for (let j = i + 1; j < this.qubits.length; j++) {
        let q2 = this.qubits[j];
        
        let dx = q1.x - q2.x;
        let dy = q1.y - q2.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.spacing * 1.5) {
          // Both atoms high state = strong connection
          let connectionStrength = (q1.state * q2.state);
          if (connectionStrength > 0.1) {
             this.ctx.beginPath();
             this.ctx.moveTo(q1.x, q1.y);
             this.ctx.lineTo(q2.x, q2.y);
             this.ctx.strokeStyle = `rgba(0, 255, 200, ${connectionStrength * 0.5})`;
             this.ctx.stroke();
          }
        }
      }
    }

    // Draw atoms
    for (let q of this.qubits) {
      // Small thermal motion inside optical trap
      q.x = q.targetX + Math.sin(this.time + q.phaseX) * 3;
      q.y = q.targetY + Math.cos(this.time + q.phaseY) * 3;
      
      // Calculate excitation state based on sensing wave and mouse proximity
      let distToWave = Math.abs(q.x - waveX);
      let waveExcitation = Math.max(0, 1 - distToWave / 150);
      
      let distToMouse = Math.sqrt((q.x - this.mouseX)**2 + (q.y - this.mouseY)**2);
      let mouseExcitation = Math.max(0, 1 - distToMouse / 150);
      
      // Random sporadic fluctuations
      if (Math.random() < 0.002) {
        q.state = 1.0;
      }
      
      // Decay state towards wave + mouse influence
      let targetState = Math.max(waveExcitation, mouseExcitation);
      q.state += (targetState - q.state) * 0.025; // Smoother state transitions
      
      // Draw optical tweezer trap 
      this.ctx.beginPath();
      this.ctx.arc(q.targetX, q.targetY, 15, 0, Math.PI * 2);
      const grad = this.ctx.createRadialGradient(q.targetX, q.targetY, 0, q.targetX, q.targetY, 15);
      grad.addColorStop(0, 'rgba(255, 50, 50, 0.05)');
      grad.addColorStop(1, 'rgba(255, 50, 50, 0)');
      this.ctx.fillStyle = grad;
      this.ctx.fill();

      // Draw the atom
      let atomRadius = 2 + q.state * 3;
      this.ctx.beginPath();
      this.ctx.arc(q.x, q.y, atomRadius, 0, Math.PI * 2);
      
      // Ground state = red (e.g. rubidium), Excited/Sensing = Cyan/Blue
      let r = Math.floor(255 - q.state * 200);
      let g = Math.floor(50 + q.state * 205);
      let b = Math.floor(50 + q.state * 205);
      
      this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      this.ctx.fill();
      
      if (q.state > 0.1) {
        this.ctx.beginPath();
        this.ctx.arc(q.x, q.y, atomRadius * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${q.state * 0.3})`;
        this.ctx.fill();
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener("DOMContentLoaded", () => {
    new QubitGrid("qubit-canvas");
});
