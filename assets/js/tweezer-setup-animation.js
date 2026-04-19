class OpticalTweezers3D {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    // Three.js Core
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050810);
    
    // Add grid floor
    const gridHelper = new THREE.GridHelper(50, 50, 0x00ffc8, 0x222222);
    gridHelper.position.y = -5;
    this.scene.add(gridHelper);

    this.camera = new THREE.PerspectiveCamera(45, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
    this.camera.position.set(-15, 20, 25);
    
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(5, 0, 5);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 20, 10);
    this.scene.add(pointLight);

    // Materials
    this.glassMat = new THREE.MeshPhysicalMaterial({ 
        transmission: 0.9, opacity: 1, metalness: 0.1, roughness: 0.1, ior: 1.5,
        color: 0x88bbff, transparent: true 
    });
    this.lensMat = new THREE.MeshPhysicalMaterial({
        transmission: 0.95, opacity: 1, metalness: 0.2, roughness: 0.05,
        color: 0xaaccff, transparent: true
    });
    this.mirrorMat = new THREE.MeshStandardMaterial({
        color: 0x888888, metalness: 1.0, roughness: 0.1
    });

    // Animation state
    this.time = 0;
    this.stage = 0;
    this.stageTime = 0;
    this.traps = [];
    this.atoms = [];
    
    this.buildMacroOptics();
    this.initMicroGrid();

    // Handle Resize
    window.addEventListener('resize', this.resize.bind(this));

    this.animate();
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.renderer.setSize(parent.clientWidth, parent.clientHeight);
    this.camera.aspect = parent.clientWidth / parent.clientHeight;
    this.camera.updateProjectionMatrix();
  }

  buildMacroOptics() {
    this.macroGroup = new THREE.Group();
    this.scene.add(this.macroGroup);

    // Coordinate mapping: Laser starts at (-15, 0, -10). Shoots forward (+Z) to (-15, 0, 10).
    // SLM at (-15, 0, 10). SLM angled so beam reflects right (+X) to (15, 0, 10).
    
    // Laser Box
    const laserGeo = new THREE.BoxGeometry(4, 3, 6);
    const laserMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
    laserMesh.position.set(-15, 0, -13);
    this.macroGroup.add(laserMesh);

    // PBS
    const pbsGeo = new THREE.BoxGeometry(2, 2, 2);
    const pbsMesh = new THREE.Mesh(pbsGeo, this.glassMat);
    pbsMesh.position.set(-15, 0, -5);
    this.macroGroup.add(pbsMesh);

    // Expander Lenses
    const ex1Geo = new THREE.CylinderGeometry(1.5, 1.5, 0.4, 32);
    const ex1 = new THREE.Mesh(ex1Geo, this.lensMat);
    ex1.position.set(-15, 0, 0);
    ex1.rotation.x = Math.PI/2;
    this.macroGroup.add(ex1);

    const ex2Geo = new THREE.CylinderGeometry(2.5, 2.5, 0.6, 32);
    const ex2 = new THREE.Mesh(ex2Geo, this.lensMat);
    ex2.position.set(-15, 0, 4);
    ex2.rotation.x = Math.PI/2;
    this.macroGroup.add(ex2);

    // SLM Mirror
    const slmGeo = new THREE.BoxGeometry(6, 4, 0.5);
    this.slmMesh = new THREE.Mesh(slmGeo, this.mirrorMat);
    this.slmMesh.position.set(-15, 0, 10);
    this.slmMesh.rotation.y = -Math.PI / 4; // 45 deg to reflect Z to +X
    this.macroGroup.add(this.slmMesh);

    // Objective Lens
    const objGeo = new THREE.SphereGeometry(2.5, 32, 32);
    // Squash sphere to look like convex lens
    objGeo.scale(0.3, 1, 1);
    const objLens = new THREE.Mesh(objGeo, this.lensMat);
    objLens.position.set(-3, 0, 10);
    this.macroGroup.add(objLens);

    // Glass Cell Container (Micro Target)
    const cellGeo = new THREE.BoxGeometry(10, 6, 10);
    const cellMesh = new THREE.Mesh(cellGeo, new THREE.MeshPhysicalMaterial({
        transmission: 0.8, opacity: 0.5, color: 0x444444, transparent: true
    }));
    cellMesh.position.set(10, 0, 10);
    this.macroGroup.add(cellMesh);

    // Laser Beams (Hidden initially)
    this.beam1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 23, 16),
        new THREE.MeshBasicMaterial({ color: 0xff003c, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending })
    );
    this.beam1.rotation.x = Math.PI/2;
    this.beam1.position.set(-15, 0, -1.5); // Center point of (-13 to 10)
    // We scale.y to 0 to hide it
    this.beam1.scale.set(1, 0.001, 1);
    this.macroGroup.add(this.beam1);

    // Expanded beam segment
    this.beam2 = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 6, 32),
        new THREE.MeshBasicMaterial({ color: 0xff003c, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending })
    );
    this.beam2.rotation.x = Math.PI/2;
    this.beam2.position.set(-15, 0, 7);
    this.beam2.scale.set(1, 0.001, 1);
    this.macroGroup.add(this.beam2);

    // Reflected Wide Beam to Objective
    this.beam3 = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 12, 32),
        new THREE.MeshBasicMaterial({ color: 0xff003c, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending })
    );
    this.beam3.rotation.z = Math.PI/2;
    this.beam3.position.set(-9, 0, 10); // Between SLM (-15) and Objective (-3)
    this.beam3.scale.set(1, 0.001, 1);
    this.macroGroup.add(this.beam3);
  }

  initMicroGrid() {
    this.microGroup = new THREE.Group();
    // We keep microGroup at 0,0,0 and position objects absolutely
    this.scene.add(this.microGroup);

    this.traps = [];
    this.atoms = [];
    const gridSize = 4;
    const spacing = 1.5;
    const startOffset = -((gridSize-1) * spacing) / 2;

    const trapGeo = new THREE.ConeGeometry(0.6, 13, 12, 1, true);
    // Orient cone so tip points towards +Z, since Object3D.lookAt aligns +Z to the target
    trapGeo.rotateX(Math.PI / 2); 

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Traps visual (glowing focused cones from objective to cell)
        // Additive blending creates intense hot-spot at the tip where density is highest
        let trapMesh = new THREE.Mesh(
            trapGeo,
            new THREE.MeshBasicMaterial({ color: 0xff003c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        let basey = startOffset + r * spacing;
        let basez = startOffset + c * spacing + 10;
        
        let S = new THREE.Vector3(-3, basey, basez); // Offset Origin mapped to Lens Pupil
        let E = new THREE.Vector3(10, basey, basez); // Atom Position
        
        // Midpoint and aim
        trapMesh.position.copy(S).add(E).multiplyScalar(0.5);
        trapMesh.lookAt(E);
        
        this.microGroup.add(trapMesh);

        this.traps.push({
          id: r * gridSize + c,
          mesh: trapMesh,
          y: basey,
          z: basez,
          baseY: basey, // static lens origin
          baseZ: basez,
          targetY: basey,
          targetZ: basez,
          active: false
        });
      }
    }
  }

  dropAtoms() {
    const atomGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const atomMat = new THREE.MeshBasicMaterial({ color: 0x00ffc8 });

    let aId = 0;
    for (let t of this.traps) {
      if (Math.random() > 0.5) { // 50% probability
        let aMesh = new THREE.Mesh(atomGeo, atomMat);
        aMesh.position.set(10, t.y + 4, t.z); // Start high and drop along Y
        this.microGroup.add(aMesh);
        
        // Fluorescence Ring
        let ringMesh = new THREE.Mesh(
            new THREE.TorusGeometry(0.5, 0.05, 16, 32),
            new THREE.MeshBasicMaterial({ color: 0x00ffc8, transparent: true, opacity: 0 })
        );
        // Align ring to X-axis facing observer
        ringMesh.rotation.y = Math.PI/2;
        aMesh.add(ringMesh);

        this.atoms.push({
          id: aId++,
          trapId: t.id,
          mesh: aMesh,
          ring: ringMesh,
          yVel: 0
        });
      }
    }
  }

  clearMicroGrid() {
    for (let a of this.atoms) {
        this.microGroup.remove(a.mesh);
    }
    this.atoms = [];
    // Reset traps
    for (let t of this.traps) {
        t.mesh.material.opacity = 0;
        t.targetY = t.y;
        t.targetZ = t.z;
    }
  }

  logicLayer() {
    this.stageTime++;

    if (this.stage === 0) {
      // Init / Reset
      this.clearMicroGrid();
      this.beam1.scale.y = 0.001; this.beam2.scale.y = 0.001; this.beam3.scale.y = 0.001;
      this.slmMesh.material.color.setHex(0x888888);
      if (this.stageTime > 30) {
          this.stage = 1;
          this.stageTime = 0;
      }
    } 
    else if (this.stage === 1) {
      // Laser Fire
      let p = this.stageTime / 60;
      if (p <= 1) {
         this.beam1.scale.y = p;
         this.beam2.scale.y = p;
         this.beam3.scale.y = p;
      } else {
         this.stage = 2; // Traps appear
         this.stageTime = 0;
         for (let t of this.traps) t.mesh.material.opacity = 0.4; // Slightly brighter since they are disjoint at origins
      }
    }
    else if (this.stage === 2) {
      // Drop Atoms
      if (this.stageTime === 1) this.dropAtoms();
      
      let allSettled = true;
      for (let a of this.atoms) {
          let tY = this.traps[a.trapId].y; // target settle Y
          if (a.mesh.position.y > tY) {
              a.yVel += 0.01;
              a.mesh.position.y -= a.yVel;
              allSettled = false;
          } else {
              a.mesh.position.y = tY;
              // Brownian jitter
              a.mesh.position.y += (Math.random()-0.5)*0.1;
              a.mesh.position.z = this.traps[a.trapId].z + (Math.random()-0.5)*0.1;
          }
      }

      if (allSettled && this.stageTime > 60) {
          this.stage = 3;
          this.stageTime = 0;
      }
    }
    else if (this.stage === 3) {
       // Fluorescence
       for (let a of this.atoms) {
           a.ring.material.opacity -= 0.02;
           a.ring.scale.addScalar(0.05);
           if (a.ring.material.opacity <= 0) {
               a.ring.material.opacity = 1;
               a.ring.scale.set(1,1,1);
           }
       }
       if (this.stageTime > 100) {
           this.stage = 4;
           this.stageTime = 0;
           // Stop fluorescence
           for (let a of this.atoms) a.ring.material.opacity = 0;
           
           // Hungarian Setup (consolidate to top-left / center)
           let targets = [];
           for(let i=0; i<this.atoms.length; i++) targets.push(i);
           for(let i=0; i<this.atoms.length; i++) {
               let targetBase = this.traps[targets[i]];
               let curTrap = this.traps[this.atoms[i].trapId];
               curTrap.targetY = targetBase.y;
               curTrap.targetZ = targetBase.z;
           }
       }
    }
    else if (this.stage === 4) {
       // Moving Traps
       // SLM shimmering
       let shim = Math.sin(this.time * 20) * 0.2 + 0.5;
       this.slmMesh.material.color.setHSL(0.5, 0.5, shim);

       let allArrived = true;
       for (let t of this.traps) {
           t.y += (t.targetY - t.y) * 0.02;
           t.z += (t.targetZ - t.z) * 0.02;
           
           // Dynamically aim and place cone
           let S = new THREE.Vector3(-3, t.baseY, t.baseZ); // Ground origin to fixed point on Lens
           let E = new THREE.Vector3(10, t.y, t.z);
           t.mesh.position.copy(S).add(E).multiplyScalar(0.5);
           t.mesh.lookAt(E);

           if (Math.abs(t.y - t.targetY) > 0.05 || Math.abs(t.z - t.targetZ) > 0.05) {
               allArrived = false;
           }
       }
       // Move atoms attached to traps
       for (let a of this.atoms) {
           let ct = this.traps[a.trapId];
           a.mesh.position.y = ct.y;
           a.mesh.position.z = ct.z;
       }

       if (allArrived && this.stageTime > 60) {
           this.stage = 5;
           this.stageTime = 0;
           this.slmMesh.material.color.setHex(0x888888);
       }
    }
    else if (this.stage === 5) {
       // Hold and restart
       if (this.stageTime > 150) {
           this.stage = 0;
           this.stageTime = 0;
       }
    }
  }

  animate() {
    this.time += 0.01;
    this.logicLayer();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener("DOMContentLoaded", () => {
    new OpticalTweezers3D("tweezer-setup-canvas");
});
