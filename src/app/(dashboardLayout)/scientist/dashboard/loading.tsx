import { LoadingState } from "@/components/ui/data-state";

export default function ScientistDashboardLoading() {
  return (
    <LoadingState
      title="Loading scientist dashboard"
      description="Preparing your idea workspace."
      rows={4}
    />
  );
}
