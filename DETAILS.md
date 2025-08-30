# RPG Cards - Technical Details

This document contains detailed technical information about the RPG Cards full-stack application architecture, implementation decisions, and development guidelines.

## Table of Contents
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Architecture Details](#architecture-details)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [PDF Generation](#pdf-generation)
- [Frontend Architecture](#frontend-architecture)
- [Development Guidelines](#development-guidelines)
- [Deployment Notes](#deployment-notes)
- [Known Issues & Limitations](#known-issues--limitations)

## Project Overview

The RPG Cards application is a full-stack TypeScript solution for creating, managing, and printing RPG cards. It features a modern Angular frontend with Material Design, a Node.js/Express backend with TypeORM, and sophisticated PDF generation capabilities.

### Key Features
- **Card Management**: Full CRUD operations with rich metadata
- **PDF Generation**: Professional print-ready output with duplex support
- **Import/Export**: Text file import with batch operations
- **Search & Filter**: Advanced filtering by category, level, and content
- **Responsive UI**: Material Design with mobile support

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18.2
- **Database**: SQLite 3 with TypeORM 0.3.17
- **Language**: TypeScript 5.3.3
- **PDF Generation**: PDFKit 0.15.0
- **Security**: Helmet.js, CORS, Express Validator
- **File Upload**: Multer 1.4.5
- **Development**: ts-node-dev for hot reload

### Frontend
- **Framework**: Angular 17
- **UI Library**: Angular Material 17
- **Language**: TypeScript 5.2.0
- **Build Tool**: Angular CLI
- **HTTP Client**: Angular HttpClient with RxJS 7.8.0
- **Testing**: Jasmine, Karma

## Architecture Details

### Backend Architecture

#### Folder Structure
```
backend/src/
├── app.ts              # Express app entry point
├── config/
│   └── database.ts     # TypeORM configuration
├── controllers/        # Route handlers
│   └── CardController.ts
├── entities/           # TypeORM entities
│   └── Card.ts
├── routes/            # Express routes
│   └── cards.ts
├── services/          # Business logic
│   ├── CardService.ts
│   └── PdfService.ts
├── types/             # Type definitions
│   └── card.types.ts
└── utils/             # Utilities
    └── DataSeeder.ts
```

#### Design Patterns
- **Repository Pattern**: TypeORM repositories for data access
- **Service Layer**: Business logic separated from controllers
- **Dependency Injection**: Services injected into controllers
- **DTO Pattern**: Type-safe data transfer objects

### Frontend Architecture

#### Folder Structure
```
frontend/src/app/
├── app.component.ts    # Root component
├── components/         # Feature components
│   ├── card-form/      # Card creation/editing
│   └── card-list/      # Card display and management
├── models/            # TypeScript interfaces
│   └── card.model.ts
└── services/          # Angular services
    └── card.service.ts
```

#### Design Patterns
- **Component-Service Architecture**: Clear separation of concerns
- **Reactive Programming**: RxJS observables for async operations
- **Material Design**: Consistent UI patterns
- **Form Validation**: Angular reactive forms

## Database Schema

### Card Entity
```typescript
@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  frontText: string;

  @Column('text')
  backText: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ type: 'integer', nullable: true })
  level: number;

  @Column({ length: 100, nullable: true })
  range: string;

  @Column({ length: 100, nullable: true })
  duration: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Database Configuration
- **Type**: SQLite
- **Location**: `backend/rpg_cards.db`
- **ORM**: TypeORM with decorators
- **Migrations**: TypeORM migrations for schema changes
- **Connection Pool**: Single connection (SQLite limitation)

## API Documentation

### Base URL
`http://localhost:3000/api`

### Card Endpoints

#### GET /cards
**Description**: Retrieve all cards with optional filtering
**Query Parameters**:
- `category` (string, optional): Filter by category
- `level` (number, optional): Filter by level
- `search` (string, optional): Search in title and text content

**Response**: Array of Card objects

#### GET /cards/:id
**Description**: Retrieve a specific card
**Parameters**: `id` (number) - Card ID
**Response**: Single Card object or 404

#### POST /cards
**Description**: Create a new card
**Body**: Card data (excluding id, timestamps)
**Validation**: All fields validated with express-validator
**Response**: Created Card object

#### PUT /cards/:id
**Description**: Update an existing card
**Parameters**: `id` (number) - Card ID
**Body**: Updated card data
**Response**: Updated Card object

#### DELETE /cards/:id
**Description**: Delete a card
**Parameters**: `id` (number) - Card ID
**Response**: Success message

#### GET /cards/categories
**Description**: Get all unique categories
**Response**: Array of category strings

#### GET /cards/levels
**Description**: Get all unique levels
**Response**: Array of level numbers

### PDF Generation Endpoints

#### POST /cards/pdf
**Description**: Generate PDF from selected cards
**Body**: Array of card IDs
**Response**: PDF file (application/pdf)
**Headers**: Content-Disposition: attachment

### Import Endpoints

#### POST /cards/import
**Description**: Import cards from text file
**Body**: Multipart form with file
**File Format**: Custom text format (title\nfront\n+\nback\n=)
**Response**: Import result with count

## PDF Generation

### PDFKit Implementation
The PDF generation uses PDFKit with custom layout logic:

#### Layout Specifications
- **Page Size**: A4 (595 x 842 points)
- **Cards per Page**: 4 (2x2 grid)
- **Card Size**: 268 x 380 points
- **Margins**: 20 points
- **Font**: Helvetica family
- **Cut Lines**: Dashed lines for card separation

#### Duplex Printing Support
- **Front Side**: Card fronts with titles and front text
- **Back Side**: Card backs with back text (reversed order)
- **Binding**: Long edge binding for proper alignment

#### Text Formatting
- **Title**: Bold, larger font
- **Body**: Regular font with word wrapping
- **Small Caps**: Custom implementation for consistent formatting

### PDF Service Features
- Batch processing of multiple cards
- Memory-efficient streaming
- Error handling for malformed cards
- Configurable layout parameters

## Frontend Architecture

### Component Architecture

#### CardListComponent
- **Responsibility**: Display and manage card collection
- **Features**: Search, filter, selection, bulk operations
- **State Management**: Local component state with reactive forms

#### CardFormComponent
- **Responsibility**: Create and edit cards
- **Features**: Form validation, real-time preview
- **Form Handling**: Angular reactive forms with validators

### Service Layer

#### CardService
- **Responsibility**: HTTP communication with backend
- **Methods**: CRUD operations, file import, PDF generation
- **Error Handling**: RxJS error operators with user-friendly messages
- **Caching**: Simple response caching for categories and levels

### Material Design Integration
- **Components**: MatTable, MatCard, MatDialog, MatSnackBar
- **Theming**: Custom theme with consistent color palette
- **Responsive**: Mobile-first design with breakpoint handling

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Consistent code formatting
- **Naming**: camelCase for variables, PascalCase for classes
- **Imports**: Organized with barrel exports

### Error Handling
- **Backend**: Centralized error middleware with proper HTTP codes
- **Frontend**: Global error handling with user notifications
- **Validation**: Input validation on both client and server

### Testing Strategy
- **Unit Tests**: Jest for backend, Jasmine for frontend
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Angular testing utilities

### Version Control
- **Branching**: Feature branches with descriptive names
- **Commits**: Conventional commit format
- **Reviews**: Pull request reviews required

## Deployment Notes

### Environment Variables
```bash
# Backend
PORT=3000
NODE_ENV=production
DB_PATH=./rpg_cards.db

# Frontend
NG_APP_API_URL=http://localhost:3000/api
```

### Build Process
1. Install dependencies: `npm run install:all`
2. Build backend: `npm run build:backend`
3. Build frontend: `npm run build:frontend`
4. Start services: `npm run start:backend` and serve frontend dist

### Production Considerations
- **Database**: Consider PostgreSQL for production
- **Reverse Proxy**: Nginx for static file serving
- **SSL**: HTTPS termination at load balancer
- **Monitoring**: Application performance monitoring
- **Backup**: Regular database backups

## Known Issues & Limitations

### Current Limitations
1. **Single User**: No authentication or multi-user support
2. **SQLite**: Single connection limits concurrent access
3. **File Upload**: Limited file size for imports
4. **PDF Memory**: Large batches may consume significant memory
5. **Mobile**: Limited mobile optimization

### Planned Improvements
1. **Authentication**: User accounts and permissions
2. **Database**: Migration to PostgreSQL
3. **Caching**: Redis for improved performance
4. **Testing**: Comprehensive test coverage
5. **Documentation**: API documentation with Swagger

### Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Basic support (PDF download may vary)
- **Edge**: Full support
- **Mobile**: Limited responsive features

### Performance Notes
- **Database**: Indexes on title and category for search performance
- **PDF**: Streaming generation to reduce memory usage
- **Frontend**: OnPush change detection for better performance
- **Bundle**: Tree shaking enabled for smaller builds

---

*Last updated: August 30, 2025*
*Version: 1.0.0*
