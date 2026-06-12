# Trackly

A media tracking plugin for [Obsidian](https://obsidian.md) — log and track games, books, anime, manga, TV shows, movies, and web novels, all from within your vault.

## Features

- **7 Media Types** — Games, Books, Web Novels, Manga, Anime, TV Shows, Movies
- **4 Statuses** — Not Started, Started, Completed, Dropped
- **Progress Tracking** — Increment/decrement episodes or chapters for applicable media types
- **5-Star Ratings** — Rate any entry with a simple star system
- **Dashboard** — Overview cards with progress bars, currently active items with inline controls, and a "What's Next?" suggestion picker
- **Manage View** — Search across all entries, filter by media type, inline editing, add and delete entries
- **Vault-Native Storage** — All data stored as markdown notes inside a `Trackly/` folder in your vault

## Installation

### Automatic (via Obsidian Community Plugins)

*Coming soon — plugin pending community listing.*

### Manual

1. Clone or download this repository into your vault's `.obsidian/plugins/` folder:
   ```
   .obsidian/plugins/trackly/
   ├── main.js
   ├── manifest.json
   └── styles.css
   ```
2. In Obsidian, go to **Settings → Community Plugins** and enable **Trackly**.
3. Reload Obsidian.

## Development

### Prerequisites

- Node.js >= 18
- npm

### Setup

```bash
npm install
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start watch mode (compiles `src/main.ts` → `main.js`) |
| `npm run build` | Type-check and production build (minified) |
| `npm run lint` | Run ESLint against source files |

### Project Structure

```
src/
├── main.ts                 # Plugin entry point, ribbon icon, command palette
├── types.ts                # TypeScript interfaces and constants
├── storage/
│   └── manager.ts          # Markdown file read/write, CRUD operations
└── ui/
    ├── tab.ts              # Left sidebar tab container
    ├── dashboard.ts        # Dashboard view (overview, active items, suggestions)
    ├── manage.ts           # Manage view (search, filter, inline edit)
    └── modals.ts           # Add entry modal
styles.css                  # Crimson/black theme styles
```

## Storage Format

On first load, the plugin creates a `Trackly/` folder in your vault with one markdown file per media type. Each entry is stored as a heading with metadata:

```markdown
## ReZero
- id: abc-123
- status: Completed
- progress: 25
- total: 25
- rating: 5
```

All data lives in your vault — no external services required.
