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
- ✅ Rich card details (title, front/back text, category, level, range, duration, notes)
- ✅ Real-time search and filtering
- ✅ Category and level management
- ✅ Bulk selection for PDF generation

### PDF Generation
- ✅ Professional card layout (4 cards per page)
- ✅ Duplex printing support (long/short edge)
- ✅ Small caps formatting
- ✅ Configurable fonts and margins
- ✅ Cut lines for easy separation

### Import/Export
- ✅ Import cards from text files (original format compatible)
- ✅ Export selected cards to PDF
- ✅ Batch operations

### User Interface
- ✅ Modern Material Design interface
- ✅ Responsive layout
- ✅ Live card preview while editing
- ✅ Intuitive card selection
- ✅ Advanced filtering and search

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
The SQLite database will be created automatically on first run. No additional setup required.

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
- `GET /api/cards` - Get all cards (with optional filters)
- `GET /api/cards/:id` - Get single card
- `POST /api/cards` - Create new card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `GET /api/cards/categories` - Get all categories
- `GET /api/cards/levels` - Get all levels

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
