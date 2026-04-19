const LockingSimulation = {
  init() {
    const canvas = document.getElementById('locking-bg-canvas');
    if (!canvas) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 100);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Build HUD Elements
    this.buildHUD();

    this.isLocked = false;
    this.lockTimer = 0;

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    });
  },

  buildHUD() {
    // 1. Diagnostic Rings
    const ringGeo = new THREE.TorusGeometry(30, 0.1, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffc8, transparent: true, opacity: 0.1 });
    this.outerRing = new THREE.Mesh(ringGeo, ringMat);
    this.scene.add(this.outerRing);

    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(28, 0.05, 16, 100), new THREE.MeshBasicMaterial({ color: 0x00ffc8, transparent: true, opacity: 0.2 }));
    innerRing.rotation.x = Math.PI / 2;
    this.scene.add(innerRing);

    // 2. The Oscilloscope Signal Line
    this.signalPoints = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.signalPoints * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({ color: 0x00ffc8, linewidth: 2 });
    this.signalLine = new THREE.Line(geometry, material);
    this.scene.add(this.signalLine);

    // 3. Status Labels (Simple Sprites or Planes)
    const createLabel = (text, color) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 256; canvas.height = 64;
      ctx.fillStyle = color;
      ctx.font = 'bold 30px Courier New';
      ctx.fillText(text, 10, 40);
      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(20, 5, 1);
      return sprite;
    };

    this.statusSprite = createLabel('UNLOCKED', '#ff3300');
    this.statusSprite.position.set(0, 35, 0);
    this.scene.add(this.statusSprite);

    this.pidSprite = createLabel('P: 1.2 I: 0.8 D: 0.5', '#00ffc8');
    this.pidSprite.position.set(0, -35, 0);
    this.scene.add(this.pidSprite);
  },

  updateSignal(time) {
    const pos = this.signalLine.geometry.attributes.position.array;
    this.lockTimer += 0.01;
    
    // Cycle locking every 10 seconds
    if (this.lockTimer > 10) {
        this.isLocked = !this.isLocked;
        this.lockTimer = 0;
        
        // Update label color/text
        const canvas = this.statusSprite.material.map.image;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,256,64);
        ctx.fillStyle = this.isLocked ? '#00ffc8' : '#ff3300';
        ctx.fillText(this.isLocked ? 'SYSTEM LOCKED' : 'SYNC ERROR: NO LOCK', 10, 40);
        this.statusSprite.material.map.needsUpdate = true;
    }

    const noiseLevel = this.isLocked ? 0.05 : 2.5;
    const drift = this.isLocked ? 0 : Math.sin(time * 0.5) * 5;

    for (let i = 0; i < this.signalPoints; i++) {
      const x = (i - this.signalPoints/2) * 0.5;
      const y = Math.sin(x * 0.2 + time * 5) * 5 + drift + (Math.random() - 0.5) * noiseLevel;
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = 0;
    }
    this.signalLine.geometry.attributes.position.needsUpdate = true;
  },

  animate() {
    requestAnimationFrame(this.animate);
    const time = performance.now() * 0.001;

    this.updateSignal(time);
    
    this.outerRing.rotation.y += 0.01;
    this.outerRing.rotation.z += 0.005;

    this.renderer.render(this.scene, this.camera);
  }
};

document.addEventListener('DOMContentLoaded', () => {
    LockingSimulation.init();
});
