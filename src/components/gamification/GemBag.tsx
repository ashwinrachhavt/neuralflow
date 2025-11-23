"use client";

import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

export function GemBag() {
    return (
        <div className="relative">
            <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
                <ShoppingBag className="h-5 w-5" />
                {/* Optional: Badge for count */}
                {/* <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
          3
        </span> */}
            </motion.div>
        </div>
    );
}
