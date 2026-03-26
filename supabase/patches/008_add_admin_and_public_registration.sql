alter table users drop constraint if exists users_role_check;
alter table users
add constraint users_role_check
check (role in ('student', 'parent', 'consultant', 'admin'));

insert into users (id, email, role, name, avatar)
values (
  '44444444-3333-3333-3333-333333333333',
  'admin@terra.edu',
  'admin',
  'Terra Admin',
  '/api/assets/avatar/a5.png'
)
on conflict (id) do update set
  email = excluded.email,
  role = excluded.role,
  name = excluded.name,
  avatar = excluded.avatar;

insert into profiles (user_id, school, grade_or_title, bio)
values (
  '44444444-3333-3333-3333-333333333333',
  'Terra Edu',
  'Platform Administrator',
  'Managing registrations, bindings, and access control.'
)
on conflict do nothing;
