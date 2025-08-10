"use client";

import { UnicornStudioBackground } from "@/components/effects/UnicornStudioBackground";

export default function AnimationTestPage() {
  return (
    <div className="min-h-svh bg-black">
      <UnicornStudioBackground />
      
      {/* Test content overlay */}
      <div className="relative z-10 min-h-svh flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
            Animation Test
          </h1>
          <p className="text-gray-300 mb-8 text-lg drop-shadow-md">
            Testing UnicornStudio Integration
          </p>
          <button className="bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
}
