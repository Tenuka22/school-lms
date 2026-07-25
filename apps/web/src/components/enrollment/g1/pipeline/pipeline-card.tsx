import { Card } from "@/components/ui/card"
import type { G1Application } from "@/lib/api-client/types.gen"

interface PipelineCardProps {
  enrollment: G1Application
  laneStatus: string
  onClick?: () => void
}

export function PipelineCard({
  enrollment,
  laneStatus,
  onClick,
}: PipelineCardProps) {
  return (
    <Card
      className={`p-3 transition-all ${onClick ? "cursor-pointer hover:ring-2 hover:ring-primary/30" : "cursor-default"}`}
      onClick={onClick}
    >
      <div className="font-mono text-xs text-muted-foreground">
        {enrollment.id?.slice(0, 8) ?? "—"}
      </div>
      <div className="mt-0.5 truncate text-sm font-medium">
        {enrollment.reference_no || "—"}
      </div>
      {(laneStatus === "Completed" || laneStatus === "PendingApproval") &&
        enrollment.total_marks != null && (
          <div className="mt-2 flex items-center gap-1 font-mono text-xs">
            <span className="text-muted-foreground">Marks:</span>
            <span className="font-bold">{enrollment.total_marks}</span>
          </div>
        )}
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {enrollment.created_at
            ? new Date(enrollment.created_at).toLocaleDateString()
            : ""}
        </span>
      </div>
    </Card>
  )
}
