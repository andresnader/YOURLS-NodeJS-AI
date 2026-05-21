/**
 * One-shot backfill: hash existing plaintext ApiKey rows.
 *
 * Run after the schema change that adds `keyHash` + `keyPrefix`.
 * Safe to run multiple times — skips rows that already have keyHash set.
 *
 * Usage:
 *   npx tsx scripts/backfill-api-key-hash.ts
 *   # or
 *   node --import tsx scripts/backfill-api-key-hash.ts
 */
import prisma from '../src/lib/prisma';
import { hashApiKey, API_KEY_PREFIX_DISPLAY_LEN } from '../src/lib/api-key';

async function main() {
  const rows = await prisma.apiKey.findMany({
    where: { keyHash: null, key: { not: null } },
    select: { id: true, key: true },
  });

  if (rows.length === 0) {
    console.log('Nothing to backfill. All ApiKey rows already have keyHash.');
    return;
  }

  console.log(`Backfilling ${rows.length} ApiKey row(s)...`);

  let ok = 0;
  let failed = 0;
  for (const row of rows) {
    if (!row.key) continue;
    try {
      await prisma.apiKey.update({
        where: { id: row.id },
        data: {
          keyHash: hashApiKey(row.key),
          keyPrefix: row.key.slice(0, API_KEY_PREFIX_DISPLAY_LEN),
        },
      });
      ok++;
    } catch (e) {
      failed++;
      console.error(`  ✗ ${row.id}:`, e instanceof Error ? e.message : e);
    }
  }

  console.log(`Done. ok=${ok} failed=${failed}`);
  console.log('Next steps:');
  console.log('  1. Verify in DB that all rows have keyHash + keyPrefix set.');
  console.log('  2. Test that existing integrations (WordPress plugin) still authenticate.');
  console.log('  3. When confident, run: npx tsx scripts/drop-plaintext-api-keys.ts');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
