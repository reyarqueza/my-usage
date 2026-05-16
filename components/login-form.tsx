import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { loginWithGitHub } from "@/app/actions/auth"

export function LoginForm() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your GitHub account to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={loginWithGitHub}>
          <Button type="submit" className="w-full">
            Continue with GitHub
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
