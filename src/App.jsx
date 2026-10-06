import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, CircleHelp, ExternalLink, Leaf, Search, Sparkles, Trash2 } from 'lucide-react';

const WIKI = 'https://terraria.wiki.gg/wiki/';
const DATA_URL = `${import.meta.env.BASE_URL}data/terraria-1.4.5.8.json`;
const STORAGE_PREFIX = 'terraria-field-notes';
const CATEGORY_ORDER = ['critters', 'paintings', 'statues'];
const CATEGORY_LABELS = { critters: 'Critters', paintings: 'Paintings', statues: 'Statues' };
const CATEGORY_DESCRIPTIONS = {
  critters: 'Small wonders, rare finds, and golden variants.',
  paintings: 'Every canvas, from cabins to traveling merchants.',
  statues: 'Decorative finds, mechanisms, and text statues.',
};

function readProgress(version) {
  return Object.fromEntries(CATEGORY_ORDER.map((category) => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}:${version}:${category}`);
      const ids = saved ? JSON.parse(saved) : [];
      return [category, new Set(Array.isArray(ids) ? ids : [])];
    } catch {
      return [category, new Set()];
    }
  }));
}

function ItemImage({ item }) {
  const [failed, setFailed] = useState(false);
  const source = item.image;
  if (!source || failed) {
    return <span className="item-image item-image-fallback" aria-hidden="true" />;
  }
  return (
    <span className="item-image">
      <img src={source} alt="" loading="lazy" onError={() => setFailed(true)} />
    </span>
  );
}

function App() {
  const [dataset, setDataset] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [category, setCategory] = useState('critters');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [progress, setProgress] = useState({});

  useEffect(() => {
    let cancelled = false;
    fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error('Checklist data is not available yet.');
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setDataset(data);
        setProgress(readProgress(data.gameVersion));
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!dataset || !Object.keys(progress).length) return;
    CATEGORY_ORDER.forEach((key) => {
      localStorage.setItem(`${STORAGE_PREFIX}:${dataset.gameVersion}:${key}`, JSON.stringify([...progress[key]]));
    });
  }, [dataset, progress]);

  const items = dataset?.items?.[category] ?? [];
  const checked = progress[category] ?? new Set();
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesQuery = !normalized || `${item.name} ${item.group}`.toLocaleLowerCase().includes(normalized);
      const isChecked = checked.has(item.id);
      return matchesQuery && (filter === 'all' || (filter === 'checked' ? isChecked : !isChecked));
    });
  }, [items, query, filter, checked]);

  const totals = CATEGORY_ORDER.reduce((result, key) => {
    const categoryItems = dataset?.items?.[key] ?? [];
    const saved = progress[key] ?? new Set();
    result.total += categoryItems.length;
    result.checked += categoryItems.filter((item) => saved.has(item.id)).length;
    result.byCategory[key] = { total: categoryItems.length, checked: categoryItems.filter((item) => saved.has(item.id)).length };
    return result;
  }, { total: 0, checked: 0, byCategory: {} });

  const groupedItems = useMemo(() => {
    const groups = new Map();
    filteredItems.forEach((item) => {
      const group = item.group || CATEGORY_LABELS[category];
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(item);
    });
    return [...groups.entries()];
  }, [filteredItems, category]);

  function toggleItem(id) {
    setProgress((current) => {
      const next = new Set(current[category] ?? []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...current, [category]: next };
    });
  }

  function clearCategory() {
    const label = CATEGORY_LABELS[category].toLowerCase();
    if (!checked.size || !window.confirm(`Clear all checked ${label}?`)) return;
    setProgress((current) => ({ ...current, [category]: new Set() }));
  }

  if (loadError) {
    return <main className="load-state"><Sparkles size={24} /><h1>Field notes are being prepared</h1><p>{loadError}</p><p>Run <code>npm run data:refresh</code> to create the bundled checklist data.</p></main>;
  }
  if (!dataset) return <main className="load-state"><span className="loading-mark" /><p>Opening the field guide…</p></main>;

  const percent = totals.total ? Math.round((totals.checked / totals.total) * 100) : 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Terraria Field Notes home">
          <span className="brand-mark"><Leaf size={19} strokeWidth={2.4} /></span>
          <span>FIELD NOTES<span className="brand-sub">TERRARIA COLLECTION LOG</span></span>
        </a>
        <div className="topbar-meta">
          <span className="version-tag"><span className="live-dot" />DESKTOP {dataset.gameVersion}</span>
          <a className="wiki-top-link" href={`${WIKI}Terraria`} target="_blank" rel="noreferrer">Wiki <ExternalLink size={13} /></a>
        </div>
      </header>

      <main id="top" className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-heading"><span>YOUR JOURNAL</span><span className="journal-icon"><Sparkles size={15} /></span></div>
          <nav className="category-nav" aria-label="Collectible categories">
            {CATEGORY_ORDER.map((key) => {
              const stats = totals.byCategory[key] ?? { total: 0, checked: 0 };
              return (
                <button key={key} className={`category-button ${category === key ? 'active' : ''}`} onClick={() => { setCategory(key); setQuery(''); setFilter('all'); }}>
                  <span className={`category-glyph ${key}`} aria-hidden="true">{key === 'critters' ? '✳' : key === 'paintings' ? '▧' : '⌘'}</span>
                  <span className="category-name">{CATEGORY_LABELS[key]}<small>{stats.checked} / {stats.total}</small></span>
                  {category === key && <ChevronDown className="nav-chevron" size={15} />}
                </button>
              );
            })}
          </nav>

          <div className="journal-progress">
            <div className="progress-caption"><span>WORLD COLLECTION</span><strong>{percent}%</strong></div>
            <div className="progress-track" role="progressbar" aria-label="Overall collection progress" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /></div>
            <p>{totals.checked.toLocaleString()} of {totals.total.toLocaleString()} logged</p>
          </div>

          <a className="source-note" href={`${WIKI}${dataset.sources?.paintings ?? 'Paintings'}`} target="_blank" rel="noreferrer">
            <CircleHelp size={16} /><span>DATA SOURCE<small>Terraria Wiki · revision {dataset.wikiRevision}</small></span><ExternalLink size={12} />
          </a>
        </aside>

        <section className="content-panel" aria-labelledby="category-title">
          <div className="content-heading">
            <div className="heading-copy">
              <div className="eyebrow"><span className="eyebrow-line" />COLLECTOR'S INDEX</div>
              <h1 id="category-title">{CATEGORY_LABELS[category]}<span className="title-period">.</span></h1>
              <p>{CATEGORY_DESCRIPTIONS[category]}</p>
            </div>
            <div className="category-total"><strong>{(totals.byCategory[category]?.checked ?? 0).toString().padStart(2, '0')}<span> / {(totals.byCategory[category]?.total ?? 0).toString().padStart(2, '0')}</span></strong><small>COLLECTED</small></div>
          </div>

          <div className="toolbar">
            <label className="search-field">
              <Search size={17} aria-hidden="true" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Find ${CATEGORY_LABELS[category].toLowerCase()}…`} aria-label={`Search ${CATEGORY_LABELS[category]}`} />
              {query && <button className="clear-search" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
            </label>
            <div className="filter-control" role="group" aria-label="Filter items">
              {[['all', 'All'], ['remaining', 'Missing'], ['checked', 'Found']].map(([value, label]) => <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{label}</button>)}
            </div>
            <button className="icon-button clear-button" onClick={clearCategory} disabled={!checked.size} title={`Clear ${CATEGORY_LABELS[category]} progress`} aria-label={`Clear ${CATEGORY_LABELS[category]} progress`}><Trash2 size={16} /></button>
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-state"><span className="empty-mark">?</span><h2>No entries found</h2><p>Try another search or filter.</p></div>
          ) : (
            <div className="item-groups">
              {groupedItems.map(([group, groupItems]) => (
                <section className="item-group" key={group}>
                  <div className="group-heading"><h2>{group}</h2><span>{groupItems.length.toString().padStart(2, '0')} ENTRIES</span></div>
                  <div className="item-list">
                    {groupItems.map((item) => {
                      const isChecked = checked.has(item.id);
                      const href = item.wikiUrl || `${WIKI}${encodeURIComponent(item.name.replaceAll(' ', '_'))}`;
                      return (
                        <label className={`item-row ${isChecked ? 'is-checked' : ''}`} key={item.id}>
                          <input type="checkbox" checked={isChecked} onChange={() => toggleItem(item.id)} aria-label={`${isChecked ? 'Unmark' : 'Mark'} ${item.name} as collected`} />
                          <span className="check-indicator"><Check size={14} /></span>
                          <ItemImage item={item} />
                          <span className="item-copy"><span className="item-name">{item.name}</span><span className="item-subtitle">{item.subtitle || group}</span></span>
                          <a className="item-link" href={href} target="_blank" rel="noreferrer" aria-label={`Open ${item.name} on the Terraria Wiki`} onClick={(event) => event.stopPropagation()}><ExternalLink size={14} /></a>
                        </label>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
          <footer className="content-footer"><span>PROGRESS SAVES AUTOMATICALLY IN THIS BROWSER</span><span>WIKI DATA · {dataset.wikiSnapshotDate}</span></footer>
        </section>
      </main>
      <footer className="site-attribution">Terraria is a game by Re-Logic. Checklist data sourced from the <a href={`${WIKI}Critters`} target="_blank" rel="noreferrer">Terraria Wiki</a> under CC BY-NC-SA 4.0. Artwork remains property of its respective rights holders.</footer>
    </div>
  );
}

export default App;