alter table if exists student_application_profiles
  add column if not exists transcript_source_markdown text not null default '',
  add column if not exists transcript_structured_markdown text not null default '',
  add column if not exists planning_book_markdown text not null default '';
