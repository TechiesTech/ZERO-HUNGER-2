import React, { Suspense, useEffect, useRef, useState } from 'react';

interface DeferredSectionProps {
  children: React.ReactNode;
  placeholderHeight: number;
}

export const DeferredSection: React.FC<DeferredSectionProps> = ({
  children,
  placeholderHeight,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (!('IntersectionObserver' in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldRender(true);
        observer.disconnect();
      },
      { rootMargin: '1200px 0px' }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={sectionRef}
      style={shouldRender ? undefined : { minHeight: placeholderHeight }}
      aria-busy={!shouldRender}
    >
      {shouldRender && (
        <Suspense fallback={<div style={{ minHeight: placeholderHeight }} />}>
          {children}
        </Suspense>
      )}
    </div>
  );
};
