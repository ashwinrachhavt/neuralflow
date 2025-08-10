"use client";

import { motion } from "framer-motion";
import { LaserBeam } from "./LaserBeam";
import { UnicornStudioBackground } from "./UnicornStudioBackground";

interface DynamicBackgroundProps {
  useUnicornStudio?: boolean;
}

export function DynamicBackground({ useUnicornStudio = false }: DynamicBackgroundProps) {
  
  // If using UnicornStudio, return that instead
  if (useUnicornStudio) {
    return <UnicornStudioBackground />;
  }
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Ultra dark background */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-gray-950 via-black to-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      />
      
      {/* Subtle noise texture overlay */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 3, delay: 1 }}
      />

      {/* Ambient blue light spots */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`ambient-${i}`}
          className="absolute rounded-full bg-blue-600/15"
          style={{
            width: `${150 + Math.random() * 300}px`,
            height: `${150 + Math.random() * 300}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            filter: "blur(60px)",
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.4, 0.2, 0.6, 0.3, 0.5],
            scale: [0, 1.2, 0.8, 1.5, 1, 1.3],
          }}
          transition={{
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.3,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Dramatic blue clouds */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute rounded-full bg-blue-500/20"
          style={{
            width: `${200 + Math.random() * 400}px`,
            height: `${200 + Math.random() * 400}px`,
            left: `${20 + Math.random() * 60}%`,
            top: `${10 + Math.random() * 80}%`,
            filter: "blur(80px)",
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.6, 0.3, 0.8, 0.4, 0.7],
            scale: [0, 1.5, 1, 2, 1.2, 1.8],
          }}
          transition={{
            duration: 12 + Math.random() * 6,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.8,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Main laser beam effect */}
      <LaserBeam />

      {/* Vignette overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 4, delay: 2 }}
      />
    </div>
  );
}
