import * as React from "react";

import { cn } from "@lib/utils";

type CheckboxProps = Omit<React.ComponentProps<"input">, "type">;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-slate-500 bg-slate-950 text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70",
        className
      )}
      {...props}
    />
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
