import { redirect } from "next/navigation"
import { neon } from "@neondatabase/serverless"
import { auth } from "@/auth"
import { WelcomeCard } from "@/components/welcome-card"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    select name from users where id = ${Number(session.user.id)} limit 1
  `
  const displayName =
    rows[0]?.name ?? session.user.name ?? "GitHub user"

  return (
    <WelcomeCard name={displayName} image={session.user.image} />
  )
}
