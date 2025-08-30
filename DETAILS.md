# RPG Cards - Technical Details

This document contains detailed technical information about the RPG Cards full-stack application architecture, implementation decisions, and development guidelines.

## Recent Updates - Index Card Optimization

### PDF Generation Enhancements (August 30, 2025)
- **Card Dimensions**: Updated to standard 3×5 inch index cards (216×360 pixels at 72 DPI)
- **Layout**: Changed from 2×2 to 3×2 grid layout (6 cards per page)
- **Font Sizing**: Optimized to 26pt titles and 18pt body text for index card readability
- **DPI Setting**: 72 DPI for accurate print scaling
- **Margins**: Reduced page margins for better card density

### Frontend Preview Updates
- **Aspect Ratio**: Preview cards now use accurate 3×5 proportions (144×240px)
- **Font Scaling**: Preview fonts scaled appropriately (16pt title, 12pt body)
- **Layout**: Centered preview cards with proper visual hierarchy
- **Typography**: Maintained monospace fonts with better line spacing for index cards

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
- **Card Management**: Full CRUD operations with tag-based organization
- **PDF Generation**: Professional print-ready output with monospace fonts and centered fronts
- **Tag System**: Flexible tagging with multi-tag filtering (e.g., "paladin druid spell-1")
- **Search & Filter**: Real-time search with advanced tag-based filtering
- **Dark UI**: Complete dark theme with monospace fonts for better readability
- **Sortable Interface**: Sort by creation date or title with real-time updates

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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  frontText: string;

  @Column({ type: 'text', nullable: true })
  backText: string;

  @Column({ type: 'text', nullable: true })
  tags: string; // JSON string array of tags

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
- **Tag Storage**: Tags stored as JSON string arrays for flexibility

## API Documentation

### Base URL
`http://localhost:3000/api`

### Card Endpoints

#### GET /cards
**Description**: Retrieve all cards with optional tag filtering
**Query Parameters**:
- `tags` (string, optional): Comma-separated list of tags to filter by
- `search` (string, optional): Search in title and text content

**Response**: Array of Card objects with parsed tags

#### GET /cards/tags
**Description**: Get all unique tags across all cards
**Response**: Array of tag strings sorted alphabetically

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
The PDF generation uses PDFKit with custom layout logic optimized for index cards:

#### Layout Specifications
- **Page Size**: A4 Landscape (11" × 8.5" at 72 DPI)
- **Cards per Page**: 6 (3×2 grid layout)
- **Card Size**: 3" × 5" (standard index card dimensions)
- **Physical Size**: 216 × 360 pixels at 72 DPI
- **Margins**: 0.5" page margins, configurable card margins
- **Font**: Courier (monospace) family for consistent spacing
- **Cut Lines**: Precise grid lines for accurate card cutting

#### Typography Specifications
- **Title Font**: Courier-Bold, 26pt (optimal for index card headers)
- **Body Font**: Courier, 18pt (readable handwriting equivalent)
- **Line Spacing**: 1.2x for index card line compatibility
- **Character Width**: ~0.6 ratio for accurate text wrapping

#### Duplex Printing Support
- **Front Side**: Card fronts with centered titles and content
- **Back Side**: Card backs with left-aligned titles and content  
- **Binding**: Long edge binding for proper card alignment
- **Back Mapping**: Precise position mapping for 6-card duplex layout
- **Font Consistency**: Same typography on both sides for professional appearance

#### Text Formatting
- **Front Cards**: Centered text for better visual appeal
- **Back Cards**: Left-aligned text for readability
- **Monospace**: Consistent character spacing
- **Larger Fonts**: Improved readability for physical cards

### PDF Service Features
- Batch processing of multiple cards
- Memory-efficient streaming
- Error handling for malformed cards
- Configurable layout parameters

## Frontend Architecture

### Component Architecture

#### CardListComponent
- **Responsibility**: Display and manage card collection with advanced filtering
- **Features**: Real-time search, multi-tag filtering, sortable columns, bulk operations
- **State Management**: Reactive forms with debounced search and tag-based filtering

#### CardFormComponent
- **Responsibility**: Create and edit cards with tag input
- **Features**: Tag chip input, real-time preview with monospace fonts, form validation
- **Tag Handling**: Space/comma-separated tag input with duplicate prevention

### Service Layer

#### CardService
- **Responsibility**: HTTP communication with backend
- **Methods**: CRUD operations, tag management, file import, PDF generation
- **Error Handling**: RxJS error operators with user-friendly messages
- **Tag Support**: Multi-tag filtering and tag suggestion functionality

### Material Design Integration
- **Components**: MatTable, MatCard, MatDialog, MatSnackBar, MatChips
- **Dark Theming**: Complete dark theme implementation with custom overrides
- **Typography**: Monospace fonts (JetBrains Mono/Roboto Mono) for code-like appearance
- **Responsive**: Mobile-first design with dark theme breakpoint handling

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
