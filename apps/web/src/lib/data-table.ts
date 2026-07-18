import type { Column } from "@tanstack/react-table"
import type React from "react"

export function getColumnPinningStyle<TData>({
  column,
}: {
  column: Column<TData>
}): React.CSSProperties {
  const isPinned = column.getIsPinned()
  if (!isPinned) return {}

  const isLastLeft = isPinned === "left" && column.getIsLastColumn("left")
  const isFirstRight = isPinned === "right" && column.getIsFirstColumn("right")

  return {
    position: "sticky",
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    boxShadow: isLastLeft
      ? "-4px 0 4px -4px hsl(var(--border)) inset"
      : isFirstRight
        ? "4px 0 4px -4px hsl(var(--border)) inset"
        : undefined,
  }
}
