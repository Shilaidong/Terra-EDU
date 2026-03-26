insert into users (id, email, role, name, avatar)
values
  ('11111111-1111-1111-1111-111111111111', 'student@terra.edu', 'student', 'Amara Chen', '/api/assets/avatar/a1.png'),
  ('22222222-2222-2222-2222-222222222222', 'parent@terra.edu', 'parent', 'Li Wei', '/api/assets/avatar/a3.png'),
  ('33333333-3333-3333-3333-333333333333', 'consultant@terra.edu', 'consultant', 'Sofia Martinez', '/api/assets/avatar/a2.png'),
  ('44444444-3333-3333-3333-333333333333', 'admin@terra.edu', 'admin', 'Terra Admin', '/api/assets/avatar/a5.png')
on conflict (id) do nothing;

insert into profiles (user_id, school, grade_or_title, bio)
values
  ('11111111-1111-1111-1111-111111111111', 'Westside Academy', 'Grade 11 Student', 'Ambitious environmental engineering applicant balancing STEM depth and extracurricular leadership.'),
  ('22222222-2222-2222-2222-222222222222', 'Parent Account', 'Family Oversight', 'Monitoring academic progress and consultant follow-ups.'),
  ('33333333-3333-3333-3333-333333333333', 'Terra Edu', 'Senior Admissions Consultant', 'Managing a cohort of international applicants across the US and UK.'),
  ('44444444-3333-3333-3333-333333333333', 'Terra Edu', 'Platform Administrator', 'Managing registrations, bindings, and access control.')
on conflict do nothing;

insert into students (
  id, user_id, name, grade, school, phase, target_countries, dream_schools, intended_major, completion, check_in_streak, mastery_average, avatar
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Amara Chen',
    'Grade 11',
    'Westside Academy',
    'Research',
    array['USA', 'United Kingdom'],
    array['Stanford University', 'UCL London'],
    'Environmental Engineering',
    68,
    18,
    4.1,
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80'
  )
on conflict (id) do nothing;

insert into student_application_profiles (
  student_id,
  legal_first_name,
  legal_last_name,
  preferred_name,
  date_of_birth,
  citizenship,
  birth_country,
  phone_number,
  address_line_1,
  city,
  state_province,
  postal_code,
  country_of_residence,
  high_school_name,
  curriculum_system,
  graduation_year,
  gpa,
  class_rank,
  english_proficiency_status,
  intended_start_term,
  passport_country,
  additional_context,
  competitions,
  activities
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Amara',
    'Chen',
    'Amara',
    '2008-08-16',
    'China',
    'China',
    '+86 138 0000 0000',
    '88 Riverside Avenue',
    'Shanghai',
    'Shanghai',
    '200000',
    'China',
    'Westside Academy',
    'AP',
    '2027',
    '3.86/4.00',
    'Top 10%',
    'Plan to submit IELTS',
    'Fall 2027',
    'China',
    'Interested in sustainability, research, and environmental systems.',
    '[{"name":"International Young Eco-Hero Summit","field":"Environmental research","year":"2025","level":"International","result":"Global finalist"}]'::jsonb,
    '[{"name":"Environmental Action Club","role":"Founder & President","grades":"10-11","timeCommitment":"3 hrs/week, 30 weeks/year","impact":"Led 18 members and launched campus recycling campaign."}]'::jsonb
  )
on conflict (student_id) do nothing;

insert into student_parent_links (student_id, parent_user_id)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222')
on conflict do nothing;

insert into student_consultant_links (student_id, consultant_user_id)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333')
on conflict do nothing;

insert into tasks (
  id, student_id, title, description, start_date, end_date, timeline_lane, due_label, due_date, category, priority, status, owner_role
)
values
  (
    '44444444-4444-4444-4444-444444444441',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Upload IELTS results',
    'Finalize the score report and upload it to the application hub.',
    '2026-03-24',
    '2026-03-26',
    'standardized_exams',
    'Due by 5:00 PM',
    '2026-03-26',
    'Documents',
    'High',
    'pending',
    'student'
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Review Personal Statement draft',
    'Prepare advisor comments and next revision notes.',
    '2026-03-25',
    '2026-03-27',
    'application_progress',
    'Advisor session at 2 PM',
    '2026-03-27',
    'Essay',
    'High',
    'in_progress',
    'consultant'
  ),
  (
    '44444444-4444-4444-4444-444444444443',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Confirm housing deposit',
    'Verify payment readiness and supporting documents.',
    '2026-03-27',
    '2026-03-29',
    'application_progress',
    'Priority: High',
    '2026-03-29',
    'Finance',
    'High',
    'pending',
    'student'
  )
on conflict (id) do nothing;

insert into milestones (id, student_id, title, event_date, date_label, status, type)
values
  (
    '55555555-5555-5555-5555-555555555551',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'IELTS Final Submission',
    '2026-04-02',
    'Apr 02',
    'upcoming',
    'deadline'
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'College Essay Draft',
    '2026-04-10',
    'Apr 10',
    'upcoming',
    'deadline'
  ),
  (
    '55555555-5555-5555-5555-555555555553',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'STEM Competition Result',
    '2026-05-03',
    'May 03',
    'upcoming',
    'deadline'
  )
on conflict (id) do nothing;

insert into checkin_records (id, student_id, curriculum, chapter, mastery, date, notes)
values
  (
    '66666666-6666-6666-6666-666666666661',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'AP Physics',
    'Electromagnetism',
    4,
    '2026-03-24',
    'Conceptually solid, needs more timed practice.'
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'AP Calculus',
    'Series & Convergence',
    5,
    '2026-03-23',
    'Excellent command on problem sets.'
  )
on conflict (id) do nothing;

insert into content_items (id, type, title, subtitle, country, tags, difficulty, status, source)
values
  (
    '77777777-7777-7777-7777-777777777771',
    'school',
    'Stanford University',
    'Palo Alto, California',
    'United States',
    array['Engineering', 'Research', 'Need-aware'],
    'Reach',
    'published',
    'manual'
  ),
  (
    '77777777-7777-7777-7777-777777777772',
    'major',
    'Environmental Engineering',
    'Sustainability, systems, impact',
    null,
    array['STEM', 'Climate', 'Interdisciplinary'],
    'Match',
    'published',
    'manual'
  ),
  (
    '77777777-7777-7777-7777-777777777773',
    'competition',
    'International Young Eco-Hero Summit',
    'Research & innovation challenge',
    'Global',
    array['Research', 'Sustainability'],
    'Match',
    'published',
    'manual'
  )
on conflict (id) do nothing;

insert into school_content_details (content_item_id, ranking, city, tuition_usd, acceptance_rate)
values
  (
    '77777777-7777-7777-7777-777777777771',
    '6',
    'Palo Alto',
    65127,
    '3.9%'
  )
on conflict (content_item_id) do nothing;

insert into major_content_details (content_item_id, degree, stem_eligible, recommended_background, career_paths)
values
  (
    '77777777-7777-7777-7777-777777777772',
    'BS',
    true,
    'Physics, calculus, environmental systems',
    array['Sustainability Consultant', 'Water Systems Engineer']
  )
on conflict (content_item_id) do nothing;

insert into competition_content_details (content_item_id, organizer, eligibility, award, season)
values
  (
    '77777777-7777-7777-7777-777777777773',
    'Eco Future Alliance',
    'Grade 9-12 teams',
    'Global finalist recognition',
    'Spring'
  )
on conflict (content_item_id) do nothing;

insert into advisor_notes (id, student_id, consultant_id, title, summary, created_at)
values
  (
    '88888888-8888-8888-8888-888888888881',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '33333333-3333-3333-3333-333333333333',
    'Profile momentum is strong',
    'Amara is ahead on language scores; next leverage point is deeper narrative alignment in essays.',
    '2026-03-23T09:00:00.000Z'
  ),
  (
    '88888888-8888-8888-8888-888888888882',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '33333333-3333-3333-3333-333333333333',
    'Parent sync completed',
    'Discussed research timeline and competition positioning with Li Wei.',
    '2026-03-22T14:30:00.000Z'
  )
on conflict (id) do nothing;

insert into analytics_snapshots (id, date, active_students, task_completion_rate, milestone_hit_rate, at_risk_count)
values
  (
    '99999999-9999-9999-9999-999999999991',
    '2026-03-24',
    148,
    0.8890,
    0.9400,
    5
  )
on conflict (id) do nothing;
