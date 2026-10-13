"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DataTableSearchProps {
    placeholder?: string
    value: string
    onChange: (value: string) => void
    debounceMs?: number
    className?: string
}

export function DataTableSearch({
    placeholder = "Search...",
    value: initialValue,
    onChange,
    debounceMs = 300,
    className,
}: DataTableSearchProps) {
    const [value, setValue] = React.useState(initialValue)

    // Sync external value updates
    React.useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    // Debounce the input value propagation
    React.useEffect(() => {
        if (debounceMs <= 0) {
            onChange(value)
            return
        }

        const timeout = setTimeout(() => {
            onChange(value)
        }, debounceMs)

        return () => clearTimeout(timeout)
    }, [value, onChange, debounceMs])

    return (
        <div className={cn("relative flex items-center", className)}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                role="searchbox"
                aria-label={placeholder}
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-9"
            />
        </div>
    )
}
