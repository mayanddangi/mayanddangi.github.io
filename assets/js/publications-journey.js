(function() {
  "use strict";

  const container = document.querySelector('.publications');
  const wrapper = document.querySelector('.pub-journey-wrapper');
  const svg = document.querySelector('#journey-svg');
  const pathBg = document.querySelector('#journey-path-bg');
  const pathActive = document.querySelector('#journey-path-active');
  const nodes = document.querySelectorAll('.pub-node');
  const bgLayers = document.querySelectorAll('.bg-layer');
  const lunarDisc = document.querySelector('.lunar-disc');

  if (!container || !svg) return;

  // --- Path Generation ---
  function updatePath() {
    const wrapperRect = wrapper.getBoundingClientRect();
    const height = wrapperRect.height;
    const width = wrapperRect.width;
    
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    let d = `M ${width / 2} 0`; // Start top center
    
    nodes.forEach((node, index) => {
      const nodeRect = node.getBoundingClientRect();
      const relativeY = nodeRect.top - wrapperRect.top + nodeRect.height / 2;
      
      // Increased jigglyness and asymmetry
      const offset = (index % 2 === 0 ? 80 : -80); 
      const jitter = (Math.sin(index) * 30);
      
      const prevY = index === 0 ? 0 : (nodes[index-1].getBoundingClientRect().top - wrapperRect.top + nodes[index-1].getBoundingClientRect().height / 2);
      const midY = (prevY + relativeY) / 2;

      // Create an organic curve
      d += ` C ${width / 2 + offset + jitter} ${midY}, ${width / 2 - offset} ${midY}, ${width / 2} ${relativeY}`;
    });

    pathBg.setAttribute('d', d);
    pathActive.setAttribute('d', d);

    // Prepare for drawing animation
    const pathLength = pathActive.getTotalLength();
    pathActive.style.strokeDasharray = pathLength;
    pathActive.style.strokeDashoffset = pathLength;
  }

  // --- Scroll Logic ---
  function handleScroll() {
    const sectionRect = container.getBoundingClientRect();
    const scrollPercent = Math.max(0, Math.min(1, -sectionRect.top / (sectionRect.height - window.innerHeight)));
    
    const pathLength = pathActive.getTotalLength();
    pathActive.style.strokeDashoffset = pathLength * (1 - scrollPercent);

    // Update active nodes and backgrounds
    let activeIndex = -1;
    nodes.forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      const triggerPoint = window.innerHeight * 0.6;
      
      if (rect.top < triggerPoint && rect.bottom > triggerPoint * 0.2) {
        node.classList.add('active');
        activeIndex = index;
      } else {
        node.classList.remove('active');
      }
    });

    if (activeIndex !== -1) {
      const theme = nodes[activeIndex].getAttribute('data-theme');
      updateBackground(theme, nodes[activeIndex]);
    }
  }

  function updateBackground(theme, activeNode) {
    bgLayers.forEach(layer => {
      if (layer.classList.contains(`bg-${theme}`)) {
        layer.classList.add('active');
      } else {
        layer.classList.remove('active');
      }
    });

    // Special Space/Moon logic
    if (theme === 'space') {
      const rect = activeNode.getBoundingClientRect();
      const progress = 1 - (rect.top / window.innerHeight);
      // Rise from deep bottom (-300px) through mid to set
      const travel = (progress * 1100) - 400; 
      lunarDisc.style.transform = `translateX(-50%) translateY(${-travel}px)`;
    }
  }

  // --- Photonic Pulses ---
  function spawnPhoton() {
    const layer = document.querySelector('.bg-photonics');
    if (!layer.classList.contains('active')) return;

    const pulse = document.createElement('div');
    pulse.className = 'photon-pulse';
    pulse.style.left = Math.random() * 100 + '%';
    pulse.style.top = '-20px';
    pulse.style.transition = 'top 2s linear';
    layer.appendChild(pulse);

    setTimeout(() => {
      pulse.style.top = '110%';
    }, 10);

    setTimeout(() => pulse.remove(), 2100);
  }

  function spawnLaser() {
    const layer = document.querySelector('.bg-laser');
    if (!layer.classList.contains('active')) return;

    const beam = document.createElement('div');
    beam.className = 'laser-beam';
    
    // Random position and rotation
    const y = Math.random() * 100;
    const angle = (Math.random() - 0.5) * 10; // Light tilt
    
    beam.style.top = y + '%';
    beam.style.transform = `rotate(${angle}deg)`;
    beam.style.opacity = '0';
    beam.style.transition = 'opacity 0.2s, transform 0.5s ease-out';
    
    layer.appendChild(beam);

    // Flash and sweep
    setTimeout(() => {
      beam.style.opacity = '0.5';
    }, 50);

    setTimeout(() => {
      beam.style.opacity = '0';
    }, 400);

    setTimeout(() => beam.remove(), 600);
  }

  // Init
  window.addEventListener('load', () => {
    updatePath();
    handleScroll();
    setInterval(spawnPhoton, 300);
    setInterval(spawnLaser, 800);
  });
  
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', updatePath);

})();
