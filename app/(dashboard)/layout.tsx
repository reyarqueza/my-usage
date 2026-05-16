import { auth } from "@/auth"
import { AppHeader } from "@/components/app-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader name={session?.user?.name} image={session?.user?.image} />
      <main className="mx-auto w-full max-w-5xl flex-1 p-6">{children}</main>
    </div>
  )
}
