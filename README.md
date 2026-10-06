# Terraria Field Notes

A browser-based checklist for Terraria critters, paintings, and statues. Checked items are saved automatically in this browser and kept separate for each Terraria version.

## Run locally

```sh
npm install
npm run data:refresh
npm run dev
```

Use `npm run build` to create a production build. The generated wiki snapshot is stored under `public/data/` and served locally; the app does not fetch checklist data at runtime.

Item sprites load directly from the Terraria Wiki URLs stored in the versioned data snapshot. Image loading depends on the Wiki allowing external embedding; no image proxy or bundled image copies are used.

## GitHub Pages

The GitHub Actions workflow builds and deploys on published GitHub Releases; `workflow_dispatch` is also available for a manual deployment. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The workflow builds the currently curated Terraria 1.4.5.8 data snapshot.

GitHub Pages hosts the static app and data. Wiki sprites load from their direct external URLs; the workflow does not download or rehost images because reuse terms vary by image.

## Data snapshot

The runner calls one importer per category. Each plugin records item IDs, names, group headings, wiki links, and image references; the runner records the source-page revisions and refuses to write a snapshot when a category total differs from its checked expectation.

The current snapshot is tagged Terraria desktop 1.4.5.8 and contains 96 critter table entries, 193 paintings, and 117 statues. The Critters page's prose summary says 94, but its combined tables contain 96 distinct entries after duplicate rows are removed. The checklist includes all table entries, including Dolphin, Mystic Frog, and Sea Turtle, which have no item IDs and cannot be caught. A future game-version bundle needs its own version-specific data review; do not relabel this current snapshot as an older version. Browser progress keys include the bundle's game version.

The Terraria Wiki identifies its article content as CC BY-NC-SA 4.0. Retain attribution and share-alike terms when redistributing wiki-derived text/data. Image files remain hosted by the Wiki; their licensing may differ by file and should be reviewed independently.

## Sources

- [Critters](https://terraria.wiki.gg/wiki/Critters)
- [Paintings](https://terraria.wiki.gg/wiki/Paintings)
- [Statues](https://terraria.wiki.gg/wiki/Statues)