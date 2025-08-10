"use client";

import { motion } from "framer-motion";
import { Clock, Kanban } from "lucide-react";

type Tab = "focus" | "kanban";

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: "focus" as const, label: "Focus Mode", icon: Clock },
    { id: "kanban" as const, label: "Kanban Board", icon: Kanban },
  ];

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-1 mb-6">
      <div className="flex space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${isActive 
                  ? "text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-md"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                />
              )}
              <Icon className="h-4 w-4 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
