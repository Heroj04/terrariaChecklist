import { load } from 'cheerio';

export const WIKI = 'https://terraria.wiki.gg';

function apiUrl(params) {
  const url = new URL('/api.php', WIKI);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'TerrariaFieldNotes/1.0 (wiki data snapshot; personal project)' },
  });
  if (!response.ok) throw new Error(`Wiki API returned ${response.status}`);
  return response.json();
}

export async function fetchWikiPage(page) {
  const parsed = await getJson(apiUrl({
    action: 'parse', page, prop: 'text', format: 'json', formatversion: '2',
  }));
  if (parsed.error) throw new Error(`Wiki API error for ${page}: ${parsed.error.info}`);

  const revisions = await getJson(apiUrl({
    action: 'query', prop: 'revisions', titles: page,
    rvprop: 'ids|timestamp', format: 'json', formatversion: '2',
  }));
  const revision = revisions.query?.pages?.[0]?.revisions?.[0];
  return { $: load(parsed.parse.text), revision, pageId: parsed.parse.pageid };
}

export function cleanText(value) {
  return value.replace(/\s+/g, ' ').replace(/\u00a0/g, ' ').trim();
}

export function stableSlug(value) {
  return value.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w'()-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function headingSections($, sectionIds) {
  const content = $('.mw-parser-output').first();
  return sectionIds
    .map((id) => content.find(`h2 .mw-headline#${id}`).closest('h2').get(0))
    .filter(Boolean);
}

export function makeRecord($, row, group, page) {
  const firstCell = $(row).find('td').first();
  const nameCell = $(row).find('td.il2c').first();
  const identityCell = nameCell.length ? nameCell : firstCell;
  const nameNode = identityCell.find('[title]')
    .filter((_, element) => cleanText($(element).text()) && !$(element).hasClass('eico'))
    .first();
  const image = firstCell.find('img').first();
  const imageName = image.attr('alt') || '';
  const fallbackName = imageName.replace(/\s+placed(?:\.png)?$/i, '').replace(/\.png$/i, '').trim();
  const name = cleanText(nameNode.attr('title') || nameNode.text()).replace(/\s+placed$/i, '') || fallbackName;
  if (!name || /^Internal Item ID/i.test(name) || name === 'Statue') return null;

  const itemText = cleanText(`${firstCell.text()} ${nameCell.text()}`);
  const itemId = itemText.match(/Item ID:\s*(\d+)/i)?.[1];
  const wikiLink = identityCell.find('a[href^="/wiki/"]')
    .filter((_, anchor) => !$(anchor).attr('href').startsWith('/wiki/Item_IDs'))
    .first()
    .attr('href');
  const wikiTitle = wikiLink
    ? decodeURIComponent(wikiLink.replace(/^\/wiki\//, '')).replaceAll('_', ' ')
    : name;
  const imageSource = image.attr('src');

  return {
    id: itemId ? `item:${itemId}` : `wiki:${stableSlug(wikiTitle)}`,
    name,
    group,
    image: imageSource ? new URL(imageSource, WIKI).href : null,
    wikiUrl: `${WIKI}/wiki/${encodeURIComponent(wikiTitle.replaceAll(' ', '_'))}`,
    source: page,
  };
}

export function directTableRows($, table) {
  return $(table).children('tbody').children('tr');
}