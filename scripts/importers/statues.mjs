import { cleanText, directTableRows, headingSections, makeRecord, stableSlug, WIKI } from '../wiki-api.mjs';

export const page = 'Statues';
export const expectedCount = 117;

export function extract($) {
  const functional = [];

  $('.mw-parser-output table.terraria').each((_, table) => {
    const heading = $(table).prevAll('h3').first().find('.mw-headline').text();
    const group = cleanText(heading) || 'Other statues';
    directTableRows($, table).each((__, row) => {
      const firstCell = $(row).find('td').first();
      if (!firstCell.length || !cleanText(firstCell.text()).includes('Item ID:')) return;
      const record = makeRecord($, row, group, page);
      if (record) functional.push(record);
    });
  });

  const ids = new Set(functional.map((item) => item.id));
  const illustrated = [];
  headingSections($, ['Decorative_statues', 'Text_statues']).forEach((heading) => {
    const group = cleanText($(heading).find('.mw-headline').text());
    let node = $(heading).next();
    while (node.length && !/^h2$/i.test(node[0].tagName)) {
      node.find('img[alt]').addBack('img[alt]').each((_, image) => {
        const name = cleanText($(image).attr('alt') || '')
          .replace(/\.png$/i, '')
          .replace(/\s+placed$/i, '')
          .trim();
        if (!name || !/Statue$/i.test(name)) return;
        const id = `wiki:${stableSlug(name)}`;
        if (ids.has(id)) return;
        ids.add(id);
        illustrated.push({
          id,
          name,
          group,
          image: new URL($(image).attr('src'), WIKI).href,
          wikiUrl: `${WIKI}/wiki/${encodeURIComponent(name.replaceAll(' ', '_'))}`,
          source: page,
        });
      });
      node = node.next();
    }
  });

  return [...new Map([...functional, ...illustrated].map((item) => [item.id, item])).values()];
}