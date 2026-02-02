"use client"

import { useWordsetUpdate } from "@/hooks/use-wordset-update"

export function CacheInvalidator() {
    useWordsetUpdate()
    return null
}
