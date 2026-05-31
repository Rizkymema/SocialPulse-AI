"use client";

import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";

type ScrollRevealProps = {
  children: string;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
};

export function ScrollReveal({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = "",
  textClassName = "",
  rotationEnd = "bottom bottom",
  wordAnimationEnd = "bottom bottom",
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const splitText = useMemo(() => {
    return children.split(/(\s+)/).map((word, index) => {
      if (/^\s+$/.test(word)) {
        return word;
      }

      return (
        <span className="word inline-block" key={`${word}-${index}`}>
          {word}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    const initialize = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (disposed || !containerRef.current) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      const scroller = scrollContainerRef?.current;

      const context = gsap.context(() => {
        const element = containerRef.current;

        if (!element) {
          return;
        }

        const scrollTriggerBase = scroller ? { scroller } : {};

        gsap.fromTo(
          element,
          { transformOrigin: "0% 50%", rotate: baseRotation },
          {
            ease: "none",
            rotate: 0,
            scrollTrigger: {
              trigger: element,
              start: "top bottom",
              end: rotationEnd,
              scrub: true,
              ...scrollTriggerBase,
            },
          },
        );

        const wordElements = element.querySelectorAll<HTMLElement>(".word");

        gsap.fromTo(
          wordElements,
          {
            opacity: baseOpacity,
            filter: enableBlur ? `blur(${blurStrength}px)` : "blur(0px)",
            willChange: enableBlur ? "opacity, filter" : "opacity",
          },
          {
            ease: "none",
            opacity: 1,
            filter: "blur(0px)",
            stagger: 0.05,
            scrollTrigger: {
              trigger: element,
              start: "top bottom-=20%",
              end: wordAnimationEnd,
              scrub: true,
              ...scrollTriggerBase,
            },
          },
        );
      }, containerRef);

      cleanup = () => {
        context.revert();
      };
    };

    void initialize();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [
    baseOpacity,
    baseRotation,
    blurStrength,
    enableBlur,
    rotationEnd,
    scrollContainerRef,
    wordAnimationEnd,
  ]);

  return (
    <div ref={containerRef} className={containerClassName}>
      <p className={textClassName}>{splitText}</p>
    </div>
  );
}