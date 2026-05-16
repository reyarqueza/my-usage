export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-muted/40 p-6">
      {children}
    </div>
  )
}
