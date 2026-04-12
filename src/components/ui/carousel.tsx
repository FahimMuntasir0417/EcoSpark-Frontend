"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CarouselContextValue = {
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("Carousel components must be used within <Carousel />");
  }

  return context;
}

function getSlideWidth(node: HTMLDivElement) {
  const firstSlide = node.firstElementChild as HTMLElement | null;

  if (!firstSlide) {
    return node.clientWidth;
  }

  return firstSlide.getBoundingClientRect().width;
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  if (ref) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

const Carousel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const updateScrollState = React.useCallback(() => {
      const node = contentRef.current;

      if (!node) {
        setCanScrollPrev(false);
        setCanScrollNext(false);
        return;
      }

      setCanScrollPrev(node.scrollLeft > 4);
      setCanScrollNext(node.scrollLeft + node.clientWidth < node.scrollWidth - 4);
    }, []);

    const scrollPrev = React.useCallback(() => {
      const node = contentRef.current;

      if (!node) {
        return;
      }

      node.scrollBy({
        left: -getSlideWidth(node),
        behavior: "smooth",
      });
    }, []);

    const scrollNext = React.useCallback(() => {
      const node = contentRef.current;

      if (!node) {
        return;
      }

      node.scrollBy({
        left: getSlideWidth(node),
        behavior: "smooth",
      });
    }, []);

    React.useEffect(() => {
      const node = contentRef.current;

      if (!node) {
        return;
      }

      updateScrollState();

      const handleScroll = () => {
        updateScrollState();
      };

      node.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleScroll);

      return () => {
        node.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      };
    }, [updateScrollState]);

    return (
      <CarouselContext.Provider
        value={{
          contentRef,
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          role="region"
          aria-roledescription="carousel"
          className={cn("relative", className)}
          {...props}
        />
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { contentRef } = useCarousel();

  return (
    <div
      ref={(node) => {
        contentRef.current = node;
        assignRef(ref, node);
      }}
      className={cn(
        "flex overflow-x-auto scroll-smooth snap-x snap-mandatory touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  );
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full snap-start", className)}
      {...props}
    />
  ),
);
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel();

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "absolute left-3 top-1/2 z-10 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-950 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      disabled={!canScrollPrev}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          scrollPrev();
        }
      }}
      {...props}
    >
      <ChevronLeft className="size-4" />
      <span className="sr-only">Previous slide</span>
    </button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel();

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "absolute right-3 top-1/2 z-10 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-950 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      disabled={!canScrollNext}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          scrollNext();
        }
      }}
      {...props}
    >
      <ChevronRight className="size-4" />
      <span className="sr-only">Next slide</span>
    </button>
  );
});
CarouselNext.displayName = "CarouselNext";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
};
