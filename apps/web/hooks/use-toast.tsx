"use client"

import type { ReactNode } from "react"
import { toast as sonnerToast } from "sonner"

type ToastVariant = "default" | "destructive"

export interface UseToastOptions {
    title?: string
    description?: string
    /**
     * 'destructive' maps to sonnerToast.error()
     */
    variant?: ToastVariant
    /**
     * Optional extra content (e.g., an action button) that some legacy calls may pass.
     * Sonner doesn't support arbitrary action nodes in the same way; consider inlining to description.
     */
    action?: ReactNode
}

/**
 * Compatibility wrapper:
 * - Preserves the old shadcn `useToast` shape so existing imports keep working.
 * - Internally calls Sonner's `toast`/`toast.error`.
 */
export function useToast() {
    return { toast }
}

/**
 * Direct export to mirror older usage patterns:
 * import { toast } from "@/hooks/use-toast"
 */
export function toast(opts: UseToastOptions) {
    const { title, description, variant } = opts || {}
    if (variant === "destructive") {
        return sonnerToast.error(title ?? "", { description })
    }
    return sonnerToast(title ?? "", { description })
}

// Optional helpers for convenience
export const toastSuccess = (title: string, description?: string) => sonnerToast.success(title, { description })
export const toastInfo = (title: string, description?: string) => sonnerToast(title, { description })
export const toastWarning = (title: string, description?: string) => sonnerToast.warning(title, { description })