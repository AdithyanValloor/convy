import React from "react";
import { motion } from "framer-motion";

export function UnreadCountBadge({count, position}:{count:number, position?:string}) {

    const pos = position ? position : "-top-1 -right-0"

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400 }}
      className={`absolute ${pos} bg-red-600 text-white text-xs rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-semibold`}
    >
      {count > 99 ? "99+" : count}
    </motion.span>
  );
}

