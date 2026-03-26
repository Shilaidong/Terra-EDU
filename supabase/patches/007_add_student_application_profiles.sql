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

alter table if exists student_application_profiles
  add column if not exists competitions jsonb not null default '[]'::jsonb,
  add column if not exists activities jsonb not null default '[]'::jsonb;
