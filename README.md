# AudioTour Pro

A high-fidelity mobile-first progressive web application for guided audio tours. This interactive prototype showcases an immersive audio tour experience for Ancient Rome, featuring sophisticated animations, gesture-based navigation, and a modern mobile UI.

## 📚 Documentation

- **[Complete Documentation Index](docs/README.md)** - All project documentation
- **[PWA Architecture](docs/PWA_ARCHITECTURE.md)** - Progressive Web App implementation guide
- **[Adding Tours](docs/ADDING_TOURS.md)** - Guide for adding new tours
- **[Data Structure](public/data/README.md)** - Tour data format

## Overview

AudioTour Pro is a React-based mobile web application designed to simulate a premium audio tour guide experience. The app demonstrates professional UI/UX patterns with production-ready animations, bottom sheet navigation, and an intuitive audio player interface - perfect for museums, historical sites, or city tours.

## Features

### Core Functionality
- **Interactive Tour Experience** - Self-guided audio tours with multiple stops and detailed descriptions
- **Audio Player Simulation** - Full-featured mock audio player with playback controls and progress tracking
- **Multi-language Support** - Switch between Czech, English, and German
- **Progress Tracking** - Visual indicators showing tour completion status
- **Rating System** - Built-in feedback mechanism for tour ratings

### User Interface
- **Bottom Sheet Navigation** - Draggable sheet interface with smooth spring animations
  - Collapsed state: Tour summary card
  - Expanded state: Complete stop list with progress indicators
- **Mini Player** - Floating audio control bar with circular progress indicator
- **Full-Screen Player** - Immersive player view with large images and drag-to-dismiss gestures
- **Parallax Effects** - Dynamic background scrolling for enhanced visual depth
- **Mobile-First Design** - Desktop view displays a centered mobile frame (400px) simulating a phone

### Technical Highlights
- **Advanced Animations** - Powered by Framer Motion with spring physics and gesture recognition
- **Responsive Design** - Optimized for mobile with desktop preview mode
- **Type-Safe** - Full TypeScript implementation with comprehensive type definitions
- **Modern React** - Built with React 19 hooks and functional components
- **Dynamic Data Loading** - Tour data loaded from external JSON files with caching support

### Progressive Web App (PWA)
- **Offline Support** - Full offline functionality with Service Worker caching
- **Installable** - Add to home screen on mobile and desktop
- **URL Routing** - Deep linking and shareable tour URLs
- **Persistent Storage** - IndexedDB for progress tracking and downloads
- **Automatic Caching** - Intelligent caching strategies for optimal performance
- **Fast Loading** - Self-hosted assets and optimized bundle (~380KB)

> 📖 **See [PWA Architecture Guide](docs/PWA_ARCHITECTURE.md)** for complete implementation details

## Technologies

### Core Stack
- **React 19.2.0** - Latest React with modern hooks
- **TypeScript 5.8.2** - Full type safety
- **Vite 6.2.0** - Fast development server and optimized builds
- **Tailwind CSS 3.4** - Self-hosted utility-first styling
- **React Router 6.28** - URL-based routing and navigation

### Libraries
- **Framer Motion 12.23.24** - Animation and gesture library
- **Lucide React 0.554.0** - Icon system
- **Google Fonts** - Inter font family

### Integrations
- **Google Gemini AI API** - Configured for potential AI features

## Project Structure

```
superguided-audio/
├── screens/                    # Main screen components
│   ├── TourStart.tsx          # Landing screen with parallax background
│   ├── TourDetail.tsx         # Tour details with progress tracking
│   └── StopDetail.tsx         # Full-screen stop player
├── components/                 # Reusable UI components
│   ├── sheets/                # Modal bottom sheets
│   │   ├── RatingSheet.tsx   # User rating interface
│   │   └── LanguageSheet.tsx # Language selector
│   ├── MainSheet.tsx          # Primary draggable sheet
│   ├── BottomSheet.tsx        # Base sheet component
│   ├── MiniPlayer.tsx         # Floating mini player
│   ├── StartCard.tsx          # Tour start/resume card
│   └── TourListItem.tsx       # Tour stop list items
├── services/                   # Data services
│   └── dataService.ts         # Dynamic data loading with caching
├── hooks/                      # Custom React hooks
│   └── useDataLoader.ts       # Hooks for loading tours and languages
├── public/                     # Static assets
│   └── data/                  # Tour data (JSON files)
│       ├── README.md          # Data structure documentation
│       ├── languages.json     # Supported languages
│       └── tours/             # Tour definitions
│           ├── index.json     # Tour manifest
│           └── *.json         # Individual tour files
├── App.tsx                    # Main application & state management
├── index.tsx                  # React entry point
├── types.ts                   # TypeScript type definitions
├── constants.ts               # Legacy constants (deprecated)
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd superguided-audio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create or update `.env.local` with your Gemini API key:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**

   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Usage Guide

### Navigation Flow

1. **Start Screen** - Welcome screen with parallax background image
2. **Detail View** - Tap the "Start Tour" button to view all tour stops
3. **Audio Playback** - Select any stop to begin "playback"
4. **Mini Player** - A floating player bar appears during playback
5. **Full Player** - Tap the mini player to expand to full-screen view
6. **Sheet Interactions** - Drag the bottom sheet up/down to expand/collapse

### Key Interactions

- **Drag Sheet** - Swipe up/down on the bottom sheet to expand or collapse
- **Play/Pause** - Control audio playback from mini player or full player
- **Navigate Stops** - Use arrow buttons to skip between tour stops
- **Change Language** - Tap the language icon to switch tour language
- **Rate Tour** - Tap the star icon to provide feedback
- **Dismiss Player** - Drag down on full-screen player to return to mini player

## Architecture

### State Management

The app uses React hooks for state management in `App.tsx`:

- **Navigation State** - `activeScreen` controls which screen is visible
- **Playback State** - `isPlaying`, `activeStop`, `progress` track audio status
- **Sheet State** - `sheetExpanded`, `activeSheet` manage bottom sheet UI
- **Language State** - `activeLanguage` controls content language

### Component Hierarchy

```
App.tsx
├── TourStart
├── TourDetail
│   ├── MainSheet (draggable)
│   │   └── StartCard
│   │       └── TourListItem (multiple)
│   ├── MiniPlayer
│   ├── RatingSheet
│   └── LanguageSheet
└── StopDetail (full-screen)
```

### Data Model

Tour data is defined in `constants.ts`:
- **TourData** - Contains title, description, duration, and stops
- **Stop** - Individual tour location with images, audio metadata, and descriptions
- **Language** - Supported languages with ISO codes and labels

### Key Files

- **App.tsx** - Main component with routing and state logic
- **MainSheet.tsx** - Implements drag gestures and animation springs
- **StopDetail.tsx** - Full-screen stop player with swipe-to-dismiss
- **types.ts** - Type definitions for Stop, TourData, Language, SheetType
- **dataService.ts** - Dynamic tour data loading with caching

## Configuration

### Vite Configuration (`vite.config.ts`)

- Dev server runs on port 3000
- Gemini API key injected as environment variable
- Path alias `@/` points to project root
- React plugin enabled for fast refresh

### TypeScript Configuration (`tsconfig.json`)

- Target: ES2022
- Module: ES2022
- JSX: react-jsx (new JSX transform)
- Strict mode enabled
- Path mapping for `@/*` imports

## Data Management

The app loads tour data dynamically from JSON files in the `/public/data/` directory.

### Current Tours

**Ancient Rome Tour** (`rome-01`):
1. The Colosseum
2. Roman Forum
3. Palatine Hill
4. Arch of Constantine
5. Trajan's Market
6. Pantheon

### Adding New Tours

Quick steps to add a tour:

1. **Create a tour JSON file** in `/public/data/tours/`
2. **Update the manifest** in `/public/data/tours/index.json`
3. **Test the new tour** by updating `DEFAULT_TOUR_ID` in `App.tsx`

For complete step-by-step guide with examples, see **[ADDING_TOURS.md](ADDING_TOURS.md)**

### Data Structure

```typescript
// Tour data
interface TourData {
  id: string;
  title: string;
  description: string;
  totalDuration: string;
  totalStops: number;
  image: string;
  stops: Stop[];
}

// Individual stop
interface Stop {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isPlaying?: boolean;
  image: string;
}
```

### Loading Data

The app uses custom React hooks for data loading:

```typescript
// Load a specific tour
const { data: tour, loading, error } = useTourData('rome-01');

// Load all languages
const { data: languages } = useLanguages();
```

Data is automatically cached for performance. See [`services/dataService.ts`](/services/dataService.ts) for the caching implementation.

## Future Enhancements

Potential features to implement:
- Real audio file playback (currently simulated)
- GPS-based auto-play when approaching stops
- Offline mode with cached content
- Multiple tour options
- User authentication
- Booking and payment integration
- Social sharing features
- AI-powered tour customization via Gemini API

## Development

### Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Code Style

- **TypeScript** - Full type coverage, no `any` types
- **Functional Components** - All components use hooks
- **Framer Motion** - For animations and gestures
- **Tailwind Classes** - Utility-first styling approach

### Working with Tour Data

The application uses dynamic data loading from JSON files:

1. **Tour files** - `/public/data/tours/*.json`
2. **Languages** - `/public/data/languages.json`
3. **Tour manifest** - `/public/data/tours/index.json`

To add or modify tours, edit the JSON files directly. The app will load changes automatically on refresh.

**Documentation:**
- Data structure: [public/data/README.md](public/data/README.md)
- Adding tours: [ADDING_TOURS.md](ADDING_TOURS.md)

## AI Studio Integration

This project was created using Google's AI Studio platform. You can view the original app configuration at:
https://ai.studio/apps/drive/1rWX8uVZA-_IAOffOB2t5BC42KIaAB8qr

## Browser Support

- Modern browsers with ES2022 support
- Mobile Safari (iOS 13+)
- Chrome Mobile (Android 5+)
- Desktop Chrome, Firefox, Safari, Edge (latest versions)

## License

This project is private and not currently licensed for public use.

## Acknowledgments

- Images from [Unsplash](https://unsplash.com)
- Icons from [Lucide](https://lucide.dev)
- Font from [Google Fonts](https://fonts.google.com)
- Built with [AI Studio](https://ai.studio)

---

**Note**: This is a prototype application designed for demonstration purposes. Audio files are simulated, and some features are mocked for UI/UX showcase.
