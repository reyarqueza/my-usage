"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { logout } from "@/app/actions/auth"
import { ModeToggle } from "@/components/mode-toggle"

type AppHeaderProps = {
  name?: string | null
  image?: string | null
  showAccountMenu?: boolean
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function AppHeader({
  name,
  image,
  showAccountMenu = true,
}: AppHeaderProps) {
  const displayName = name ?? "User"

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex min-h-[4.75rem] max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
        <h1 className="scroll-m-20 text-balance font-extrabold tracking-tight text-foreground text-4xl sm:text-5xl">
          My Usage
        </h1>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ModeToggle />
          {showAccountMenu ? (
            <>
              <span className="hidden text-sm text-muted-foreground md:inline">
                {displayName}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="size-8">
                        {image ? (
                          <AvatarImage src={image} alt={displayName} />
                        ) : null}
                        <AvatarFallback>{initials(displayName)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => void logout()}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
        </div>
      </div>
      <Separator />
    </header>
  )
}
