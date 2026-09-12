/**
 * Delete profile pictures no user row points at.
 *
 * The `profiles` bucket accumulated 41 files for what is, at any moment, at
 * most one picture per account: every upload was supposed to remove its
 * predecessor and evidently did not, from June 2025 through March 2026. Seven
 * of them belong to accounts that no longer exist at all.
 *
 * "Orphan" is defined against the database, never against the filename: a file
 * is kept if and only if some `users` row still references it. That way a
 * picture uploaded a second ago is safe even if this runs mid-upload, and a
 * deleted account's files go regardless of how they were named.
 *
 *   node scripts/prune-orphan-avatars.js            # report only
 *   node scripts/prune-orphan-avatars.js --delete   # actually remove
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY: the bucket carries no policies, so the anon
 * key can list but not remove.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const db = require('../config/db');

const BUCKET = 'profiles';
const APPLY = process.argv.includes('--delete');

const bytes = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  // Everything any account still points at. Three columns have historically
  // held an avatar, so all three are checked — missing one would delete a
  // picture that is on screen right now.
  const { rows } = await db.query(`
    SELECT DISTINCT split_part(u.src, 'profiles/', 2) AS file
    FROM users,
         LATERAL (VALUES (avatar), (profile_picture_url), (preferences->>'profilePicture')) AS u(src)
    WHERE u.src LIKE '%/storage/%'
  `);
  const referenced = new Set(rows.map((r) => r.file).filter(Boolean));

  // list() pages at 100 by default and this bucket is flat.
  const all = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: 100, offset, sortBy: { column: 'created_at', order: 'asc' } });
    if (error) throw new Error(`list failed: ${error.message}`);
    all.push(...data);
    if (data.length < 100) break;
  }

  const orphans = all.filter((f) => !referenced.has(f.name));
  const freed = orphans.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);

  console.log(`bucket ${BUCKET}: ${all.length} files`);
  console.log(`  referenced by a user row : ${all.length - orphans.length}`);
  console.log(`  orphaned                 : ${orphans.length}  (${bytes(freed)})`);

  if (!orphans.length) return;
  if (!APPLY) {
    console.log('\nDry run. Re-run with --delete to remove them.');
    return;
  }

  // In batches: one remove() call with 40 paths fails as a unit, and a partial
  // failure would be hard to tell from a total one.
  let removed = 0;
  for (let i = 0; i < orphans.length; i += 20) {
    const batch = orphans.slice(i, i + 20).map((f) => f.name);
    const { data, error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) throw new Error(`remove failed: ${error.message}`);
    removed += data.length;
    // A remove() that matches nothing returns an empty array without erroring,
    // which is exactly how a silent no-op looks. Say so rather than claim success.
    if (data.length !== batch.length) {
      console.warn(`  batch ${i / 20 + 1}: asked for ${batch.length}, removed ${data.length}`);
    }
  }

  console.log(`\nremoved ${removed} files, freed ${bytes(freed)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err.message); process.exit(1); });
