// config.js — connects FashionVault to your Supabase project (the backend).
//
// Leave both values empty and the site runs in PREVIEW MODE: accounts and favorites
// are simulated on your own device only. Fill them in (see SETUP.md) for real accounts.
//
// Both values are safe to be public: they only identify your project. Your data is
// protected by the security rules in supabase-setup.sql.
// NEVER paste a "service_role" or "secret" key here.

window.FASHIONVAULT_CONFIG = {
  supabaseUrl: "https://ciomyprponquukqigewv.supabase.co",      // e.g. "https://ciomyprponquukqigewv.supabase.co"
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpb215cHJwb25xdXVrcWlnZXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NjkyNTksImV4cCI6MjEwNzI0NTI1OX0.rYQ5GL9WYBvM7YD-QuA6a7PAflzPKZc94nFDCjiH9HI"   // the "anon" / "publishable" key from Project Settings > API
};