import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ParticleBackgroundProps {
  particleCount?: number;
  connectionDistance?: number;
  mouseInfluence?: number;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  particleCount = 200,
  connectionDistance = 150,
  mouseInfluence = 100,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 500;
    cameraRef.current = camera;

    // Renderer setup
    // No MSAA: thin lines on a soft, decorative background do not need it,
    // and it multiplies fill cost at full-screen size.
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particle geometry
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 1000;
      positions[i3 + 1] = (Math.random() - 0.5) * 1000;
      positions[i3 + 2] = (Math.random() - 0.5) * 500;

      velocities[i3] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      sizes[i] = Math.random() * 3 + 1;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Particle material with yellow/orange gradient
    const particleMaterial = new THREE.PointsMaterial({
      size: 3,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
      color: 0xffa500, // Orange color
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Line geometry for connections. Allocated once at the maximum possible
    // size (every pair connected) and drawn with setDrawRange; the previous
    // version built a new JS array every frame and a new GPU buffer whenever
    // the number of connections changed - which was nearly every frame.
    const maxPairs = (particleCount * (particleCount - 1)) / 2;
    const linePositionBuffer = new Float32Array(maxPairs * 6);
    const lineGeometry = new THREE.BufferGeometry();
    const linePositionAttribute = new THREE.BufferAttribute(linePositionBuffer, 3);
    linePositionAttribute.setUsage(THREE.DynamicDrawUsage);
    lineGeometry.setAttribute('position', linePositionAttribute);
    lineGeometry.setDrawRange(0, 0);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffa500,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);
    linesRef.current = lines;

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    // Resize handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      if (!particlesRef.current || !linesRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const maxDistanceSq = connectionDistance * connectionDistance;
      let lineFloats = 0;

      // Update particle positions
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Apply velocity
        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];

        // Mouse interaction
        const dx = mouseRef.current.x * 500 - positions[i3];
        const dy = mouseRef.current.y * 500 - positions[i3 + 1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseInfluence) {
          const force = (1 - distance / mouseInfluence) * 0.5;
          positions[i3] -= dx * force * 0.01;
          positions[i3 + 1] -= dy * force * 0.01;
        }

        // Boundary check
        if (Math.abs(positions[i3]) > 500) velocities[i3] *= -1;
        if (Math.abs(positions[i3 + 1]) > 500) velocities[i3 + 1] *= -1;
        if (Math.abs(positions[i3 + 2]) > 250) velocities[i3 + 2] *= -1;
      }

      // Create connections between nearby particles
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        for (let j = i + 1; j < particleCount; j++) {
          const j3 = j * 3;
          const dx = positions[i3] - positions[j3];
          const dy = positions[i3 + 1] - positions[j3 + 1];
          const dz = positions[i3 + 2] - positions[j3 + 2];
          // Compare squared distances: no square root for ~11k pairs a frame.
          if (dx * dx + dy * dy + dz * dz < maxDistanceSq) {
            linePositionBuffer[lineFloats++] = positions[i3];
            linePositionBuffer[lineFloats++] = positions[i3 + 1];
            linePositionBuffer[lineFloats++] = positions[i3 + 2];
            linePositionBuffer[lineFloats++] = positions[j3];
            linePositionBuffer[lineFloats++] = positions[j3 + 1];
            linePositionBuffer[lineFloats++] = positions[j3 + 2];
          }
        }
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;

      // Upload only the filled part of the preallocated line buffer.
      linePositionAttribute.clearUpdateRanges();
      linePositionAttribute.addUpdateRange(0, lineFloats);
      linePositionAttribute.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineFloats / 3);

      // Rotate particles slowly
      particlesRef.current.rotation.y += 0.0002;

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
    };
  }, [particleCount, connectionDistance, mouseInfluence]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  );
};

export default ParticleBackground;
