create table if not exists vocabulary_packs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  name text not null,
  daily_new_count int not null default 10,
  daily_review_count int not null default 20,
  total_words int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists vocabulary_word_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  pack_id uuid not null references vocabulary_packs(id) on delete cascade,
  word text not null,
  meaning text not null,
  notes text not null default '',
  sort_order int not null default 0,
  introduced_on date,
  next_review_on date,
  review_stage int not null default 0,
  total_attempts int not null default 0,
  correct_attempts int not null default 0,
  completed boolean not null default false
);

create table if not exists vocabulary_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  pack_id uuid not null references vocabulary_packs(id) on delete cascade,
  word_item_id uuid not null references vocabulary_word_items(id) on delete cascade,
  date date not null,
  mode text not null check (mode in ('new', 'review')),
  prompt text not null,
  expected_answer text not null,
  student_answer text not null,
  correct boolean not null default false
);

create table if not exists homework_question_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  subject text not null,
  prompt text not null,
  correct_answer text not null,
  explanation text not null default '',
  sort_order int not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists homework_question_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  question_id uuid not null references homework_question_items(id) on delete cascade,
  date date not null,
  subject text not null,
  student_answer text not null,
  correct_answer text not null,
  correct boolean not null default false
);

create table if not exists reading_passage_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  title text not null,
  passage text not null,
  source text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists reading_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  passage_id uuid not null references reading_passage_items(id) on delete cascade,
  date date not null,
  title text not null,
  questions jsonb not null default '[]'::jsonb,
  selected_answers int[] not null default '{}',
  correct_count int not null default 0,
  total_questions int not null default 0,
  perfect boolean not null default false
);
