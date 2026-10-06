import { cleanText, directTableRows, headingSections, makeRecord } from '../wiki-api.mjs';

export const page = 'Critters';
export const expectedCount = 96;

export function extract($) {
  const records = [];
  const sections = headingSections($, ['Types', 'Boss_summon_critters']);

  sections.forEach((heading) => {
    let node = $(heading).next();
    while (node.length && !/^h2$/i.test(node[0].tagName)) {
      if (node.is('table')) {
        const headingText = node.prevAll('h3').first().find('.mw-headline').text();
        const group = cleanText(headingText) || 'Critters';
        directTableRows($, node).each((_, row) => {
          if (!$(row).find('td.il2c').length) return;
          const record = makeRecord($, row, group, page);
          if (record) records.push(record);
        });
      }
      node = node.next();
    }
  });

  return [...new Map(records.map((record) => [record.id, record])).values()];
}