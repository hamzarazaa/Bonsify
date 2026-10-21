"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./ShaderAnimation.module.css";

const VERTEX_SHADER = `
  void main() {
    gl_Position = vec4( position, 1.0 );
  }
`;

// Same layered ring/plasma structure as the original reference shader, just
// recombined into Bonsify's ink/jade/moss/clay palette instead of raw RGB -
// each of the three phase-offset ring layers gets its own brand hue.
const FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;

  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    float t = time * 0.05;
    float lineWidth = 0.00085;
    float d = length(uv);
    float m = mod(uv.x + uv.y, 0.2);

    float ch0 = 0.0;
    float ch1 = 0.0;
    float ch2 = 0.0;
    for (int i = 0; i < 5; i++) {
      float w = lineWidth * float(i * i);
      ch0 += w / abs(fract(t + float(i) * 0.01) * 5.0 - d + m);
      ch1 += w / abs(fract(t - 0.01 + float(i) * 0.01) * 5.0 - d + m);
      ch2 += w / abs(fract(t - 0.02 + float(i) * 0.01) * 5.0 - d + m);
    }

    vec3 ink = vec3(0.078, 0.090, 0.102);
    vec3 jade = vec3(0.184, 0.420, 0.310);
    vec3 moss = vec3(0.420, 0.561, 0.443);
    vec3 clay = vec3(0.659, 0.353, 0.212);
    vec3 glow = ch0 * jade + ch1 * moss + ch2 * clay;
    // The raw accumulation regularly exceeds 1.0 per channel, which would
    // just clip to flat white - Reinhard tonemap it so the glow compresses
    // toward brand-colored highlights instead of blowing out, keeping the
    // ink background dark where the glow is weak.
    glow = glow / (1.0 + glow);
    vec3 color = ink + glow * (1.0 - ink);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function ShaderAnimation({ onReady }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      // WebGL unavailable (old browser, disabled GPU, etc.) - fail quietly,
      // but still tell the caller so it doesn't wait forever for a "ready"
      // signal that was never coming.
      onReady?.();
      return;
    }

    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    function onResize() {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      uniforms.resolution.value.x = renderer.domElement.width;
      uniforms.resolution.value.y = renderer.domElement.height;
    }
    onResize();
    window.addEventListener("resize", onResize);

    let notifiedReady = false;
    let animationId = requestAnimationFrame(function animate() {
      animationId = requestAnimationFrame(animate);
      uniforms.time.value += 0.05;
      renderer.render(scene, camera);
      if (!notifiedReady) {
        notifiedReady = true;
        onReady?.();
      }
    });

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationId);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return <div ref={containerRef} className={styles.container} />;
}
