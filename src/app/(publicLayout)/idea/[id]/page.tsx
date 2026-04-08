import { IdeaDetailClient } from "./_components/idea-detail-client";
import { getServerAuthSession } from "@/lib/auth/session.server";
import { normalizeUserRole } from "@/lib/authUtils";

type IdeaDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function IdeaDetailPage({ params }: IdeaDetailPageProps) {
  const [{ id }, session] = await Promise.all([params, getServerAuthSession()]);

  return (
    <IdeaDetailClient
      ideaId={id}
      isAuthenticated={session.isAuthenticated}
      role={session.isAuthenticated ? normalizeUserRole(session.role) : null}
    />
  );
}
