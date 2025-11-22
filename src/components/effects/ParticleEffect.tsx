"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Particle = {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    velocity: { x: number; y: number };
    rotation: number;
    rotationSpeed: number;
};

type ParticleEffectProps = {
    trigger: boolean;
    colors?: string[];
    particleCount?: number;
    duration?: number;
    onComplete?: () => void;
};

export function ParticleEffect({
    trigger,
    colors = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981"],
    particleCount = 20,
    duration = 1000,
    onComplete,
}: ParticleEffectProps) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (!trigger) return;

        // Generate particles
        const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => {
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
            const speed = 2 + Math.random() * 3;
            return {
                id: i,
                x: 0,
                y: 0,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 4 + Math.random() * 6,
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed,
                },
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
            };
        });

        setParticles(newParticles);

        // Clear particles after animation
        const timeout = setTimeout(() => {
            setParticles([]);
            onComplete?.();
        }, duration);

        return () => clearTimeout(timeout);
    }, [trigger, colors, particleCount, duration, onComplete]);

    if (particles.length === 0) return null;

    return (
        <div className="pointer-events-none absolute inset-0 overflow-visible">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute left-1/2 top-1/2 rounded-full"
                    style={{
                        backgroundColor: particle.color,
                        width: particle.size,
                        height: particle.size,
                        boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                    }}
                    initial={{
                        x: 0,
                        y: 0,
                        opacity: 1,
                        scale: 0,
                        rotate: particle.rotation,
                    }}
                    animate={{
                        x: particle.velocity.x * 100,
                        y: particle.velocity.y * 100,
                        opacity: 0,
                        scale: 1,
                        rotate: particle.rotation + particle.rotationSpeed * 360,
                    }}
                    transition={{
                        duration: duration / 1000,
                        ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                />
            ))}
        </div>
    );
}
