import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type WelcomeCardProps = {
  name: string
  image?: string | null
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function WelcomeCard({ name, image }: WelcomeCardProps) {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="size-12">
          {image ? <AvatarImage src={image} alt={name} /> : null}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <CardTitle>Welcome, {name}</CardTitle>
          <CardDescription>
            Your display name was loaded from Neon via a direct SQL query.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          You are signed in with GitHub and your session is stored in Postgres.
        </p>
      </CardContent>
    </Card>
  )
}
