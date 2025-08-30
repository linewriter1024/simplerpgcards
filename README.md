# RPG Cards Full-Stack Application

A modern web application for creating, managing, and generating RPG cards with a professional print-ready PDF output.

**Repository:** [https://github.com/linewriter1024/simplerpgcards](https://github.com/linewriter1024/simplerpgcards)

## Architecture

This is a full-stack TypeScript application with:
- **Backend**: Node.js + Express + TypeORM + SQLite
- **Frontend**: Angular 17 + Angular Material
- **PDF Generation**: PDFKit with custom card layouts
- **Database**: SQLite with TypeORM migrations

## Features

### Card Management
- ✅ Create, read, update, delete cards
- ✅ Rich card details (title, front/back text, tags)
- ✅ Real-time search and filtering by content and tags
- ✅ Tag-based categorization system (e.g., "paladin", "druid", "spell-1", "cleric-3")
- ✅ Multiple tag selection and filtering
- ✅ Bulk selection for PDF generation
- ✅ Sortable card list by title or creation date

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
├── entities/          # TypeORM entities
├── services/          # Business logic
├── controllers/       # Route handlers
├── routes/           # Express routes
├── config/           # Database and app config
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

### Frontend (`/frontend`)
```
src/app/
├── components/       # Angular components
├── services/         # Angular services
├── models/          # TypeScript interfaces
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
