"use client";

import { useEffect, useRef, ReactNode, CSSProperties } from "react";

export const useScrollReveal = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("animate-fade-in-up");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
};

export const ScrollReveal = ({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) => {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={`opacity-0 ${className}`} style={style}>
      {children}
    </div>
  );
};
