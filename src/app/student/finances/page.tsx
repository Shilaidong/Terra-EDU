import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function StudentFinancesPlaceholder() {
  const session = await requireSession("student");
  return (
    <RolePlaceholderPage
      session={session}
      role="student"
      title="Finances"
      activeHref="/student/finances"
      description="Financial milestones already appear in tasks and timelines. This dedicated finance page stays online as a clear expansion point instead of a dead end."
    />
  );
}
