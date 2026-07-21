/* eslint-disable react/no-unknown-property */
import * as THREE from 'three';
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { easing } from 'maath';

export interface FluidGlassProps {
  mode?: 'lens' | 'bar' | 'cube';
  lensProps?: {
    scale?: number;
    ior?: number;
    thickness?: number;
    chromaticAberration?: number;
    anisotropy?: number;
    roughness?: number;
    transmission?: number;
  };
  barProps?: Record<string, any>;
  cubeProps?: Record<string, any>;
  style?: React.CSSProperties;
  className?: string;
}

function GlassLens({
  shape = 'sphere',
  followPointer = true,
  modeProps = {}
}: {
  shape?: 'sphere' | 'box' | 'cylinder';
  followPointer?: boolean;
  modeProps?: Record<string, any>;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    const { viewport, pointer } = state;
    const destX = followPointer ? (pointer.x * viewport.width) / 4 : 0;
    const destY = followPointer ? (pointer.y * viewport.height) / 4 : 0;

    if (meshRef.current) {
      easing.damp3(meshRef.current.position, [destX, destY, 0], 0.15, delta);
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });

  const {
    scale = 2.2,
    ior = 1.25,
    thickness = 1.2,
    roughness = 0.05,
    transmission = 0.98
  } = modeProps;

  return (
    <mesh ref={meshRef} scale={scale} rotation-x={shape === 'cylinder' ? Math.PI / 2 : 0}>
      {shape === 'sphere' && <sphereGeometry args={[1, 64, 64]} />}
      {shape === 'box' && <boxGeometry args={[1.5, 1.5, 1.5]} />}
      {shape === 'cylinder' && <cylinderGeometry args={[1, 1, 0.5, 64]} />}
      
      <meshPhysicalMaterial
        transmission={transmission}
        opacity={1}
        transparent={true}
        roughness={roughness}
        ior={ior}
        thickness={thickness}
        specularColor={new THREE.Color('#ffffff')}
        specularIntensity={1}
        clearcoat={1}
        clearcoatRoughness={0}
        color={new THREE.Color('#ffffff')}
        attenuationColor={new THREE.Color('#ffffff')}
        attenuationDistance={1}
      />
    </mesh>
  );
}

export default function FluidGlass({
  mode = 'lens',
  lensProps = {},
  barProps = {},
  cubeProps = {},
  style = {},
  className = ''
}: FluidGlassProps) {
  const rawOverrides = mode === 'bar' ? barProps : mode === 'cube' ? cubeProps : lensProps;
  const shape = mode === 'bar' ? 'cylinder' : mode === 'cube' ? 'box' : 'sphere';

  return (
    <div className={`w-full h-full relative overflow-hidden pointer-events-none ${className}`} style={style}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={2} />
        <directionalLight position={[10, 10, 10]} intensity={3} />
        <directionalLight position={[-10, -10, -10]} intensity={1.5} color="#ffffff" />
        <pointLight position={[0, 0, 5]} intensity={2} color="#ffffff" />
        <GlassLens shape={shape} followPointer={mode !== 'bar'} modeProps={rawOverrides} />
      </Canvas>
    </div>
  );
}
