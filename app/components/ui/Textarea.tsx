import * as React from "react"
import { Label } from "~/components/ui/Label"
import { cn } from "~/lib/utils"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: string
  error?: string
  helperText?: string
}

function Textarea({ className, label, error, helperText, id, ...props }: TextareaProps): React.ReactElement {
  const generatedId = React.useId()
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : generatedId)

  return (
    <div className="w-full space-y-2">
      {label && (
        <Label htmlFor={inputId} className={cn(error && "text-destructive")}>
          {label}
        </Label>
      )}
      <textarea
        id={inputId}
        data-slot="textarea"
        className={cn(
          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border-0 bg-transparent px-3 py-2 text-base shadow-xs ring-1 ring-stone-200/80 transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y dark:shadow-sm dark:ring-zinc-800/80",
          error && "border-destructive",
          className
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  )
}

export { Textarea }
