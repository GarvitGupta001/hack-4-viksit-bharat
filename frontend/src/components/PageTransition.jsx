'use client';

import { MotionConfig, motion } from 'framer-motion';

export default function PageTransition({ children }) {
  return (
    <MotionConfig
      transition={{
        duration: 0.22,
        ease: [0.22, 0.61, 0.36, 1],
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
