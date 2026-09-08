"use client";

import { RoundedBox } from "@react-three/drei";
import type { Device } from "@/lib/devices";

// One phone at true millimeter scale, standing on y = 0, screen facing +z.

export default function DeviceModel({ device }: { device: Device }) {
  const { widthMm: w, heightMm: h, depthMm: d } = device;
  const bodyRadius = Math.min(w, h) * 0.06;

  return (
    <group>
      {/* body */}
      <RoundedBox
        args={[w, h, d]}
        radius={bodyRadius}
        smoothness={4}
        position={[0, h / 2, 0]}
      >
        <meshStandardMaterial
          color={device.color}
          metalness={0.55}
          roughness={0.35}
        />
      </RoundedBox>

      {/* screen: a very thin rounded slab sitting just proud of the front */}
      <RoundedBox
        args={[w * 0.93, h * 0.955, 0.6]}
        radius={bodyRadius * 0.8}
        smoothness={4}
        position={[0, h / 2, d / 2 + 0.2]}
      >
        <meshStandardMaterial
          color="#0b1626"
          emissive="#2563eb"
          emissiveIntensity={0.5}
          roughness={0.2}
        />
      </RoundedBox>

      {/* camera island on the back */}
      <mesh
        position={[w * 0.24, h * 0.78, -(d / 2 + 0.35)]}
        rotation={[0, Math.PI, 0]}
      >
        <circleGeometry args={[w * 0.14, 24]} />
        <meshStandardMaterial color="#15151a" roughness={0.25} />
      </mesh>
      {[
        [-0.05, 0.05],
        [0.05, 0.05],
        [-0.05, -0.05],
        [0.05, -0.05],
      ].map(([ox, oy], i) => (
        <mesh
          key={i}
          position={[
            w * 0.24 + ox * w * 0.14,
            h * 0.78 + oy * w * 0.14,
            -(d / 2 + 0.55),
          ]}
          rotation={[0, Math.PI, 0]}
        >
          <circleGeometry args={[w * 0.038, 16]} />
          <meshStandardMaterial color="#2a2a35" roughness={0.15} />
        </mesh>
      ))}
    </group>
  );
}
