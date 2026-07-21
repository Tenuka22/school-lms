"use client"

import * as React from "react"
import { useLocation } from "@tanstack/react-router"
import { IconUsers, IconCommand } from "@tabler/icons-react"

import { NavSwitcher } from "@/components/nav/nav-switcher"
import type { NavMode } from "@/components/nav/nav-switcher"
import { NavMain } from "@/components/nav/nav-main"
import { NavProjects } from "@/components/nav/nav-projects"
import { NavUser } from "@/components/nav/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

const MODES: NavMode[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    logo: IconCommand,
    description: "Overview",
    url: "/",
  },
  {
    id: "students-management",
    name: "Students Management",
    logo: IconUsers,
    description: "Enrollments & Records",
    url: "/student-management",
  },
]

const STUDENT_MANAGEMENT_NAV = {
  navMain: [
    {
      title: "Enrollment",
      url: "/student-management",
      icon: <IconUsers />,
      isActive: true,
      items: [
        { title: "G1 Enrollment", url: "/student-management/enrollment/g1" },
      ],
    },
  ],
  projects: [],
}

function getModeData(modeId: string) {
  if (modeId === "students-management") return STUDENT_MANAGEMENT_NAV
  return { navMain: [], projects: [] }
}

function getActiveMode(pathname: string): NavMode {
  if (pathname.startsWith("/student-management")) return MODES[1]
  return MODES[0]
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: { email: string; sub: string } | null
}) {
  const { pathname } = useLocation()
  const activeMode = getActiveMode(pathname)
  const modeData = getModeData(activeMode.id)

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <NavSwitcher modes={MODES} activeMode={activeMode} />
      </SidebarHeader>
      <SidebarContent>
        {modeData.navMain.length > 0 && <NavMain items={modeData.navMain} />}
        {modeData.projects.length > 0 && (
          <NavProjects projects={modeData.projects} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
