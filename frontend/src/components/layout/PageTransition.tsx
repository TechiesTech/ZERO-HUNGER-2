import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const { pathname } = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const hasMounted = useRef(false);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      previousPathname.current = pathname;
    }
  }, [pathname]);

  if (prefersReducedMotion || !hasMounted.current) {
    return <main>{children}</main>;
  }

  return (
    <motion.main
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.main>
  );
};
