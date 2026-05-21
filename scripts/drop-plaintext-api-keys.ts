/**
 * One-shot cleanup: null out the plaintext `key` column on ApiKey rows
 * that already have `keyHash` set. After this, no API key plaintext
 * exists in the DB. Run only AFTER backfill is verified.
 *
 * Usage:
 *   npx tsx scripts/drop-plaintext-api-keys.ts
 */
import prisma from '../src/lib/prisma';

async function main() {
  const targets = await prisma.apiKey.findMany({
    where: { keyHash: { not: null }, key: { not: null } },
    select: { id: true },
  });

  if (targets.length === 0) {
    console.log('Nothing to clean. No rows have both keyHash and a plaintext key.');
    return;
  }

  console.log(`Nulling plaintext key on ${targets.length} row(s)...`);

  const result = await prisma.apiKey.updateMany({
    where: { keyHash: { not: null }, key: { not: null } },
    data: { key: null },
  });

  console.log(`Done. Updated ${result.count} row(s).`);
  console.log('You can now drop the `key` column in a future schema migration.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
