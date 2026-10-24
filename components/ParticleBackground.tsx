import React, { useEffect, useRef } from 'react';

interface ParticleBackgroundProps {
  particleCount?: number;
  connectionDistance?: number;
  mouseInfluence?: number;
}

// The scene is the one three.js used to draw: a 1000 x 1000 x 500 box of
// particles seen by a 75 degree perspective camera at z = 500, turning slowly
// around the vertical axis. It is drawn on a 2D canvas now. Creating the WebGL
// context and compiling its shaders blocked the main thread for ~300 ms just
// after load (most of /contact's Total Blocking Time), and three.js was a
// 125 KB gzip download for a decorative layer at 40% opacity.
const FOV_DEGREES = 75;
const CAMERA_Z = 500;
const HALF_SPAN = 500;
const HALF_DEPTH = 250;
const POINT_SIZE = 3;
const ROTATION_PER_FRAME = 0.0002;
const COLOR = '#ffa500';
const POINT_ALPHA = 0.6;
const LINE_ALPHA = 0.15;

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  particleCount = 200,
  connectionDistance = 150,
  mouseInfluence = 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    // Screen position and depth per particle, refilled every frame.
    const projected = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 2 * HALF_SPAN;
      positions[i3 + 1] = (Math.random() - 0.5) * 2 * HALF_SPAN;
      positions[i3 + 2] = (Math.random() - 0.5) * 2 * HALF_DEPTH;

      velocities[i3] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
    }

    let width = 0;
    let height = 0;
    let focal = 0;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      focal = height / 2 / Math.tan((FOV_DEGREES * Math.PI) / 360);
    };
    resize();

    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', resize, { passive: true });

    const maxDistanceSq = connectionDistance * connectionDistance;
    let rotation = 0;
    let frame = 0;

    const animate = () => {
      rotation += ROTATION_PER_FRAME;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];

        // Particles near the pointer drift away from it.
        const dx = mouse.x * HALF_SPAN - positions[i3];
        const dy = mouse.y * HALF_SPAN - positions[i3 + 1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouseInfluence) {
          const force = (1 - distance / mouseInfluence) * 0.5;
          positions[i3] -= dx * force * 0.01;
          positions[i3 + 1] -= dy * force * 0.01;
        }

        if (Math.abs(positions[i3]) > HALF_SPAN) velocities[i3] *= -1;
        if (Math.abs(positions[i3 + 1]) > HALF_SPAN) velocities[i3 + 1] *= -1;
        if (Math.abs(positions[i3 + 2]) > HALF_DEPTH) velocities[i3 + 2] *= -1;

        // Rotate around the vertical axis, then project.
        const x = positions[i3] * cos + positions[i3 + 2] * sin;
        const z = -positions[i3] * sin + positions[i3 + 2] * cos;
        const depth = CAMERA_Z - z;
        projected[i3] = width / 2 + (x * focal) / depth;
        projected[i3 + 1] = height / 2 - (positions[i3 + 1] * focal) / depth;
        projected[i3 + 2] = depth;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = COLOR;
      ctx.fillStyle = COLOR;
      ctx.lineWidth = 1;

      // Connections between nearby particles, as one path.
      ctx.globalAlpha = LINE_ALPHA;
      ctx.beginPath();
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        for (let j = i + 1; j < particleCount; j++) {
          const j3 = j * 3;
          const dx = positions[i3] - positions[j3];
          const dy = positions[i3 + 1] - positions[j3 + 1];
          const dz = positions[i3 + 2] - positions[j3 + 2];
          // Squared distances: no square root for ~11k pairs a frame.
          if (dx * dx + dy * dy + dz * dz < maxDistanceSq) {
            ctx.moveTo(projected[i3], projected[i3 + 1]);
            ctx.lineTo(projected[j3], projected[j3 + 1]);
          }
        }
      }
      ctx.stroke();

      // Square points that shrink with distance, as WebGL points did.
      ctx.globalAlpha = POINT_ALPHA;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const size = (POINT_SIZE * height) / 2 / projected[i3 + 2];
        ctx.fillRect(projected[i3] - size / 2, projected[i3 + 1] - size / 2, size, size);
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frame);
    };
  }, [particleCount, connectionDistance, mouseInfluence]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  );
};

export default ParticleBackground;
