import { Card } from "@/components/ui/card"
import type { G1Application } from "@/lib/api-client/types.gen"

interface PipelineCardProps {
  enrollment: G1Application
  laneStatus: string
  onClick?: () => void
}

export function PipelineCard({ enrollment, laneStatus, onClick }: PipelineCardProps) {
  return (
    <Card
      className={`p-3 transition-all ${onClick ? "cursor-pointer hover:ring-2 hover:ring-primary/30" : "cursor-default"}`}
      onClick={onClick}
    >
      <div className="text-xs text-muted-foreground font-mono">
        {enrollment.id?.slice(0,8) ?? "—"}
      </div>
      <div className="font-medium text-sm mt-0.5 truncate">
        {enrollment.full_name || "—"}
      </div>
      {laneStatus === "ProvisionallyApproved" && enrollment.total_marks != null && (
        <div className="flex items-center gap-1 mt-2 text-xs font-mono">
          <span className="text-muted-foreground">Marks:</span>
          <span className="font-bold">{enrollment.total_marks}</span>
        </div>
      )}
      <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground">
        <span>{enrollment.created_at ? new Date(enrollment.created_at).toLocaleDateString() : ""}</span>
      </div>
    </Card>
  )
}
