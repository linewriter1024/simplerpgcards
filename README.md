# RPG Cards Full-Stack Application

A modern web application for creating, managing, and generating RPG cards with a professional print-ready PDF output.

**Repository:** [https://github.com/linewriter1024/simplerpgcards](https://github.com/linewriter1024/simplerpgcards)

## Architecture

This is a full-stack TypeScript application with:
- **Backend**: Node.js + Express + TypeORM + SQLite
- **Frontend**: Angular 20 + Angular Material
- **PDF Generation**: PDFKit with custom card layouts
- **Database**: SQLite with TypeORM migrations

### Component Architecture

All Angular components follow best practices with **separated template and style files**:
- **Templates**: `.component.html` files for better HTML editing experience and IDE support
- **Styles**: `.component.scss` files for improved CSS syntax highlighting and organization
- **Logic**: `.component.ts` files focused on component logic without inline templates/styles

Each component follows the structure:
```
component-name/
├── component-name.component.ts     # Component logic and configuration
├── component-name.component.html   # Template markup
├── component-name.component.scss   # Component-specific styles
```

This separation provides:
- ✅ Better maintainability and code organization
- ✅ Enhanced IDE support with full syntax highlighting
- ✅ Easier debugging and development workflow
- ✅ Cleaner component files focused on business logic
- ✅ Better team collaboration with clear file separation

## Features

### Build Configuration
- ✅ **No Bundle Size Limits**: Removed Angular budget constraints to allow unlimited bundle and component style sizes
- ✅ **Optimized for Development**: Focus on functionality over arbitrary size restrictions

### Application Modes

#### Printable Cards Mode
- ✅ Create, read, update, delete cards
- ✅ Rich card details (title, front/back text, tags)
- ✅ Real-time search and filtering by content and tags
- ✅ Tag-based categorization system (e.g., "paladin", "spell-1", "cleric-3")
- ✅ Multiple tag selection and filtering
- ✅ Bulk selection for PDF generation
- ✅ Sortable card list by title or creation date
- ✅ Bulk-add mode for creating multiple similar cards with shared tags and content

#### Statblocks Mode (NEW)
- ✅ **Edit Mode**: Responsive left sidebar interface with comprehensive controls
  - **Responsive Design**: Fixed 300px sidebar on desktop, converts to compact horizontal toolbar on tablets/mobile
  - **Dark Theme**: Consistent dark theme matching the overall application design
  - **Sidebar Layout**: Contains search, actions, selection, and mode switching in organized sections
  - **Compact Toolbar**: On smaller screens (≤1024px), sidebar converts to space-efficient 2-row horizontal toolbar
    - **Row 1**: Title, mode buttons, search field, and clear button
    - **Row 2**: Actions (Add New, Select All, Delete) and statblock count
  - **Main Content**: Flexible editing area with intelligent textarea sizing
  - Create and edit statblocks in space-efficient horizontal layouts
  - Support for D&D 5e statblock format with ability scores (STR, DEX, CON, INT, WIS, CHA)
  - **Complete Type Field Support**: Type field now properly saves and persists across edit/view modes
  - **Stable List Rendering**: Statblock edit list now tracks rows by a stable uid to prevent duplicate key errors during add/remove operations
  - **Smart Textarea Autosize**: Textareas automatically resize using Angular CDK's cdkTextareaAutosize
    - Min 2 rows, max 30 rows per field
    - No manual DOM measurement or change detection hacks
    - Stable and change-detection safe (prevents NG0100 errors)
  - **Optimized Input Types**: Single-line inputs for tags and spell slots (basic info row), expanding textareas for resistances, attacks, spells, skills, notes
  - **Efficient Layout**: Resistances moved to basic info section as compact expanding textarea for better organization while maintaining dynamic sizing
  - Individual save buttons per row with visual indicators for unsaved changes
  - Save/check icons on each row (save icon for unsaved, checkmark for saved)
  - Manual row management with "Add New Statblock" button
  - Bulk delete operations for selected statblocks
  - Visual indicators for new rows (green) and unsaved changes (yellow)
  - **Mobile Optimization**: On phones (≤768px), toolbar elements stack vertically for maximum usability
    - Desktop: Horizontal layout with abilities inline and text fields in bottom row
    - Tablet: Compact 2-row toolbar with grouped controls
    - Mobile: Vertical stack layout with proper field organization and single-column toolbar elements
    - Eliminates vertical scrolling by maximizing horizontal space usage
    - No table headers or unnecessary vertical padding
  - **Notes Field Persistence (NEW)**: Notes are now stored end-to-end. The backend entity includes a nullable `notes` field so edits are fully persisted.
- ✅ **View Mode**: Responsive left sidebar interface matching edit mode design
  - **Default Mode**: View mode is now the default when accessing /statblocks
  - **Responsive Design**: Fixed sidebar on desktop, converts to compact horizontal toolbar on tablets/mobile
  - **Dark Theme**: Consistent dark theme across all interface elements
  - **Sidebar Layout**: Contains search, tag management, selection, and bulk actions in organized sections
  - **Compact Toolbar**: On smaller screens (≤1024px), sidebar converts to space-efficient 2-row horizontal toolbar
    - **Row 1**: Title, mode buttons, search field, and clear button
    - **Row 2**: Tag chips, selection controls, and statblock count
  - **Main Content**: Flexible view area optimized for readability and space efficiency
  - **Compact Name Field**: Name field only takes the space it needs (120–220px) instead of excessive space
  - **EXP Calculation**: Added Experience Points field next to CR using official D&D 5e formula
  - **Two-Row Layout**: Basic info (name, type, CR, EXP, AC, spell slots, abilities) in top row, text fields (attacks, spells, skills, etc.) in bottom row
  - **Spell Slots Repositioned**: Moved spell slots to basic info section for better organization instead of text fields area
  - **Two-Column Spells Layout**: Spells display in side-by-side columns to reduce vertical space consumption
    - Splits spell list in half based on count (first half in left column, second half in right column)
    - Responsive: Columns stack vertically on mobile devices for optimal readability
    - Maintains proper text wrapping and spacing for spell names
  - **Type Field Display**: Type field now properly displays next to name when present
  - **Flexible Sizing**: All fields use flex-grow properties instead of fixed widths for better space utilization
  - **High‑Density Layout (keeps all content visible)**: Inline label–value presentation for basic info and abilities, inline flowing list items for attacks/spells/skills, reduced paddings/margins, and compact typography (≈13px values, 12px list items, 10px labels). Sidebar narrowed to ~260px. This significantly increases rows per screen without hiding or truncating information.
  - **Generous Text Fields Where Needed**: Attacks and spells fields still receive higher flex priority so long entries remain fully visible on large screens
  - **No Horizontal Scrolling**: Responsive flex layout that wraps appropriately instead of forcing horizontal scroll
  - **Integrated Tag Search**: Click on any tag to add/remove it from the search field, with visual highlighting of active search terms
  - **Advanced Search**: Support for quoted exact matches and multiple search terms (space-separated)
  - **Always-Available Bulk Operations**: Add or remove tags from multiple selected statblocks with persistent bulk actions interface
  - **Bulk Tag Operations**: Add or remove tags from multiple selected statblocks simultaneously with automatic duplicate prevention
  - **Select All Control**: Convenient select all/deselect all checkbox with indeterminate state for partial selections
  - **Tag Validation**: Bulk operations prevent tags with spaces; individual tags must not contain spaces (use underscores or hyphens instead)
  - **Tag Deduplication**: All tag operations automatically prevent duplicate tags in the same statblock
  - **Selection Preservation**: Bulk operations maintain selection state after completing updates
  - **Always Sorted**: Statblocks automatically sorted alphabetically by name for consistent organization
  - Sortable by name, CR, AC with preserved selection state
  - Filterable by tags and search terms
  - Calculated D&D modifiers display (e.g., STR 16 → +3, DEX 14 → +2)
  - **Spell Slots**: Space-delimited input in edit mode, formatted as ordinals (1st, 2nd, 3rd, etc.) in view mode
  - **Notes Visibility**: Notes are shown when present and omitted when empty in View mode to keep the layout dense without hiding actual content.

### Simplifications (NEW)
- All statblock filtering is now performed client-side for speed and simplicity. The backend only supports an optional simple name search parameter.
- Removed unused backend and frontend fields: `spellSaveDC` and `spellAttackModifier`. These are expected to be included in the generic spells text when relevant.
- Added database migrations to add `notes` and remove deprecated columns.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Development Mode

#### Backend Setup
```bash
cd backend
npm install
npm run build
npm run dev
```

The backend will start on `http://localhost:3000`

#### Frontend Setup
```bash
cd frontend
npm install
ng serve
```

The frontend will start on `http://localhost:4200`

### Database
The SQLite database will be created automatically on first run. The schema is managed by TypeORM.

- For simple development workflows, the configuration uses `synchronize: true`, which will automatically add the `notes` column and ignore removed fields in the entity.
- For explicit schema control, run migrations:
  - Add Notes column: `AddNotesToStatblocks`
  - Remove deprecated columns: `RemoveSpellSaveAndAttackMod`

## Project Structure

### Backend (`/backend`)
```
src/
├── entities/          # TypeORM entities (Card, StatBlock)
├── services/          # Business logic (CardService, StatBlockService)
├── controllers/       # Route handlers (CardController, StatBlockController)
├── routes/           # Express routes (cards, statblocks)
├── config/           # Database and app config
├── types/            # TypeScript type definitions
├── migrations/       # TypeORM migrations (schema changes)
└── utils/            # Utility functions
```

### Frontend (`/frontend`)
```
src/app/
├── components/       # Angular components
│   ├── card-form/    # Card creation/editing dialog
│   ├── card-list/    # Card management interface  
│   └── statblocks/   # Statblock management
│       ├── statblock-edit/  # Spreadsheet-style editing
│       └── statblock-view/  # Read-only table view
├── services/         # Angular services (CardService, StatblockService)
├── models/          # TypeScript interfaces (Card, StatBlock models)
└── ...              # Standard Angular structure
```

## API Endpoints

### Cards
- `GET /api/cards` - Get all cards (with optional tag filters)
- `GET /api/cards/:id` - Get single card
- `POST /api/cards` - Create new card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `GET /api/cards/tags` - Get all tags

### Statblocks (NEW)
- `GET /api/statblocks` - Get all statblocks (optional `search` for simple name search)
- `GET /api/statblocks/:id` - Get single statblock
- `POST /api/statblocks` - Create new statblock
- `PUT /api/statblocks/:id` - Update statblock
- `DELETE /api/statblocks/:id` - Delete statblock
- `DELETE /api/statblocks/bulk` - Delete multiple statblocks

### PDF Generation
- `POST /api/cards/pdf` - Generate PDF from selected cards
- `POST /api/cards/pdf/preview` - Generate single-card preview PDF

## Development

### Adding New Features
1. Backend: Add/modify entities, services, controllers
2. Frontend: Create/update components and services
3. Database: Use TypeORM migrations for schema changes (or rely on synchronize during development)

### Testing
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
ng test
```

## Deployment

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend  
cd frontend
ng build --configuration production
```

### Environment Variables
The backend supports the following environment variables:
- `SRC_HOST` - Server host/IP (default: localhost)
- `SRC_PORT` - Server port (default: 3000)  
- `SRC_DATABASE_PATH` - SQLite database file path (default: ./rpg_cards.db)
- `NODE_ENV` - Environment mode (production/development)

### Frontend Environment Configuration
The frontend uses Angular environment files to configure API endpoints:
- **Development**: `src/environments/environment.ts` - Points to `http://localhost:3000/api`
- **Production**: `src/environments/environment.prod.ts` - Points to `http://localhost:3000/api` (ignored by git for security)

The production environment file is automatically used when building with `ng build --configuration production`. The production environment file is excluded from version control to allow for deployment-specific configurations.

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

See the [LICENSE.txt](LICENSE.txt) file for the full license text.

### Why AGPL?

The AGPL license ensures that if you run a modified version of this software on a server and let others interact with it, you must provide them with the source code of your modifications. This helps maintain the open-source nature of the project even for web services.
