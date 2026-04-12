"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type InputOTPContextValue = {
  value: string;
  maxLength: number;
  activeIndex: number;
  isFocused: boolean;
  disabled: boolean;
  setSelection: (index: number) => void;
};

const InputOTPContext = React.createContext<InputOTPContextValue | null>(null);

type InputOTPProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "children" | "maxLength" | "onChange" | "value"
> & {
  children: React.ReactNode;
  maxLength: number;
  value?: string;
  onChange?: (value: string) => void;
  containerClassName?: string;
};

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) {
        continue;
      }

      if (typeof ref === "function") {
        ref(node);
        continue;
      }

      (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

const InputOTP = React.forwardRef<HTMLInputElement, InputOTPProps>(
  (
    {
      children,
      className,
      containerClassName,
      value = "",
      onChange,
      onBlur,
      onFocus,
      disabled = false,
      maxLength,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(0);

    const clampIndex = React.useCallback(
      (index: number) => Math.max(0, Math.min(index, maxLength - 1)),
      [maxLength],
    );

    const syncSelection = React.useCallback(
      (fallbackIndex?: number) => {
        const nextIndex =
          inputRef.current?.selectionStart ?? fallbackIndex ?? value.length;

        setActiveIndex(clampIndex(nextIndex));
      },
      [clampIndex, value.length],
    );

    const setSelection = React.useCallback(
      (index: number) => {
        if (disabled) {
          return;
        }

        const input = inputRef.current;

        if (!input) {
          return;
        }

        const nextIndex = clampIndex(index);

        input.focus();

        requestAnimationFrame(() => {
          input.setSelectionRange(nextIndex, nextIndex);
          setActiveIndex(nextIndex);
        });
      },
      [clampIndex, disabled],
    );

    React.useEffect(() => {
      const fallbackIndex =
        value.length >= maxLength ? maxLength - 1 : value.length;

      syncSelection(fallbackIndex);
    }, [maxLength, syncSelection, value.length]);

    return (
      <InputOTPContext.Provider
        value={{
          value,
          maxLength,
          activeIndex,
          isFocused,
          disabled,
          setSelection,
        }}
      >
        <div
          data-slot="input-otp"
          className={cn(
            "relative flex items-center gap-2",
            disabled && "opacity-50",
            containerClassName,
            className,
          )}
        >
          <input
            {...props}
            ref={composeRefs(inputRef, ref)}
            type="text"
            value={value}
            disabled={disabled}
            onChange={(event) => {
              onChange?.(event.target.value.slice(0, maxLength));
              syncSelection(event.target.value.length);
            }}
            onFocus={(event) => {
              setIsFocused(true);
              syncSelection();
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setIsFocused(false);
              onBlur?.(event);
            }}
            onClick={() => syncSelection()}
            onKeyUp={() => syncSelection()}
            onSelect={() => syncSelection()}
            spellCheck={false}
            autoComplete={props.autoComplete ?? "one-time-code"}
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          />
          {children}
        </div>
      </InputOTPContext.Provider>
    );
  },
);

InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="input-otp-group"
    className={cn("flex items-center gap-2", className)}
    {...props}
  />
));

InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="input-otp-separator"
    aria-hidden="true"
    className={cn("text-sm font-medium text-slate-300", className)}
    {...props}
  >
    -
  </div>
));

InputOTPSeparator.displayName = "InputOTPSeparator";

type InputOTPSlotProps = React.ComponentPropsWithoutRef<"div"> & {
  index: number;
};

const InputOTPSlot = React.forwardRef<HTMLDivElement, InputOTPSlotProps>(
  ({ className, index, ...props }, ref) => {
    const context = React.useContext(InputOTPContext);

    if (!context) {
      throw new Error("InputOTPSlot must be used within InputOTP.");
    }

    const char = context.value[index] ?? "";
    const isActive = context.isFocused && context.activeIndex === index;

    return (
      <div
        ref={ref}
        data-slot="input-otp-slot"
        data-active={isActive || undefined}
        data-filled={char ? true : undefined}
        className={cn(
          "flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-950 shadow-sm transition-all sm:size-14",
          isActive && "border-slate-950 ring-4 ring-slate-200/70",
          context.disabled && "cursor-not-allowed opacity-60",
          className,
        )}
        onMouseDown={(event) => {
          event.preventDefault();
          context.setSelection(index);
        }}
        {...props}
      >
        {char ? (
          <span className="font-mono">{char}</span>
        ) : isActive ? (
          <span className="h-5 w-px animate-pulse bg-slate-900" />
        ) : null}
      </div>
    );
  },
);

InputOTPSlot.displayName = "InputOTPSlot";

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
