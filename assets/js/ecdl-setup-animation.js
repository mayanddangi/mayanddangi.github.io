const ECDLSimulation = {
  init() {
    const canvas = document.getElementById('ecdl-bg-canvas');
    if (!canvas) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050a14); // Deep space blue/black

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(40, 30, 60);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.enableZoom = false;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(20, 50, 20);
    this.scene.add(pointLight);

    // Build Setup
    this.buildSetup();

    // Loop
    this.clock = new THREE.Clock();
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

  buildSetup() {
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.3 });
    const laserMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });

    // 1. Laser Diode & Mount
    const diodeMount = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), metalMat);
    diodeMount.position.x = -20;
    this.scene.add(diodeMount);

    const diodeHole = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 16), new THREE.MeshStandardMaterial({color: 0x111111}));
    diodeHole.rotation.z = Math.PI/2;
    diodeHole.position.set(-15, 0, 0);
    this.scene.add(diodeHole);

    // 2. Collimation Lens
    const lens = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), glassMat);
    lens.scale.x = 0.2;
    lens.position.x = -10;
    this.scene.add(lens);

    // 3. Diffraction Grating (Littrow Mount)
    const gratingGroup = new THREE.Group();
    const gratingPlate = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 1), metalMat);
    gratingGroup.add(gratingPlate);

    // Draw lines on grating to simulate texture
    const lineMat = new THREE.LineBasicMaterial({ color: 0x444444 });
    for (let i = -5; i <= 5; i++) {
        const points = [new THREE.Vector3(i, -5.5, 0.51), new THREE.Vector3(i, 5.5, 0.51)];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeo, lineMat);
        gratingGroup.add(line);
    }
    
    // Littrow angle for 852nm and 1800 lines/mm is roughly 50 deg
    gratingGroup.position.set(20, 0, 0);
    gratingGroup.rotation.y = -Math.PI / 3.5; // Visual Littrow tilt
    this.scene.add(gratingGroup);

    // 4. Laser Beams
    // Main Beam (Diode to Grating)
    const beamGeo = new THREE.CylinderGeometry(0.4, 0.4, 38, 16);
    beamGeo.rotateZ(Math.PI/2);
    const beam = new THREE.Mesh(beamGeo, laserMat);
    beam.position.x = 2; // centered between diode and grating
    this.scene.add(beam);

    // Feedback Beam (Reflected back)
    const feedbackGeo = new THREE.CylinderGeometry(0.3, 0.3, 38, 16);
    feedbackGeo.rotateZ(Math.PI/2);
    const feedback = new THREE.Mesh(feedbackGeo, new THREE.MeshBasicMaterial({color: 0xff4444, transparent:true, opacity:0.4}));
    feedback.position.x = 2;
    feedback.position.y = 0.5; // slight offset for visualization
    this.scene.add(feedback);

    // Output Beam (Diffracted order 0)
    const outputGeo = new THREE.CylinderGeometry(0.4, 0.4, 40, 16);
    outputGeo.rotateZ(-Math.PI / 6);
    const outputBeam = new THREE.Mesh(outputGeo, laserMat);
    outputBeam.position.set(35, 15, 0);
    this.scene.add(outputBeam);
  },

  animate() {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
};

document.addEventListener('DOMContentLoaded', () => {
    ECDLSimulation.init();
});
