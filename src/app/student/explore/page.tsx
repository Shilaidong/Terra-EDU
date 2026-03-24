import { Compass } from "lucide-react";

import { AiRecommendationPanel, ContentFilterTable, LogoutButton } from "@/components/client-tools";
import { HeroBadge, Notice, RoleShell, SectionCard, StatCard } from "@/components/terra-shell";
import { getContentItemsData, getCurrentStudentData } from "@/lib/data";
import { requireSession } from "@/lib/server/guards";

export default async function StudentExplorePage() {
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);
  if (!student) return null;

  const contentItems = await getContentItemsData();

  return (
    <RoleShell
      session={session}
      title="Major & School Exploration"
      subtitle="Filter through schools, majors, courses, and competitions while AI summarizes where your current profile has the strongest fit."
      activeHref="/student/explore"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<Compass className="h-4 w-4" />} title="Focus" value={student.intendedMajor} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Content items" value={`${contentItems.length}`} hint="Seeded from the consultant content library." />
        <StatCard label="Target countries" value={`${student.targetCountries.length}`} hint={student.targetCountries.join(", ")} tone="tertiary" />
        <StatCard label="Dream schools" value={`${student.dreamSchools.length}`} hint="Visible on student, parent, and consultant views." tone="secondary" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Search & filter" eyebrow="Library">
          <ContentFilterTable items={contentItems} />
        </SectionCard>

        <div className="space-y-8">
          <AiRecommendationPanel
            studentId={student.id}
            page="/student/explore"
            feature="student_explore_recommendation"
            prompt="Recommend schools, majors, and competitions that fit the student's current profile and stated goals."
          />
          <SectionCard title="How content enters the product" eyebrow="Operational note">
            <Notice title="Launch data source">
              The first launch uses consultant-side manual entry plus Excel import. That keeps the content maintainable without locking you into a third-party source early.
            </Notice>
          </SectionCard>
        </div>
      </div>
    </RoleShell>
  );
}
