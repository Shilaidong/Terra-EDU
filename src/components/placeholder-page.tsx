import { LogoutButton } from "@/components/client-tools";
import { PlaceholderCard, RoleShell } from "@/components/terra-shell";
import type { SessionPayload, UserRole } from "@/lib/types";

export function RolePlaceholderPage({
  session,
  role,
  title,
  description,
  activeHref,
}: {
  session: SessionPayload;
  role: UserRole;
  title: string;
  description: string;
  activeHref: string;
}) {
  return (
    <RoleShell
      session={session}
      title={title}
      subtitle="This launch-safe page keeps navigation complete while the deeper workflow grows incrementally."
      activeHref={activeHref}
      hero={<LogoutButton />}
    >
      <PlaceholderCard role={role} title={title} description={description} />
    </RoleShell>
  );
}
