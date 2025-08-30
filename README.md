# RPG Cards Full-Stack Application

A modern web application for creating, managing, and generating RPG cards with a professional print-ready PDF output.

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

### PDF Generation
- ✅ Professional index card layout (3×5 inch cards, 6 cards per page)
- ✅ Duplex printing support (long/short edge)
- ✅ Monospace fonts (Courier) for better readability
- ✅ Centered front text, left-aligned back text
- ✅ Index card appropriate font sizes (26pt title, 18pt body)
- ✅ 72 DPI optimized for proper print scaling
- ✅ Configurable fonts and margins
- ✅ Cut lines for easy separation

### User Interface
- ✅ Dark theme throughout the application
- ✅ Modern Material Design interface with dark styling
- ✅ Monospace fonts for card text (JetBrains Mono/Roboto Mono)
- ✅ Responsive layout optimized for dark theme
- ✅ Live card preview while editing with accurate 3×5 aspect ratio scaling
- ✅ Intuitive tag-based filtering system
- ✅ Real-time search with debouncing
- ✅ Advanced sorting and filtering options
- ✅ Index card-sized preview with proper font scaling

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm run build
npm run dev
```

The backend will start on `http://localhost:3000`

### Frontend Setup
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

### Import/Export
- `POST /api/cards/import` - Import cards from text file

## Card Format

The application supports the original text format:
```
Card Title
Front text content
+
Back text content
=
Next Card Title
...
```

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

## License

MIT License
