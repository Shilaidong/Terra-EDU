create table if not exists vocabulary_study_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  date date not null,
  pack_name text not null,
  new_words_count int not null default 0,
  review_words_count int not null default 0,
  completed boolean not null default false,
  mastery int not null check (mastery between 1 and 5),
  notes text not null default '',
  review_stage int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists homework_grading_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  date date not null,
  assignment_title text not null,
  prompt_content text not null,
  student_answer text not null,
  reference_answer text not null default '',
  overall_evaluation text not null,
  error_analysis text not null,
  remediation_plan text not null,
  next_step text not null,
  created_at timestamptz not null default now()
);

create table if not exists reading_training_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  date date not null,
  material_title text not null,
  training_type text not null,
  duration_minutes int not null default 0,
  completed_units text not null,
  comprehension int not null check (comprehension between 1 and 5),
  notes text not null default '',
  created_at timestamptz not null default now()
);
