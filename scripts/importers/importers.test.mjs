import assert from 'node:assert/strict';
import test from 'node:test';
import { load } from 'cheerio';
import { extract as extractCritters } from './critters.mjs';
import { extract as extractPaintings } from './paintings.mjs';
import { extract as extractStatues } from './statues.mjs';

test('critters include both source sections and deduplicate shared entries', () => {
  const $ = load(`<div class="mw-parser-output">
    <h2><span class="mw-headline" id="Types">Types</span></h2>
    <h3><span class="mw-headline">Bunnies</span></h3>
    <table><tbody><tr><td class="il1c"><img alt="Bunny" src="/images/Bunny.png"></td><td class="il2c"><span title="Bunny">Bunny</span><span class="id">Internal Item ID: 2019</span></td></tr></tbody></table>
    <h2><span class="mw-headline" id="Boss_summon_critters">Boss summon critters</span></h2>
    <table><tbody><tr><td class="il1c"><img alt="Bunny" src="/images/Bunny.png"></td><td class="il2c"><span title="Bunny">Bunny</span><span class="id">Internal Item ID: 2019</span></td></tr></tbody></table>
  </div>`);
  const items = extractCritters($);
  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'item:2019');
  assert.equal(items[0].group, 'Bunnies');
});

test('paintings read direct item rows without nested drop-table rows', () => {
  const $ = load(`<div class="mw-parser-output">
    <h2><span class="mw-headline" id="List_of_paintings">List</span></h2>
    <h3><span class="mw-headline">From Painter</span></h3>
    <table class="Paintings-table"><tbody>
      <tr><th>Painting</th><th>Name</th></tr>
      <tr><td class="il1c"><img alt="First Encounter" src="/images/First.png"></td><td class="il2c"><span title="First Encounter">First Encounter</span><span class="id">Internal Item ID: 1481</span><table><tbody><tr><td>Not a painting</td></tr></tbody></table></td></tr>
    </tbody></table>
  </div>`);
  const items = extractPaintings($);
  assert.equal(items.length, 1);
  assert.equal(items[0].name, 'First Encounter');
});

test('statues combine functional item rows with decorative and text statues', () => {
  const $ = load(`<div class="mw-parser-output">
    <h2><span class="mw-headline" id="Functional_statues">Functional statues</span></h2>
    <div><table class="terraria"><tbody><tr><th>Statue</th><th>Effect</th></tr><tr><td><span title="Slime Statue placed">Slime Statue</span><span>Internal Item ID: 440</span></td><td>Spawns a slime</td></tr></tbody></table></div>
    <h2><span class="mw-headline" id="Decorative_statues">Decorative statues</span></h2>
    <div><img alt="Anvil Statue placed" src="/images/Anvil.png"></div>
    <h2><span class="mw-headline" id="Text_statues">Text statues</span></h2>
    <div><img alt="'A' Statue placed" src="/images/A.png"></div>
  </div>`);
  const items = extractStatues($);
  assert.deepEqual(items.map((item) => item.name), ['Slime Statue', 'Anvil Statue', "'A' Statue"]);
});