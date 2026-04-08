import { LoadingState } from "@/components/ui/data-state";

export default function AdminDashboardLoading() {
  return (
    <LoadingState
      title="Loading admin dashboard"
      description="Preparing moderation workspace."
      rows={4}
    />
  );
}
