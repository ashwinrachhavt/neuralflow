export type GemSlug =
  | "quartz"
  | "garnet"
  | "topaz"
  | "emerald"
  | "sapphire"
  | "ruby"
  | "diamond";

export const GEM_ICON_PATHS: Record<GemSlug, string> = {
  quartz: "/quartz.png",
  garnet: "/garnet.png",
  topaz: "/topaz.png",
  emerald: "/emerald.png",
  sapphire: "/sapphire.png",
  ruby: "/ruby.png",
  diamond: "/diamond.png",
};

export const GEM_META: Record<GemSlug, { name: string; theme: string; rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" }>= {
  quartz: { name: "Quartz of Clarity", theme: "Clarity & starting", rarity: "COMMON" },
  garnet: { name: "Garnet of Recovery", theme: "Recovery & reflection", rarity: "COMMON" },
  topaz: { name: "Topaz of Consistency", theme: "Consistency", rarity: "RARE" },
  emerald: { name: "Emerald of Learning", theme: "Learning & growth", rarity: "RARE" },
  sapphire: { name: "Sapphire of Deep Focus", theme: "Deep focus", rarity: "EPIC" },
  ruby: { name: "Ruby of Courage", theme: "Courage & shipping", rarity: "EPIC" },
  diamond: { name: "Diamond of Mastery", theme: "Mastery", rarity: "LEGENDARY" },
};

