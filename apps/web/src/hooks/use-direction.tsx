import * as React from "react"
import type { Direction } from "@/types/data-grid"

const DirectionContext = React.createContext<Direction>("ltr")

export function DirectionProvider({
  children,
  dir = "ltr",
}: {
  children: React.ReactNode
  dir?: Direction
}) {
  return (
    <DirectionContext.Provider value={dir}>
      {children}
    </DirectionContext.Provider>
  )
}

export function useDirection(dir?: Direction): Direction {
  const context = React.useContext(DirectionContext)
  return dir ?? context
}
