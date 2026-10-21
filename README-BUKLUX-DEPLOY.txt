BUKLUX — NETLIFY TEST DEPLOYMENT PACKAGE

Included files:
- index.html (Supabase publishable key already inserted)
- netlify.toml
- netlify/functions/ (Paystack server functions)

IMPORTANT
This is a test package. It does not change your current live site unless you deploy it there.
The publishable Supabase key is intended for browser use. Never put a Supabase secret/service-role key or Paystack secret in index.html.

RECOMMENDED DEPLOYMENT
Because this project includes Netlify Functions for secure Paystack payments, deploy it through a Git-connected Netlify site or the Netlify CLI. A simple static drag-and-drop deploy may publish the page but not properly build/deploy the functions.

1. Create a NEW test site in Netlify. Do not replace the existing Global Pen site yet.
2. Put these files in a GitHub repository, keeping index.html and netlify.toml at the repository root and the functions inside netlify/functions/.
3. In Netlify, choose Add new site > Import an existing project, connect GitHub, and select that repository.
4. Set the publish directory to . (dot) and functions directory to netlify/functions if Netlify asks.
5. In the test site's Site configuration > Environment variables, add:
   SUPABASE_URL = https://xlczgzptbsllpwjowwwd.supabase.co
   SUPABASE_ANON_KEY = your Supabase publishable key
   SUPABASE_SERVICE_ROLE_KEY = your Supabase secret/service-role key (keep private; never share it)
   PAYSTACK_SECRET_KEY = your Paystack TEST secret key (keep private)
6. Redeploy the test site after saving the environment variables.
7. Test sign-up, author submission, admin approval, and Paystack in TEST mode only.

DATABASE
The marketplace SQL was previously run in Supabase. Do not run it again just because you are deploying this package. The actual site still needs end-to-end testing against your Supabase project.

NOT YET INCLUDED IN THIS STAGE
- Full in-platform EPUB/PDF reader
- Reading goals, streaks, focus mode and offline reading controls
- Ratings/reviews and full author earnings/payout reporting
- Automatic email alerts to globalbookhouse5@gmail.com

CONTACT EMAIL: globalbookhouse5@gmail.com
