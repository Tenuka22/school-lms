"use client"

import * as React from "react"
import { useLocation } from "@tanstack/react-router"
import { IconUsers, IconCommand, IconTerminal2, IconRobot, IconBook, IconSettings, IconLifebuoy, IconSend, IconFrame, IconChartPie, IconMap } from "@tabler/icons-react"

import { NavSwitcher, type NavMode } from "@/components/nav/nav-switcher"
import { NavMain } from "@/components/nav/nav-main"
import { NavProjects } from "@/components/nav/nav-projects"
import { NavSecondary } from "@/components/nav/nav-secondary"
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

const DASHBOARD_NAV = {
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: <IconTerminal2 />,
      isActive: true,
      items: [
        { title: "History", url: "#" },
        { title: "Starred", url: "#" },
        { title: "Settings", url: "#" },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: <IconRobot />,
      items: [
        { title: "Genesis", url: "#" },
        { title: "Explorer", url: "#" },
        { title: "Quantum", url: "#" },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: <IconBook />,
      items: [
        { title: "Introduction", url: "#" },
        { title: "Get Started", url: "#" },
        { title: "Tutorials", url: "#" },
        { title: "Changelog", url: "#" },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: <IconSettings />,
      items: [
        { title: "General", url: "#" },
        { title: "Team", url: "#" },
        { title: "Billing", url: "#" },
        { title: "Limits", url: "#" },
      ],
    },
  ],
  projects: [
    { name: "Design Engineering", url: "#", icon: <IconFrame /> },
    { name: "Sales & Marketing", url: "#", icon: <IconChartPie /> },
    { name: "Travel", url: "#", icon: <IconMap /> },
  ],
}

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

const SHARED_SECONDARY = [
  { title: "Support", url: "#", icon: <IconLifebuoy /> },
  { title: "Feedback", url: "#", icon: <IconSend /> },
]

const USER = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

function getModeData(modeId: string) {
  if (modeId === "students-management") return STUDENT_MANAGEMENT_NAV
  return DASHBOARD_NAV
}

function getActiveMode(pathname: string): NavMode {
  if (pathname.startsWith("/student-management")) return MODES[1]
  return MODES[0]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation()
  const activeMode = getActiveMode(pathname)
  const modeData = getModeData(activeMode.id)

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <NavSwitcher modes={MODES} activeMode={activeMode} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={modeData.navMain} />
        {modeData.projects.length > 0 && (
          <NavProjects projects={modeData.projects} />
        )}
        <NavSecondary items={SHARED_SECONDARY} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={USER} />
      </SidebarFooter>
    </Sidebar>
  )
}
