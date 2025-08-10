"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function LaserBeam() {
  const [particles, setParticles] = useState<Array<{ id: number; delay: number; duration: number; size: number; position: number }>>([]);

  useEffect(() => {
    // Generate many more particles for dense effect
    const newParticles = Array.from({ length: 200 }, (_, i) => ({
      id: i,
      delay: Math.random() * 3,
      duration: 0.5 + Math.random() * 3,
      size: Math.random() * 3 + 1,
      position: Math.random() * 20 - 10, // -10 to 10% from center
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Ultra bright core beam */}
      <motion.div
        className="absolute left-1/2 top-0 w-1 h-full bg-white"
        style={{ transform: "translateX(-50%)" }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ 
          opacity: [0.8, 1, 0.9, 1, 0.95, 1],
          scaleY: [0.95, 1.1, 1, 1.05, 1],
          filter: [
            "blur(0px) brightness(3)",
            "blur(1px) brightness(4)",
            "blur(0px) brightness(3.5)",
            "blur(1px) brightness(5)",
            "blur(0px) brightness(4)",
            "blur(1px) brightness(4.5)"
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />

      {/* Inner blue-white beam */}
      <motion.div
        className="absolute left-1/2 top-0 w-2 h-full bg-gradient-to-b from-blue-200 via-white to-blue-300"
        style={{ transform: "translateX(-50%)" }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ 
          opacity: [0.6, 0.9, 0.7, 0.95, 0.8, 0.9],
          scaleY: [0.9, 1.2, 1, 1.1, 1.05, 1.15],
          filter: [
            "blur(1px) brightness(2)",
            "blur(2px) brightness(3)",
            "blur(1px) brightness(2.5)",
            "blur(3px) brightness(3.5)",
            "blur(2px) brightness(3)",
            "blur(2px) brightness(3.2)"
          ]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 0.2
        }}
      />

      {/* Medium blue glow */}
      <motion.div
        className="absolute left-1/2 top-0 w-12 h-full bg-gradient-to-b from-blue-400/60 via-blue-200/40 to-blue-500/60"
        style={{ transform: "translateX(-50%)" }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ 
          opacity: [0.4, 0.8, 0.6, 0.9, 0.7, 0.8],
          scaleY: [0.9, 1.2, 1, 1.3, 1.1, 1.2],
          filter: [
            "blur(6px) brightness(1.5)",
            "blur(10px) brightness(2)",
            "blur(8px) brightness(1.8)",
            "blur(12px) brightness(2.2)",
            "blur(9px) brightness(2)",
            "blur(10px) brightness(2.1)"
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 0.3
        }}
      />

      {/* Wide dramatic blue clouds */}
      <motion.div
        className="absolute left-1/2 top-0 w-64 h-full bg-gradient-to-b from-blue-600/40 via-blue-400/25 to-blue-800/40"
        style={{ transform: "translateX(-50%)" }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ 
          opacity: [0.3, 0.7, 0.5, 0.8, 0.6, 0.7],
          scaleY: [0.8, 1.4, 1.1, 1.6, 1.2, 1.4],
          filter: [
            "blur(25px) brightness(1.2)",
            "blur(35px) brightness(1.5)",
            "blur(30px) brightness(1.3)",
            "blur(40px) brightness(1.7)",
            "blur(32px) brightness(1.4)",
            "blur(35px) brightness(1.6)"
          ]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 0.8
        }}
      />

      {/* Ultra wide atmospheric effect */}
      <motion.div
        className="absolute left-1/2 top-0 w-96 h-full bg-gradient-to-b from-blue-700/20 via-blue-500/15 to-purple-700/20"
        style={{ transform: "translateX(-50%)" }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ 
          opacity: [0.2, 0.5, 0.3, 0.6, 0.4, 0.5],
          scaleY: [0.7, 1.5, 1, 1.8, 1.2, 1.5],
          filter: "blur(50px)"
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 1.2
        }}
      />

      {/* Dense particle field */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${50 + particle.position}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: particle.size > 2 ? '#ffffff' : '#93c5fd',
            filter: particle.size > 2 ? 'blur(0.5px)' : 'blur(0px)',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, particle.size > 2 ? 0.9 : 0.7, 0],
            scale: [0, 1.2, 0],
            y: [-30, -120],
            x: [0, (Math.random() - 0.5) * 60],
            filter: [
              `blur(0px) brightness(${particle.size > 2 ? 2 : 1})`,
              `blur(1px) brightness(${particle.size > 2 ? 3 : 1.5})`,
              `blur(0px) brightness(${particle.size > 2 ? 2 : 1})`
            ]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Large bright energy orbs */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute w-3 h-3 bg-white rounded-full"
          style={{
            left: `${48 + (Math.random() - 0.5) * 8}%`,
            top: `${Math.random() * 100}%`,
            filter: "blur(1px)",
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0],
            y: [-40, -200],
            x: [0, (Math.random() - 0.5) * 80],
            filter: [
              "blur(1px) brightness(2)",
              "blur(2px) brightness(4)",
              "blur(1px) brightness(2)"
            ]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Intense energy pulses */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute left-1/2 w-4 h-4 bg-white rounded-full"
          style={{ transform: "translateX(-50%)" }}
          initial={{ top: "100%", opacity: 0, scale: 0 }}
          animate={{
            top: "-15%",
            opacity: [0, 1, 0.8, 1, 0],
            scale: [0, 2, 1.5, 2.5, 0],
            filter: [
              "blur(0px) brightness(2)",
              "blur(3px) brightness(5)",
              "blur(2px) brightness(4)",
              "blur(4px) brightness(6)",
              "blur(0px) brightness(2)"
            ]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.25,
            ease: "linear"
          }}
        />
      ))}

      {/* Rapid light streaks */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`streak-${i}`}
          className="absolute left-1/2 w-px h-6 bg-blue-200"
          style={{ 
            transform: "translateX(-50%)",
            left: `${49 + (Math.random() - 0.5) * 4}%`
          }}
          initial={{ top: "100%", opacity: 0 }}
          animate={{
            top: "-10%",
            opacity: [0, 0.8, 0],
            filter: [
              "blur(0px) brightness(1)",
              "blur(1px) brightness(3)",
              "blur(0px) brightness(1)"
            ]
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "linear"
          }}
        />
      ))}

      {/* Side wisps */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`wisp-${i}`}
          className="absolute w-px h-8 bg-gradient-to-t from-transparent via-blue-400 to-transparent"
          style={{
            left: `${48 + (i % 2 === 0 ? 1 : -1) * (2 + Math.random() * 3)}%`,
            top: `${20 + i * 12}%`,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            scaleY: [0, 1, 0],
            x: [(i % 2 === 0 ? 1 : -1) * -10, (i % 2 === 0 ? 1 : -1) * 10],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}
