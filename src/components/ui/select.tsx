import * as React from "react"

import { cn } from "@/lib/utils"

function Select({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-base",
        "shadow-xs transition-[color,box-shadow,background-color] outline-none",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "dark:bg-input/30 dark:text-foreground dark:border-input",
        "text-foreground bg-background",
        "appearance-none cursor-pointer",
        className
      )}
      {...props}
    />
  )
}

export { Select }
