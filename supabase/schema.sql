create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('student', 'parent', 'consultant', 'admin')),
  name text not null,
  avatar text,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  school text,
  grade_or_title text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  name text not null,
  grade text not null,
  school text not null,
  phase text not null,
  target_countries text[] not null default '{}',
  dream_schools text[] not null default '{}',
  intended_major text not null,
  completion int not null default 0,
  check_in_streak int not null default 0,
  mastery_average numeric(4,2) not null default 0,
  avatar text,
  created_at timestamptz not null default now()
);

create table if not exists student_application_profiles (
  student_id uuid primary key references students(id) on delete cascade,
  legal_first_name text not null default '',
  legal_last_name text not null default '',
  preferred_name text not null default '',
  date_of_birth text not null default '',
  citizenship text not null default '',
  birth_country text not null default '',
  phone_number text not null default '',
  address_line_1 text not null default '',
  city text not null default '',
  state_province text not null default '',
  postal_code text not null default '',
  country_of_residence text not null default '',
  high_school_name text not null default '',
  curriculum_system text not null default '',
  graduation_year text not null default '',
  gpa text not null default '',
  class_rank text not null default '',
  english_proficiency_status text not null default '',
  intended_start_term text not null default '',
  passport_country text not null default '',
  additional_context text not null default '',
  competitions jsonb not null default '[]'::jsonb,
  activities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists student_parent_links (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  parent_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists student_consultant_links (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  consultant_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  title text not null,
  description text not null,
  start_date date not null,
  end_date date not null,
  timeline_lane text not null check (timeline_lane in ('standardized_exams', 'application_progress', 'activities', 'competitions')),
  due_label text not null,
  due_date date not null,
  category text not null,
  priority text not null check (priority in ('Low', 'Medium', 'High')),
  status text not null check (status in ('pending', 'in_progress', 'done')),
  owner_role text not null check (owner_role in ('student', 'parent', 'consultant')),
  created_at timestamptz not null default now()
);

create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  title text not null,
  event_date date not null,
  date_label text not null,
  status text not null check (status in ('upcoming', 'active', 'done')),
  type text not null check (type in ('exam', 'essay', 'deadline', 'offer')),
  created_at timestamptz not null default now()
);

create table if not exists checkin_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  curriculum text not null,
  chapter text not null,
  mastery int not null check (mastery between 1 and 5),
  date date not null,
  notes text not null,
  created_at timestamptz not null default now()
);

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('course', 'chapter', 'competition', 'school', 'major')),
  title text not null,
  subtitle text not null,
  country text,
  tags text[] not null default '{}',
  difficulty text not null check (difficulty in ('Safety', 'Match', 'Reach')),
  status text not null check (status in ('published', 'draft')),
  source text not null check (source in ('manual', 'import')),
  created_at timestamptz not null default now()
);

create table if not exists school_content_details (
  content_item_id uuid primary key references content_items(id) on delete cascade,
  ranking text,
  city text,
  tuition_usd int,
  acceptance_rate text
);

create table if not exists major_content_details (
  content_item_id uuid primary key references content_items(id) on delete cascade,
  degree text,
  stem_eligible boolean,
  recommended_background text,
  career_paths text[] not null default '{}'
);

create table if not exists competition_content_details (
  content_item_id uuid primary key references content_items(id) on delete cascade,
  organizer text,
  eligibility text,
  award text,
  season text
);

create table if not exists course_content_details (
  content_item_id uuid primary key references content_items(id) on delete cascade,
  provider text,
  format text check (format in ('Online', 'Offline', 'Hybrid')),
  duration_weeks int,
  workload text
);

create table if not exists chapter_content_details (
  content_item_id uuid primary key references content_items(id) on delete cascade,
  curriculum text,
  sequence text,
  estimated_hours int,
  key_skill text
);

create table if not exists advisor_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  consultant_id uuid not null references users(id) on delete cascade,
  title text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  active_students int not null,
  task_completion_rate numeric(5,4) not null,
  milestone_hit_rate numeric(5,4) not null,
  at_risk_count int not null,
  created_at timestamptz not null default now()
);

create table if not exists ai_artifacts (
  id text primary key,
  student_id text,
  role text not null,
  page text not null,
  feature text not null,
  model text not null,
  prompt_version text not null,
  input_summary text not null,
  output_summary text not null,
  sources text[] not null default '{}',
  trace_id text not null,
  decision_id text not null,
  status text not null,
  error_code text,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id text primary key,
  created_at timestamptz not null default now(),
  trace_id text not null,
  decision_id text not null,
  actor_id text not null,
  actor_role text not null,
  page text not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  status text not null,
  latency_ms int not null,
  input_summary text not null,
  output_summary text not null,
  error_code text
);

create index if not exists audit_logs_trace_idx on audit_logs(trace_id);
create index if not exists audit_logs_actor_idx on audit_logs(actor_id);
create index if not exists ai_artifacts_trace_idx on ai_artifacts(trace_id);
