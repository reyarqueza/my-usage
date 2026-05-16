import { AuthThemeCorner } from "@/components/auth-theme-corner"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center bg-muted/40 px-6 py-16">
      <AuthThemeCorner />
      {children}
    </div>
  )
}
