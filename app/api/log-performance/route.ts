import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

interface PerformanceLog {
    type: "long-task" | "inp" | "interaction"
    duration?: number
    name?: string
    value?: number
    eventType?: string
    eventTarget?: string
    url?: string
    userAgent?: string
    timestamp?: number
}

export async function POST(request: NextRequest) {
    try {
        const data: PerformanceLog = await request.json()

        // Add metadata
        const logEntry = {
            ...data,
            url: request.nextUrl.pathname,
            userAgent: request.headers.get("user-agent"),
            timestamp: Date.now(),
        }

        // Log to Vercel (will appear in deployment logs)
        if (data.type === "long-task" && data.duration && data.duration > 50) {
            console.warn("⚠️ Long Task detected:", logEntry)
        } else if (data.type === "inp" && data.value && data.value > 500) {
            console.warn("⚠️ High INP detected:", logEntry)
        } else {
            console.log("📊 Performance metric:", logEntry)
        }

        // You could also send to external monitoring service here
        // Example: await sendToDatadog(logEntry)
        // Example: await sendToSentry(logEntry)

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error("Failed to log performance metric:", error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
