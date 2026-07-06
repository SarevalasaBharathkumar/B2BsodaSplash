"use client";

import { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float, OrbitControls } from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);
useGLTF.preload("/assets/soda_bottle.glb");

const mouse = { x: 0, y: 0 };

// ─── 3D Showcase Pedestal/Plate ──────────────────────────────────────────────
interface PedestalProps {
  position?: [number, number, number];
}

function Pedestal({ position = [0, -1.04, 0] }: PedestalProps) {
  const outerGlowRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Soft breathing scale for the base glow ring
    const scale = 1 + Math.sin(t * 1.2) * 0.04;
    outerGlowRef.current.scale.set(scale, 1, scale);
  });

  const additive = useMemo(() => ({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  return (
    <group position={position}>
      {/* 1. Main Metallic 3D Cylinder Plate — scaled up */}
      <mesh castShadow receiveShadow position={[0, -0.06, 0]}>
        <cylinderGeometry args={[1.36, 1.41, 0.15, 64]} />
        <meshPhysicalMaterial
          color="#061824"
          roughness={0.12}
          metalness={0.9}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          reflectivity={1.0}
        />
      </mesh>

      {/* 2. Embedded Glowing Neon Rim Ring — scaled up */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[1.33, 1.33, 0.025, 64]} />
        <meshBasicMaterial color="#00e5ff" />
      </mesh>

      {/* 3. Outer Neon Glow Aura on the floor — scaled up */}
      <mesh ref={outerGlowRef} position={[0, -0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.9, 64]} />
        <meshBasicMaterial color="#148096" opacity={0.3} {...additive} />
      </mesh>

      {/* 4. Hot Core Glow directly under the plate — scaled up */}
      <mesh position={[0, -0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 64]} />
        <meshBasicMaterial color="#00e5ff" opacity={0.45} {...additive} />
      </mesh>
    </group>
  );
}

// ─── Floating bubble particles ────────────────────────────────────────────────
function Bubbles() {
  const count = 22;
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  const { positions, speeds, phases } = useMemo(() => {
    const positions: [number, number, number][] = [];
    const speeds:    number[] = [];
    const phases:    number[] = [];
    for (let i = 0; i < count; i++) {
      positions.push([
        (Math.random() - 0.5) * 4.0,
        (Math.random() - 0.5) * 6 - 0.5,
        (Math.random() - 0.5) * 1.8 - 0.5,
      ]);
      speeds.push(0.14 + Math.random() * 0.16);
      phases.push(Math.random() * Math.PI * 2);
    }
    return { positions, speeds, phases };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geo   = useMemo(() => new THREE.SphereGeometry(1, 8, 8), []);
  const mat   = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#9ae8f5",
    transparent: true,
    opacity: 0.12,
    roughness: 0.0,
    metalness: 0.0,
    reflectivity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    side: THREE.DoubleSide,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const [bx, by, bz] = positions[i];
      const y = ((by + t * speeds[i] + phases[i]) % 7) - 3.5;
      const x = bx + Math.sin(t * 0.28 + phases[i]) * 0.2;
      const size = 0.035 + (i % 5) * 0.016;
      dummy.position.set(x, y, bz);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, count]} />;
}

// ─── The auto-spinning showcase bottle ────────────────────────────────────────
function ShowcaseProduct() {
  const showcaseGroupRef = useRef<THREE.Group>(null!);
  const bottleRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF("/assets/soda_bottle.glb");

  // Premium glossy transparent glass, liquid, and marble materials (previous light teal colors with transparency)
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;

      const isLiquid = mesh.name === "Mesh_0.001" || mesh.name.includes("liquid");
      const isMarble = mesh.name === "Sphere" || mesh.name.includes("marble");

      if (isLiquid) {
        // Glowing light teal soda liquid inside the bottle
        mesh.material = new THREE.MeshPhysicalMaterial({
          color:              new THREE.Color("#ff8c00"),  // glowing teal soda
          transparent:        true,
          opacity:            0.9,                         // transparent liquid
          roughness:          0.05,
          metalness:          0.05,
          transmission:       0.8,                         // clear transmission through fluid
          thickness:          1.2,
          ior:                1.333,
          side:               THREE.DoubleSide,
        });
      } else if (isMarble) {
        // Clear, solid glass marble
        mesh.material = new THREE.MeshPhysicalMaterial({
          color:              new THREE.Color("#4064c8"),
          transparent:        true,
          opacity:            0.7,
          roughness:          0.03,
          transmission:       1.0,
          ior:                1.52,
          reflectivity:       1.0,
          side:               THREE.DoubleSide,
        });
      } else {
        // Outer Glass Bottle (light transparent teal)
        mesh.material = new THREE.MeshPhysicalMaterial({
          color:              new THREE.Color("#16425f"),  // light transparent teal glass
          transparent:        true,
          opacity:            0.45,                        // premium transparent glossy look
          roughness:          0.002,                       // ultra-smooth glossy surface
          transmission:       0.99,                        // near-total glass light transmission
          metalness:          0.1,
          reflectivity:       1.0,
          clearcoat:          1.0,                         // clearcoat layer for outer shine
          clearcoatRoughness: 0.002,
          thickness:          2.2,
          ior:                1.52,
          envMapIntensity:    1.5,
          side:               THREE.DoubleSide,
        });
      }

      mesh.castShadow    = true;
      mesh.receiveShadow = true;
    });
    return c;
  }, [scene]);

  // Continuous auto-spin on Y axis + mouse tilt tracking
  useFrame(({ clock }) => {
    if (bottleRef.current) {
      bottleRef.current.rotation.y = clock.getElapsedTime() * 0.42;
    }
    if (showcaseGroupRef.current) {
      showcaseGroupRef.current.rotation.x = THREE.MathUtils.lerp(showcaseGroupRef.current.rotation.x, mouse.y * 0.12, 0.05);
      showcaseGroupRef.current.rotation.y = THREE.MathUtils.lerp(showcaseGroupRef.current.rotation.y, mouse.x * 0.12, 0.05);
    }
  });

  // Scroll Trigger: scale down and fade as the user scrolls
  useGSAP(() => {
    if (!showcaseGroupRef.current) return;
    const obj = showcaseGroupRef.current;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#top",
        endTrigger: "#flavours",
        start: "top top",
        end: "top top",
        scrub: 1.5,
      },
    });
    tl.to(obj.position, { z: -1.5, y: -0.5, ease: "none" }, 0)
      .to(obj.scale, { x: 0.65, y: 0.65, z: 0.65, ease: "none" }, 0);
  }, []);

  return (
    <group ref={showcaseGroupRef} position={[0, -0.4, 0]}>
      {/* 3D display pedestal */}
      <Pedestal position={[0, -1.04, 0]} />

      {/* Auto-spinning Bottle - scaled to 2.3 and offset to rest on pedestal */}
      <group ref={bottleRef} position={[0, -0.9, 0]}>
        <primitive object={cloned} scale={2.3} position={[0, 0.61, 0]} />
      </group>

      {/* Inner glow inside the bottle body */}
      <pointLight
        position={[0, -0.15, 0.7]}
        intensity={2.5}
        color="#00e5ff"
        distance={4}
        decay={2}
      />

      {/* Highlight sparkle on the cap — moved to match scale */}
      <pointLight
        position={[0, 1.7, 0.8]}
        intensity={1.8}
        color="#ffffff"
        distance={5}
        decay={2}
      />
    </group>
  );
}

// ─── Main canvas ──────────────────────────────────────────────────────────────
export default function BottleCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      // Mouse coordinates relative to target viewport container
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onLeave = () => { mouse.x = 0; mouse.y = 0; };
    const el = wrapRef.current;
    if (el) {
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
    }
    return () => {
      if (el) {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      }
    };
  }, []);

  return (
    <div ref={wrapRef} className="bottle-canvas-wrap">
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 100, position: [0, 0.2, 7.5] as [number, number, number] }}
        gl={{
          antialias:          true,
          alpha:              true,
          toneMapping:        THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
        }}
        dpr={[1, 1.8]}
        shadows
        style={{ background: "transparent" }}
      >
        {/* Soft studio ambient light */}
        <ambientLight intensity={0.15} color="#b5e2f7" />

        {/* Dynamic Studio Spotlights to carve the glossy reflections */}
        <directionalLight
          position={[-4, 6, 5]}
          intensity={3.2}
          color="#dcf5ff"
          castShadow
        />
        <directionalLight
          position={[5, 3, -4]}
          intensity={1.8}
          color="#ff8c69"
        />
        {/* Extra highlights for shiny specular reflections */}
        <directionalLight
          position={[3, 5, 2]}
          intensity={2.2}
          color="#ffffff"
        />
        <directionalLight
          position={[-3, 4, -2]}
          intensity={1.5}
          color="#e3f5ff"
        />
        <directionalLight
          position={[0, -4, 4]}
          intensity={1.0}
          color="#00e5ff"
        />

        <Suspense fallback={null}>
          <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.4} floatingRange={[-0.04, 0.04]}>
            <ShowcaseProduct />
          </Float>
          <Bubbles />
        </Suspense>

        {/* Official model-viewer-like interactive camera controls */}
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
