import { cleanText, directTableRows, makeRecord } from '../wiki-api.mjs';

export const page = 'Paintings';
export const expectedCount = 193;

export function extract($) {
  const records = [];
  $('.mw-parser-output table.Paintings-table').each((_, table) => {
    const heading = $(table).prevAll('h3').first().find('.mw-headline').text();
    const group = cleanText(heading) || page;
    directTableRows($, table).each((__, row) => {
      if (!$(row).find('td.il2c').length) return;
      const record = makeRecord($, row, group, page);
      if (record) records.push(record);
    });
  });
  return records;
}