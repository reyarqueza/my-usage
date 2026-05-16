"use client"

import { ModeToggle } from "@/components/mode-toggle"

/** Floating controls on the login screen (no bordered header row). */
export function AuthThemeCorner() {
  return (
    <div className="absolute top-6 right-6 z-10">
      <ModeToggle />
    </div>
  )
}
