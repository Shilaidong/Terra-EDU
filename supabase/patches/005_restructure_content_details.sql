alter table if exists content_items
  drop column if exists registration_date,
  drop column if exists deadline_date;

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
