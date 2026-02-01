# Audio Tour Player

A mobile-first progressive web application for guided audio tours. By [Superguided](https://github.com/superguided). This interactive prototype showcases an immersive audio tour experience for Barcelona, featuring sophisticated animations, gesture-based navigation, and a modern mobile UI.

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [Adding Tours](docs/adding-tours.md) | Step-by-step guide for creating new tours |
| [Multi-Language System](docs/languages.md) | Language configuration and translations |
| [Theming](docs/themes.md) | Custom themes and styling |
| [Testing](docs/testing.md) | Playwright testing guide |

## Overview

Audio Tour Player is a React-based mobile web application designed to simulate a premium audio tour guide experience. The app demonstrates professional UI/UX patterns with production-ready animations, bottom sheet navigation, and an intuitive audio player interface - perfect for museums, historical sites, or city tours.

## Features

### Core Functionality
- **Interactive Tour Experience** - Self-guided audio tours with multiple stops and detailed descriptions
- **Real Audio Playback** - Full-featured audio player with playback controls, seeking, and progress tracking
- **Multi-language Support** - Switch between Czech, English, and German
- **Progress Tracking** - Visual indicators showing tour completion status (85% threshold)
- **Rating System** - Built-in feedback mechanism for tour ratings
- **Multiple Stop Types** - Audio, text, image-text, video, 3D objects, headlines, quotes, ratings, and email collection

### User Interface
- **Bottom Sheet Navigation** - Draggable sheet interface with smooth spring animations
  - Collapsed state: Tour summary card with video/image background
  - Expanded state: Complete stop list with progress indicators
- **Mini Player** - Floating audio control bar with circular progress indicator
- **Feed-Style Layout** - Vertical scrolling through different card types
- **Parallax Effects** - Dynamic background scrolling for enhanced visual depth
- **Mobile-First Design** - Desktop view displays a centered mobile frame (400px) simulating a phone

### Technical Highlights
- **Advanced Animations** - Powered by Framer Motion with spring physics and gesture recognition
- **Responsive Design** - Optimized for mobile with desktop preview mode
- **Type-Safe** - Full TypeScript implementation with comprehensive type definitions
- **Modern React** - Built with React 19 hooks and functional components
- **Dynamic Data Loading** - Tour data loaded from external JSON files with caching support
- **Media Session API** - Background audio playback with lock screen controls

### Progressive Web App (PWA)
- **Offline Support** - Full offline functionality with Service Worker caching
- **Installable** - Add to home screen on mobile and desktop
- **URL Routing** - Deep linking and shareable tour URLs
- **Persistent Storage** - IndexedDB for progress tracking and downloads
- **Automatic Caching** - Intelligent caching strategies for optimal performance

> 📖 **See [PWA Architecture Guide](docs/PWA_ARCHITECTURE.md)** for complete implementation details

## Technologies

### Core Stack
- **React 19.2.0** - Latest React with modern hooks
- **TypeScript 5.8.2** - Full type safety
- **Vite 6.2.0** - Fast development server and optimized builds
- **Tailwind CSS 3.4** - Self-hosted utility-first styling
- **React Router 6.30** - URL-based routing and navigation

### Libraries
- **Framer Motion 12.23.24** - Animation and gesture library
- **Lucide React 0.554.0** - Icon system
- **Styled Components 6.1** - CSS-in-JS styling
- **@google/model-viewer 4.1** - 3D model rendering
- **idb 8.0** - IndexedDB wrapper for storage

### Integrations
- **Supabase Storage** - Cloud storage for audio/video/image assets
- **Google Gemini AI API** - Configured for potential AI features

## Project Structure

```
superguided-audio/
├── screens/                    # Main screen components
│   ├── TourStart.tsx          # Landing screen with video/image background
│   └── TourDetail.tsx         # Tour details with feed-style stop list
├── components/                 # Reusable UI components
│   ├── feed/                  # Feed card components
│   │   ├── AudioStopCard.tsx  # Audio stop with playback
│   │   ├── VideoCard.tsx      # Video content card
│   │   ├── TextCard.tsx       # Text-only card
│   │   ├── ImageTextCard.tsx  # Image with text overlay
│   │   ├── ThreeDObjectCard.tsx # 3D model viewer
│   │   ├── HeadlineCard.tsx   # Large headline text
│   │   ├── QuoteCard.tsx      # Quote with attribution
│   │   ├── RatingCard.tsx     # Star rating input
│   │   ├── EmailCard.tsx      # Email collection
│   │   └── FeedItemRenderer.tsx # Dynamic card renderer
│   ├── sheets/                # Modal bottom sheets
│   │   ├── RatingSheet.tsx    # User rating interface
│   │   ├── LanguageSheet.tsx  # Language selector
│   │   └── TourCompleteSheet.tsx # Tour completion modal
│   ├── player/                # Audio player components
│   │   ├── PlayPauseButton.tsx
│   │   ├── SkipButton.tsx
│   │   └── ProgressRing.tsx
│   ├── shared/                # Shared utilities
│   │   ├── MobileFrame.tsx    # Desktop mobile simulator
│   │   └── AnimatedCounter.tsx
│   ├── MainSheet.tsx          # Primary draggable sheet
│   ├── BottomSheet.tsx        # Base sheet component
│   ├── MiniPlayer.tsx         # Floating mini player
│   ├── StartCard.tsx          # Tour start/resume card
│   └── TourHeader.tsx         # Tour header with progress
├── hooks/                      # Custom React hooks
│   ├── useDataLoader.ts       # Tour and language data loading
│   ├── useAudioPlayer.ts      # Audio playback management
│   ├── useBackgroundAudio.ts  # iOS background audio keep-alive
│   ├── useProgressTracking.ts # Tour progress persistence
│   ├── useDownloadManager.ts  # Offline download management
│   ├── useTourNavigation.ts   # Tour navigation state
│   └── useAudioPreloader.ts   # Audio preloading
├── context/                    # React context providers
│   └── RatingContext.tsx      # Rating state management
├── src/
│   ├── config/
│   │   └── tours.ts           # Tour configuration (DEFAULT_TOUR_ID)
│   ├── services/
│   │   ├── dataService.ts     # Dynamic data loading with caching
│   │   ├── db.ts              # IndexedDB schema
│   │   └── storageService.ts  # Storage API layer
│   ├── utils/
│   │   └── swManager.ts       # Service Worker manager
│   ├── routes/
│   │   └── index.tsx          # Route definitions
│   └── index.css              # Tailwind directives
├── public/                     # Static assets
│   └── data/                  # Tour data (JSON files)
│       ├── languages.json     # Supported languages
│       └── tours/             # Tour definitions
│           ├── index.json     # Tour manifest
│           └── tour.json      # Barcelona tour
├── App.tsx                    # Main application & state management
├── index.tsx                  # React entry point with router
├── types.ts                   # TypeScript type definitions
├── vite.config.ts             # Vite + PWA configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
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

   Create or update `.env.local` with your API keys:
   ```bash
   VITE_CLOUD_BASE_URL=https://your-supabase-url/storage/v1/object/public/
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**

   Navigate to `http://localhost:3001`

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

1. **Start Screen** - Welcome screen with video/image background
2. **Detail View** - Tap the "Start Tour" button to view all tour stops
3. **Audio Playback** - Select any stop to begin playback
4. **Mini Player** - A floating player bar appears during playback
5. **Feed Navigation** - Scroll through different card types
6. **Sheet Interactions** - Drag the bottom sheet up/down to expand/collapse

### Key Interactions

- **Drag Sheet** - Swipe up/down on the bottom sheet to expand or collapse
- **Play/Pause** - Control audio playback from mini player or stop cards
- **Navigate Stops** - Use skip buttons or click cards to navigate
- **Change Language** - Tap the language icon to switch tour language
- **Rate Tour** - Tap the star icon to provide feedback
- **Background Playback** - Audio continues when device screen locks

## Architecture

### State Management

The app uses React hooks for state management in `App.tsx`:

- **Navigation State** - `useTourNavigation` hook manages current stop, playback state
- **Playback State** - `useAudioPlayer` hook handles audio playback
- **Progress State** - `useProgressTracking` hook persists completion data
- **Sheet State** - `activeSheet` manages bottom sheet UI
- **Language State** - `selectedLanguage` controls content language

### Component Hierarchy

```
App.tsx
├── MobileFrame
│   ├── TourStart (video/image background)
│   ├── MainSheet (draggable)
│   │   ├── StartCard (collapsed)
│   │   └── TourDetail (expanded)
│   │       └── FeedItemRenderer
│   │           ├── AudioStopCard
│   │           ├── VideoCard
│   │           ├── TextCard
│   │           └── ... (other card types)
│   ├── MiniPlayer
│   ├── RatingSheet
│   ├── LanguageSheet
│   └── TourCompleteSheet
```

### Data Model

Tour data is defined in `types.ts`:

```typescript
// Stop types
type StopType = 'audio' | 'text' | 'image-text' | '3d-object' | 'video' | 'headline' | 'rating' | 'email' | 'quote';

// Audio stop (most common)
interface AudioStop {
  id: string;
  type: 'audio';
  title: string;
  duration: string;
  isCompleted: boolean;
  image: string;
  audioFile?: string;  // URL to audio file
}

// Tour data
interface TourData {
  id: string;
  title: string;
  description: string;
  totalDuration: string;
  totalStops: number;
  image: string;                // Cover image/video URL
  offlineAvailable?: boolean;   // Enable offline download requirement
  transitionAudio?: string;     // Audio between stops
  stops: Stop[];
}

// Language
interface Language {
  code: string;
  name: string;
  flag: string;
  countryCode: string;  // ISO 3166-1 alpha-2 code for SVG flags
}
```

### Key Files

- **App.tsx** - Main component with routing and state logic
- **MainSheet.tsx** - Implements drag gestures and animation springs
- **FeedItemRenderer.tsx** - Dynamic card type renderer
- **useAudioPlayer.ts** - Audio playback with Media Session API
- **types.ts** - Type definitions for all stop types

## Configuration

### Vite Configuration (`vite.config.ts`)

- Dev server runs on port 3001
- Gemini API key injected as environment variable
- Path alias `@/` points to project root
- React plugin enabled for fast refresh
- PWA plugin with caching strategies

### TypeScript Configuration (`tsconfig.json`)

- Target: ES2022
- Module: ES2022
- JSX: react-jsx (new JSX transform)
- Strict mode enabled
- Path mapping for `@/*` imports

## Data Management

The app loads tour data dynamically from JSON files in the `/public/data/` directory.

### Current Tours

**Unlimited Barcelona** (`barcelona`):
1. Welcome and Instructions
2. The Urquinaona Tower
3. A City with a Thousand-Year History
4. Ciutat Vella
5. Plaza Urquinaona
6. Industrialisation
7. Expo 1888 and the 1992 Olympic Games
8. The Sagrada Família and Gaudí
9. Eixample
10. Roof Terraces, Tibidabo and Goodbye

### Adding New Tours

Quick steps to add a tour:

1. **Create metadata.json** in `/public/data/tour/` with shared properties
2. **Create language files** (e.g., `en.json`, `cs.json`) with translated content

Tours are auto-discovered - no manifest needed.

For complete step-by-step guide with examples, see **[docs/adding-tours.md](docs/adding-tours.md)**

### Loading Data

The app uses custom React hooks for data loading:

```typescript
// Load a specific tour
const { data: tour, loading, error } = useTourData('barcelona');

// Load all languages
const { data: languages } = useLanguages();
```

Data is automatically cached for performance. See [`src/services/dataService.ts`](src/services/dataService.ts) for the caching implementation.

## Development

### Available Scripts

- `npm run dev` - Start development server (port 3001)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Code Style

- **TypeScript** - Full type coverage, no `any` types
- **Functional Components** - All components use hooks
- **Framer Motion** - For animations and gestures
- **Tailwind Classes** - Utility-first styling approach

### Working with Tour Data

The application uses dynamic data loading from JSON files:

1. **Tour metadata** - `/public/data/tour/metadata.json` (shared properties)
2. **Tour language files** - `/public/data/tour/*.json` (e.g., `en.json`, `cs.json`)
3. **Languages** - Auto-discovered from tour files

To add or modify tours, edit the JSON files directly. The app will load changes automatically on refresh.

**Documentation:**
- Data structure: [ADDING_TOURS.md](docs/ADDING_TOURS.md)
- PWA details: [PWA_ARCHITECTURE.md](docs/PWA_ARCHITECTURE.md)

## Browser Support

- Modern browsers with ES2022 support
- Mobile Safari (iOS 13+)
- Chrome Mobile (Android 5+)
- Desktop Chrome, Firefox, Safari, Edge (latest versions)

## License

This project is private and not currently licensed for public use.

## Acknowledgments

- Icons from [Lucide](https://lucide.dev)
- Built with [AI Studio](https://ai.studio)

---

**Note**: This is a prototype application designed for demonstration purposes.