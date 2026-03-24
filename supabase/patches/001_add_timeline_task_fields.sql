alter table tasks
  add column if not exists start_date date;

alter table tasks
  add column if not exists end_date date;

alter table tasks
  add column if not exists timeline_lane text;

update tasks
set
  start_date = coalesce(start_date, due_date),
  end_date = coalesce(end_date, due_date)
where start_date is null
   or end_date is null;

update tasks
set timeline_lane = case
  when lower(category) like '%exam%' then 'standardized_exams'
  when lower(category) like '%application%' then 'application_progress'
  when lower(category) like '%competition%' then 'competitions'
  when lower(category) like '%deadline%' then 'application_progress'
  when lower(category) like '%finance%' then 'application_progress'
  when lower(category) like '%document%' then 'application_progress'
  when lower(category) like '%essay%' then 'application_progress'
  else 'activities'
end
where timeline_lane is null;

alter table tasks
  alter column start_date set not null;

alter table tasks
  alter column end_date set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_timeline_lane_check'
  ) then
    alter table tasks
      add constraint tasks_timeline_lane_check
      check (timeline_lane in ('standardized_exams', 'application_progress', 'activities', 'competitions'));
  end if;
end $$;

alter table tasks
  alter column timeline_lane set not null;
