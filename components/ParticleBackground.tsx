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
  const animationFrameRef = useRef<number>();

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
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
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

    // Line geometry for connections
    const lineGeometry = new THREE.BufferGeometry();
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
      const linePositions: number[] = [];

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
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < connectionDistance) {
            linePositions.push(
              positions[i3], positions[i3 + 1], positions[i3 + 2],
              positions[j3], positions[j3 + 1], positions[j3 + 2]
            );
          }
        }
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;

      // Update line connections - reuse buffer instead of creating new one
      const lineGeom = linesRef.current.geometry;
      const existingPositions = lineGeom.attributes.position;
      
      if (!existingPositions || existingPositions.array.length !== linePositions.length) {
        // Only create new buffer if size changed
        lineGeom.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(linePositions, 3)
        );
      } else {
        // Reuse existing buffer
        const posArray = existingPositions.array as Float32Array;
        for (let i = 0; i < linePositions.length; i++) {
          posArray[i] = linePositions[i];
        }
        existingPositions.needsUpdate = true;
      }

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
