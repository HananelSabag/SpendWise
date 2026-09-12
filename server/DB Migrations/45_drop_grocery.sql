-- The grocery list moves out.
--
-- It grew here as a side feature and is now its own app, on its own schema,
-- with its own client and its own repository. Nothing in SpendWise reads any of
-- this any more: the routes, controllers, models, middleware and the whole
-- client feature go in the same change.
--
-- Migrations 40, 41, 42 and 44 stay where they are. They are the record of what
-- was applied, and rewriting that record to make the past look tidier is how a
-- schema history stops being worth trusting.
--
-- Dropped with it: 3 lists, 4 memberships, 30 items, 6 trips, 3 invitations.
-- That data lives on in the new app, which started clean rather than importing
-- it — a shopping list is worth nothing the week after the shop.

-- Children first. The foreign keys cascade anyway; being explicit says what is
-- actually going.
drop table if exists public.grocery_items            cascade;
drop table if exists public.grocery_trips            cascade;
drop table if exists public.grocery_list_invitations cascade;
drop table if exists public.grocery_list_members     cascade;
drop table if exists public.grocery_lists            cascade;

-- The trigger function those tables shared. Flagged by the linter for a mutable
-- search_path, and now simply unused.
drop function if exists public.set_grocery_updated_at() cascade;

-- A notification for a feature that no longer exists renders as a title with no
-- body and a link to a 404.
delete from public.notifications where type like 'grocery%';

-- Three accounts opened the app straight into the grocery list. The client no
-- longer honours that value, so they would silently land on the dashboard
-- instead; clearing it makes the stored preference match what actually happens.
update public.users
   set preferences = (preferences - 'shopping_list_as_default_page' - 'home_preference_set')
                     || jsonb_build_object('default_home', 'dashboard')
 where preferences->>'default_home' in ('grocery', 'shopping')
    or (preferences->>'shopping_list_as_default_page') = 'true';

-- Per-mode onboarding flags collapse to a boolean: there is one app to have
-- been welcomed to.
update public.users
   set preferences = jsonb_set(
         preferences, '{onboarding_seen}',
         to_jsonb((preferences #>> '{onboarding_seen,full}') = 'true'))
 where jsonb_typeof(preferences -> 'onboarding_seen') = 'object';

-- NOT done here: the `grocery` and `receipts` storage buckets.
--
-- Supabase refuses direct DELETE on storage.objects — `storage.protect_delete()`
-- raises 42501 — because orphaning objects that way loses the files with no way
-- to find them again. Both buckets have to go through the Storage API or the
-- dashboard: Storage → select the bucket → Delete bucket.
--
--   grocery   14 item photos, public bucket
--   receipts  empty, private bucket
