"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

type Theme = "light" | "dark"

function applyTheme(next: Theme) {
    if (typeof document === "undefined") return
    document.documentElement.setAttribute("data-theme", next)
    try {
        localStorage.setItem("theme", next)
    } catch {}
}

export function ThemeToggle() {
    const [mounted, setMounted] = React.useState(false)
    const [theme, setTheme] = React.useState<Theme>("light")

    React.useEffect(() => {
        setMounted(true)
        try {
            const stored = localStorage.getItem("theme") as Theme | null
            const systemDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
            const initial: Theme = stored || (systemDark ? "dark" : "light")
            setTheme(initial)
            applyTheme(initial) // ensure DOM reflects current theme on mount
        } catch {
            setTheme("light")
            applyTheme("light")
        }
    }, [])

    const toggle = () => {
        const next: Theme = theme === "dark" ? "light" : "dark"
        setTheme(next)
        applyTheme(next)
    }

    // Render stable skeleton until mounted to avoid hydration mismatch
    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" aria-label="Toggle theme" className="rounded-full">
                <Sun className="h-4 w-4 opacity-0" />
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={toggle}
            className="rounded-full hover:bg-muted/60"
        >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}