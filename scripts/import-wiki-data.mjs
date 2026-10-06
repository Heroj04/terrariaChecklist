import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fetchWikiPage } from './wiki-api.mjs';
import * as critters from './importers/critters.mjs';
import * as paintings from './importers/paintings.mjs';
import * as statues from './importers/statues.mjs';

const GAME_VERSION = '1.4.5.8';
const OUTPUT = resolve(`public/data/terraria-${GAME_VERSION}.json`);
const importers = [critters, paintings, statues];

const pages = {};
const items = {};
for (const importer of importers) {
  process.stdout.write(`Reading ${importer.page}…\n`);
  const page = await fetchWikiPage(importer.page);
  const records = importer.extract(page.$);
  if (records.length !== importer.expectedCount) {
    throw new Error(`${importer.page}: expected ${importer.expectedCount} entries, extracted ${records.length}.`);
  }
  const ids = records.map((record) => record.id);
  if (new Set(ids).size !== ids.length) throw new Error(`${importer.page}: duplicate item IDs detected.`);
  pages[importer.page] = page;
  items[importer.page.toLowerCase()] = records;
  console.log(`  ${records.length} entries, revision ${page.revision?.revid ?? 'unknown'}`);
}

const dataset = {
  gameVersion: GAME_VERSION,
  wikiSnapshotDate: new Date().toISOString().slice(0, 10),
  wikiRevision: Object.values(pages).map((page) => page.revision?.revid ?? 'unknown').join(' / '),
  sources: { critters: 'Critters', paintings: 'Paintings', statues: 'Statues' },
  license: 'CC BY-NC-SA 4.0 for wiki-derived article content; check file-specific terms for images.',
  counts: Object.fromEntries(Object.entries(items).map(([category, records]) => [category, records.length])),
  items,
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
console.log(`Wrote ${OUTPUT}`);