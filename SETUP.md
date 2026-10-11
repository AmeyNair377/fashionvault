# FashionVault: setup guide

## What is in the folder

| File | What it does |
|---|---|
| `index.html` | The website (layout, styling, hero ring with your 12 images, sign-in prompt) |
| `stores.js` | Your list of stores. Edit this to add, remove or rename shops |
| `config.js` | Connects the site to your Supabase backend (empty = preview mode) |
| `admin.html` | Private admin dashboard: sign-ups, active members, favorites |
| `supabase-setup.sql` | One-time database setup you paste into Supabase |

Keep all five in the **same folder**.

## 1. Run it right now (no setup)

Double-click `index.html`. The site works immediately in **preview mode**: sign-up, sign-in and favorites are *simulated on your own device*, so you can test the whole flow. Passwords are not stored or checked in this mode. Use it for development only. Visitors need real accounts (step 3).

## 2. Edit your stores

Open `stores.js`, copy one line, change `id`, `name`, `url` and `alphabetGroup`. Keep each `id` unique and never change it later, because saved favorites are linked to it.

## 3. Real accounts and the admin panel (Supabase, free)

"Backend" just means a server that remembers your users. Supabase provides one, with a free plan.

1. Go to **supabase.com**, sign up, then **New project**. Choose a region near you (for India, a Mumbai/South Asia region if offered) and set a database password. Wait about two minutes.
2. In the project, open **SQL Editor > New query**, paste the whole of `supabase-setup.sql`, press **Run**. This creates the tables and the security rules.
3. Open **Authentication** and check that the **Email** sign-in method is enabled. "Confirm email" should stay **on** for a real site. While testing you can switch it off so you do not have to wait for emails.
4. Open **Project Settings > API**. Copy the **Project URL** and the **anon / publishable key**, and paste them into `config.js`.
5. Open your site and **sign up with your own email**.
6. Back in **SQL Editor**, run this one line to make yourself admin:
   `update public.profiles set is_admin = true where email = 'ameynair737@gmail.com';`
7. Open `admin.html` and sign in with that account. You will see total sign-ups, new this week, who is active right now, favorites saved, a members table and the most favorited shops. It refreshes every 30 seconds.
8. When you put the site online (Netlify, Vercel or GitHub Pages all work), go to **Authentication > URL Configuration** in Supabase and set **Site URL** to your live address, so the confirmation emails link back to your site.

## Safety notes

- The Project URL and the anon key are **meant to be public**. Your data is protected by the security rules in `supabase-setup.sql`: each person can only read and change their own favorites, and nobody can make themselves admin from the website.
- **Never** paste a `service_role` or "secret" key into any of these files.
- `admin.html` is reachable by anyone who knows the address, but it shows nothing unless the signed-in account is an admin.
- Free Supabase projects can pause if unused for a while. If the site says accounts are offline, open the Supabase dashboard and resume the project.

## How the soft sign-in wall behaves

- Once per visit, a dismissible prompt appears about two seconds after the page loads. Close it with the X, the Escape key, clicking outside it, or **Continue as guest**.
- Browsing, search and visiting shops never require an account.
- Tapping a heart while signed out opens a gentle "save this shop" prompt. After signing in, that shop is saved automatically.
- Signed in: favorites are stored in your account and follow you across devices.

## Other things changed while making these updates

- The ONE WHO RULES link was `own.life`; it is now `owr.life` (your original project used that).
- The brand monogram and favicon letter changed from O to F to match FashionVault.
- The separate full-page sign-in/sign-up view was replaced by the dialog, so there is one sign-in screen instead of two. The links `#sign-in` and `#sign-up` open it.
- The privacy and cookie wording now mention accounts. Have it reviewed before launch.
- The cookie-banner storage call is now guarded, so blocked storage can no longer stop the store list from loading.
