import { format } from "date-fns"

export function formatDate(
  date: Date,
  formatStr: string = "MMM d, yyyy"
): string {
  return format(date, formatStr)
}
