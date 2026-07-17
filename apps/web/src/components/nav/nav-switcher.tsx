"use client"

import * as React from "react"
import { useNavigate } from "@tanstack/react-router"
import { ChevronsUpDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export interface NavMode {
  id: string
  name: string
  logo: React.ElementType
  description: string
  url: string
}

export function NavSwitcher({
  modes,
  activeMode,
  onModeChange,
}: {
  modes: NavMode[]
  activeMode: NavMode
  onModeChange?: (mode: NavMode) => void
}) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  const onSelect = React.useCallback(
    (mode: NavMode) => {
      onModeChange?.(mode)
      navigate({ to: mode.url })
    },
    [navigate, onModeChange],
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <activeMode.logo className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeMode.name}</span>
              <span className="truncate text-xs">{activeMode.description}</span>
            </div>
            <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Modes
            </DropdownMenuLabel>
            {modes.map((mode, index) => (
              <DropdownMenuItem
                key={mode.id}
                onClick={() => onSelect(mode)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <mode.logo className="size-3.5 shrink-0" />
                </div>
                <div className="grid flex-1 text-start">
                  <span className="font-medium">{mode.name}</span>
                  <span className="text-xs text-muted-foreground">{mode.description}</span>
                </div>
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
