"use client";

import { cn } from "@/lib/utils";
import { motion, useSpring } from "framer-motion";
import type { CSSProperties } from "react";
import {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useRef,
} from "react";

type CardContextValue = {
  rotateX: ReturnType<typeof useSpring>;
  rotateY: ReturnType<typeof useSpring>;
};

const CardContext = createContext<CardContextValue | null>(null);

function useCardContext(component: string) {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error(`${component} must be used within a CardContainer.`);
  }
  return context;
}

type CardContainerProps = {
  children: ReactNode;
  className?: string;
};

export function CardContainer({ children, className }: CardContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 150, damping: 20 });

  const handlePointerMove: ComponentPropsWithoutRef<"div">["onPointerMove"] = (
    event,
  ) => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const percentX = (event.clientX - rect.left) / rect.width;
    const percentY = (event.clientY - rect.top) / rect.height;

    const rotateAmount = 15;
    rotateX.set((0.5 - percentY) * rotateAmount);
    rotateY.set((percentX - 0.5) * rotateAmount);
  };

  const resetRotation = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const contextValue = useMemo<CardContextValue>(
    () => ({ rotateX, rotateY }),
    [rotateX, rotateY],
  );

  return (
    <CardContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={cn(
          "group/card relative grid place-items-center [perspective:1200px]",
          className,
        )}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetRotation}
      >
        {children}
      </div>
    </CardContext.Provider>
  );
}

type CardBodyProps = ComponentPropsWithoutRef<typeof motion.div>;

export function CardBody({ className, style, children, ...props }: CardBodyProps) {
  const { rotateX, rotateY } = useCardContext(CardBody.name);

  return (
    <motion.div
      {...props}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        ...style,
      }}
      className={cn(
        "transform-gpu rounded-3xl border border-border/60 bg-background/80 p-8 shadow-lg transition-shadow duration-300 ease-out group-hover/card:shadow-xl",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

type CardItemProps = {
  as?: ElementType;
  translateZ?: number | string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>;

export function CardItem({
  as,
  translateZ = 0,
  className,
  style,
  children,
  ...props
}: CardItemProps) {
  const Component = (as ?? "div") as ElementType;
  const depth = typeof translateZ === "number" ? `${translateZ}px` : translateZ;

  return (
    <Component
      {...props}
      style={{
        transform: `translateZ(${depth})`,
        transformStyle: "preserve-3d",
        ...(style ?? {}),
      }}
      className={cn(
        "transform-gpu transition-transform duration-300 ease-out",
        className,
      )}
    >
      {children}
    </Component>
  );
}
