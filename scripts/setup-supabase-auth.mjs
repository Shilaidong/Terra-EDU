import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const demoUsers = [
  {
    email: "student@terra.edu",
    password: "terra123",
    name: "Amara Chen",
    role: "student",
  },
  {
    email: "parent@terra.edu",
    password: "terra123",
    name: "Li Wei",
    role: "parent",
  },
  {
    email: "consultant@terra.edu",
    password: "terra123",
    name: "Sofia Martinez",
    role: "consultant",
  },
  {
    email: "admin@terra.edu",
    password: "terra123",
    name: "Terra Admin",
    role: "admin",
  },
];

for (const user of demoUsers) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      name: user.name,
      role: user.role,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already been registered")) {
      console.log(`Skipped existing auth user: ${user.email}`);
      continue;
    }

    console.error(`Failed to create auth user ${user.email}:`, error.message);
    process.exitCode = 1;
    continue;
  }

  console.log(`Created auth user ${user.email} (${data.user?.id ?? "unknown"})`);
}
