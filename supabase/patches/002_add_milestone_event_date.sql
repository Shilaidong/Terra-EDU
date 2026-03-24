alter table milestones
  add column if not exists event_date date;

update milestones
set event_date = coalesce(
  event_date,
  to_date(date_label || ' ' || extract(year from current_date)::text, 'Mon DD YYYY')
)
where event_date is null;

alter table milestones
  alter column event_date set not null;
