import React, { useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// Freezes the outlet element so the exiting page keeps rendering its old route
function FrozenRoute({ context }) {
  const outlet = useOutlet(context);
  const [frozen] = useState(outlet);
  return frozen;
}

export default function PageTransition({ context }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.2, ease: "easeOut" }}>
        <FrozenRoute context={context} />
      </motion.div>
    </AnimatePresence>
  );
}