import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center justify-center gap-10 text-center">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-balance text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
          My Usage
        </h1>
        <h2 className="mx-auto max-w-xl text-lg font-normal leading-relaxed text-muted-foreground text-balance sm:text-xl md:text-2xl">
          Monitor usage of your LLMs, databases, and serverless platforms.
        </h2>
      </div>
      <LoginForm />
    </div>
  )
}
