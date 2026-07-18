import { Outlet, createFileRoute } from "@tanstack/react-router"

import { AppSidebar } from "@/components/nav/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { getMeAction } from "@/lib/server/auth"
import type { UserInfo } from "@/lib/server/auth"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async (): Promise<{ user: UserInfo | null }> => {
    const result = await getMeAction()
    return { user: result.user }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext()

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="me-2 h-4" />
        </header>
        <div className="p-4 size-full">

        <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
