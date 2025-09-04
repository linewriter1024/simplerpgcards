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

### Application Modes

#### Printable Cards Mode
- ✅ Create, read, update, delete cards
- ✅ Rich card details (title, front/back text, tags)
- ✅ Real-time search and filtering by content and tags
- ✅ Tag-based categorization system (e.g., "paladin", "druid", "spell-1", "cleric-3")
- ✅ Multiple tag selection and filtering
- ✅ Bulk selection for PDF generation
- ✅ Sortable card list by title or creation date
- ✅ Bulk-add mode for creating multiple similar cards with shared tags and content

#### Statblocks Mode (NEW)
- ✅ **Edit Mode**: Collapsible left sidebar interface with comprehensive controls
  - **Collapsible Sidebar**: 60px collapsed, expands to 300px on hover with visual indicator
  - **Dark Theme**: Consistent dark theme matching the overall application design
  - **Sidebar Layout**: Contains search, actions, selection, and mode switching in organized sections
  - **Main Content**: Flexible editing area with intelligent textarea sizing
  - Create and edit statblocks in space-efficient horizontal layouts
  - Support for D&D 5e statblock format with ability scores (STR, DEX, CON, INT, WIS, CHA)
  - **Complete Type Field Support**: Type field now properly saves and persists across edit/view modes
  - Multi-line text-based attacks, spells, skills, resistances, tags, and notes inputs
  - **Smart Textarea Wrapping**: Automatic textarea height calculation based on real field dimensions (140px effective width, 7px character width = ~20 characters per line) with extra padding for editing
  - Individual save buttons per row with visual indicators for unsaved changes
  - Save/check icons on each row (save icon for unsaved, checkmark for saved)
  - Manual row management with "Add New Statblock" button in sidebar
  - Bulk delete operations for selected statblocks with sidebar controls
  - Visual indicators for new rows (green) and unsaved changes (yellow)
  - **Responsive Design**: Custom flex layout optimized for space efficiency
    - Desktop: Horizontal layout with abilities inline and text fields in bottom row
    - Mobile: Vertical stack layout with proper field organization and full-width sidebar
    - Eliminates vertical scrolling by maximizing horizontal space usage
    - No table headers or unnecessary vertical padding
- ✅ **View Mode**: Collapsible left sidebar interface matching edit mode design
  - **Default Mode**: View mode is now the default when accessing /statblocks
  - **Collapsible Sidebar**: 60px collapsed, expands to 300px on hover with visual indicator
  - **Dark Theme**: Consistent dark theme across all interface elements
  - **Sidebar Layout**: Contains search, tag management, selection, and bulk actions in organized sections
  - **Main Content**: Flexible view area optimized for readability and space efficiency
  - **Compact Name Field**: Name field only takes the space it needs (120-200px) instead of excessive space
  - **EXP Calculation**: Added Experience Points field next to CR using official D&D 5e formula
  - **Two-Row Layout**: Basic info (name, type, CR, EXP, AC, abilities) in top row, text fields (attacks, spells, skills, etc.) in bottom row
  - **Type Field Display**: Type field now properly displays next to name when present
  - **Flexible Sizing**: All fields use flex-grow properties instead of fixed widths for better space utilization
  - **Improved Readability**: Larger text sizes (14px field values, 13px list items, 11px labels) for better visibility
  - **Generous Text Fields**: Attacks and spells fields given higher flex priority for more space
  - **No Horizontal Scrolling**: Responsive flex layout that wraps appropriately instead of forcing horizontal scroll
  - **Integrated Tag Search**: Click on any tag to add/remove it from the search field, with visual highlighting of active search terms
  - **Advanced Search**: Support for quoted exact matches and multiple search terms (space-separated)
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
- ✅ **Integrated Mode Switching**: Mode switcher buttons integrated into component sidebars for seamless navigation
- ✅ **Consistent UI**: Both edit and view modes use identical collapsible sidebar layouts for unified user experience
- ✅ **Space Optimization**: Collapsible sidebars maximize content area while keeping controls accessible
- ✅ Complete CRUD operations for statblocks
- ✅ Tag-based categorization system for statblocks
- ✅ Challenge Rating (CR) and Armor Class (AC) tracking
- ✅ **Experience Points**: Automatic EXP calculation from CR using official D&D 5e values

### Navigation
- ✅ Top navigation bar with mode switching buttons
- ✅ "Printable Cards" button for traditional card management
- ✅ "Statblocks" button for D&D creature/NPC management
- ✅ GitHub repository link in navigation

## Card Specifications

- **Size**: Standard 5×3 inch index cards (landscape orientation)
- **Layout**: 4 cards per page in 2×2 grid layout
- **Font**: Courier (monospace) with consistent regular text styling
- **Font Sizes**: 
  - Title: ~12pt (same as body, bold for distinction)
  - Body: ~12pt (calculated as card height ÷ 18)
- **Typography**: Monospace fonts (Courier) with regular text for consistent appearance
- **Preview**: Full-width card form dialog with live PDF preview showing front and back cards in a dynamically-sized, compact layout (2.5×1.5 inches)
- **PDF Output**: Print-ready with inline browser viewing and proper multi-line text layout with inline title/body layout on card backs

### User Interface
- ✅ Dark theme throughout the application
- ✅ Modern Material Design interface with dark styling
- ✅ Monospace fonts for card text (JetBrains Mono/Roboto Mono)
- ✅ Responsive layout optimized for dark theme
- ✅ Live card preview with 5×3 landscape aspect ratio (200×120px)
- ✅ Full-width card form dialog with real-time PDF preview showing front and back cards
- ✅ Proper multi-line text layout on card backs with inline title and body text
- ✅ Clickable table rows for easy card selection
- ✅ Intuitive tag-based filtering system with search highlighting
- ✅ Real-time search with debouncing and quote support for exact matches
- ✅ Sortable table headers for title and creation date
- ✅ Index card preview with dynamic font scaling (24px title, 16px body)
- ✅ Compact tag input with proper styling and improved vertical spacing
- ✅ Bulk-add mode with checkbox for creating multiple similar cards efficiently
- ✅ "Update, then add" feature for continuing with similar cards after editing
- ✅ In-dialog bulk-add workflow that resets form without closing dialog
- ✅ Real-time card list refresh during bulk-add sessions
- ✅ Improved form navigation with optimized tab order, X close button, Ctrl+Enter shortcut, and auto-focus on title field
- ✅ Card list displays front and back text separated by backslash with ellipsis overflow handling
- ✅ Fixed table column width constraints (title column limited to 40% width) to prevent row overflow
- ✅ Improved PDF card border thickness (reduced from 2px to 1px) and fixed text wrapping on card backs
- ✅ Enhanced "Select All" checkbox to operate only on filtered results while preserving existing selections
- ✅ Added "Delete All Selected" button in the filter section for bulk deletion of selected cards with confirmation dialog

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
The SQLite database will be created automatically on first run with an empty database. You can add your own cards through the web interface.

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
- `GET /api/statblocks` - Get all statblocks (with optional filters)
- `GET /api/statblocks/:id` - Get single statblock
- `POST /api/statblocks` - Create new statblock
- `PUT /api/statblocks/:id` - Update statblock
- `DELETE /api/statblocks/:id` - Delete statblock
- `DELETE /api/statblocks/bulk` - Delete multiple statblocks

### PDF Generation
- `POST /api/cards/pdf` - Generate PDF from selected cards
- `POST /api/cards/pdf/preview` - Generate single-card preview PDF

## Card Format

Cards are created and managed through the web interface with the following structure:
- **Title**: Card name/header
- **Front Text**: Main card content 
- **Back Text**: Additional details or mechanics
- **Tags**: Categorization labels (e.g., "paladin", "spell-1", "cleric-3")

## Development

### Adding New Features
1. Backend: Add/modify entities, services, controllers
2. Frontend: Create/update components and services
3. Database: Use TypeORM migrations for schema changes

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
