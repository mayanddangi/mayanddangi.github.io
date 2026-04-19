const AFRSimulation = {
  init() {
    const canvas = document.getElementById('afr-bg-canvas');
    if (!canvas) return;

    // Set canvas dimensions to full screen
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Scene setup
    this.scene = new THREE.Scene();
    // Keep it transparent so CSS styles show through if needed, 
    // but the user wants "black" style, so let's set it here too.
    this.scene.background = new THREE.Color(0x050505);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 50, 60);
    this.camera.lookAt(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // OrbitControls - making it interactive even in background
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true; 
    this.controls.autoRotateSpeed = 0.3;
    this.controls.enableZoom = false; // Prevent zoom from interfering with scrolling
    this.controls.maxPolarAngle = Math.PI / 2.1;

    // Grid Helper (F1 / Dark Red aesthetic)
    const gridHelper = new THREE.GridHelper(150, 30, 0x440000, 0x111111);
    gridHelper.position.y = -5;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.15;
    this.scene.add(gridHelper);

    // Setup 3D objects
    this.buildTrack();

    // Start animation loop
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Handle Resize
    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    });
  },

  buildTrack() {
    // Formula 1 Track Spline (Race Circuit Loop)
    const points = [
      new THREE.Vector3( 0, 0, 30),
      new THREE.Vector3( 20, 0, 25),
      new THREE.Vector3( 35, 0, 10),
      new THREE.Vector3( 30, 0, -15),
      new THREE.Vector3( 10, 0, -30),
      new THREE.Vector3(-15, 0, -35),
      new THREE.Vector3(-35, 0, -15),
      new THREE.Vector3(-30, 0, 10),
      new THREE.Vector3(-15, 0, 25),
      new THREE.Vector3( 0, 0, 30) 
    ];

    this.curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);

    // Track Geometry (Tube - darkened wireframe)
    const tubeGeo = new THREE.TubeGeometry(this.curve, 200, 1.5, 8, true);
    const tubeMat = new THREE.MeshBasicMaterial({ 
        color: 0x444444, // Brighter wireframe
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    this.scene.add(tubeMesh);

    // Center Race Line (F1 Red)
    const linePoints = this.curve.getSpacedPoints(200);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 1.0 // High-torque red center line
    });
    const centerLine = new THREE.Line(lineGeo, lineMat);
    centerLine.position.y = 0.1;
    this.scene.add(centerLine);

    // --- Racing F1 Cars (Procedural Low-Poly)
    this.cars = [];
    
    const createF1Car = (color) => {
      const group = new THREE.Group();
      
      const mat = new THREE.MeshBasicMaterial({ color });
      const tireMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
      const wingMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 });

      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 3), mat);
      group.add(body);

      // Cockpit
      const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.8), mat);
      cockpit.position.y = 0.3;
      cockpit.position.z = -0.2;
      group.add(cockpit);

      // Front Wing
      const fWing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.6), wingMat);
      fWing.position.z = 1.6;
      fWing.position.y = -0.1;
      group.add(fWing);

      // Rear Wing
      const rWing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.8), wingMat);
      rWing.position.z = -1.4;
      rWing.position.y = 0.5;
      group.add(rWing);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
      [[-1.1, 1.2], [1.1, 1.2], [-1.1, -1.2], [1.1, -1.2]].forEach(([x, z]) => {
        const wheel = new THREE.Mesh(wheelGeo, tireMat);
        wheel.position.set(x, -0.1, z);
        wheel.rotation.z = Math.PI / 2;
        group.add(wheel);
      });

      return group;
    };

    // Spawn 3 cars
    const redCar = createF1Car(0xff0000);
    this.scene.add(redCar);
    this.cars.push({ mesh: redCar, t: 0, speed: 0.0012 });

    const whiteCar = createF1Car(0xffffff);
    this.scene.add(whiteCar);
    this.cars.push({ mesh: whiteCar, t: 0.35, speed: 0.0015 });

    const redCar2 = createF1Car(0xff0000);
    this.scene.add(redCar2);
    this.cars.push({ mesh: redCar2, t: 0.7, speed: 0.0011 });
  },

  animate() {
    requestAnimationFrame(this.animate);
    this.controls.update();

    if (this.curve) {
      for (let car of this.cars) {
        car.t += car.speed;
        if (car.t > 1) car.t = 0;

        let pos = this.curve.getPointAt(car.t);
        let tangent = this.curve.getTangentAt(car.t);
        
        car.mesh.position.copy(pos);
        car.mesh.position.y = 0.8;
        car.mesh.lookAt(pos.clone().add(tangent));
        // Rotate 180 as lookAt points +Z but our F1 car front is +Z? 
        // Let's check. If it's backward, we rotate.
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
};

document.addEventListener('DOMContentLoaded', () => {
    AFRSimulation.init();
});
