"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import DeviceModel from "./DeviceModel";
import type { Device } from "@/lib/devices";

// Shared 3D stage: selected devices side by side at true mm scale.
// Lighting is plain lights — drei Environment presets would fetch HDRIs
// over the network, which this demo avoids.

const GAP_MM = 22;

export default function DeviceScene({
  selected,
  autoRotate,
}: {
  selected: Device[];
  autoRotate: boolean;
}) {
  if (selected.length === 0) return null;

  // Lay devices left to right, centered on x = 0.
  const totalWidth =
    selected.reduce((acc, d) => acc + d.widthMm + GAP_MM, -GAP_MM) || 1;
  let cursor = -totalWidth / 2;
  const positions = selected.map((d) => {
    const x = cursor + d.widthMm / 2;
    cursor += d.widthMm + GAP_MM;
    return x;
  });

  const maxHeight = Math.max(...selected.map((d) => d.heightMm));
  const cameraDist = Math.max(totalWidth * 1.05, maxHeight * 1.3);
  const targetY = maxHeight * 0.45;

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{
        fov: 38,
        position: [0, targetY + maxHeight * 0.35, cameraDist],
        near: 1,
        far: 3000,
      }}
      style={{ height: 460 }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[200, 400, 300]} intensity={1.6} />
      <directionalLight
        position={[-300, 200, -200]}
        intensity={0.5}
        color="#88aaff"
      />
      <pointLight position={[0, 150, 250]} intensity={12000} distance={900} />

      {selected.map((device, i) => (
        <group key={device.slug} position={[positions[i], 0, 0]}>
          <DeviceModel device={device} />
          {/* name label under the device; pointer-events off so drags
              pass through to the OrbitControls */}
          <Html position={[0, -14, 0]} center style={{ pointerEvents: "none" }}>
            <div className="whitespace-nowrap text-center select-none">
              <div
                className="text-xs font-bold"
                style={{ color: device.color }}
              >
                {device.name}
              </div>
              <div className="font-mono text-[10px] leading-tight text-white/50">
                {device.widthMm}×{device.heightMm}×{device.depthMm}
              </div>
            </div>
          </Html>
        </group>
      ))}

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.55}
        scale={Math.max(totalWidth * 2.2, 500)}
        blur={2.6}
        far={40}
        color="#000000"
      />

      <OrbitControls
        target={[0, targetY, 0]}
        enableDamping
        autoRotate={autoRotate}
        autoRotateSpeed={1.1}
        minDistance={maxHeight * 0.6}
        maxDistance={cameraDist * 3}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}
