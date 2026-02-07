# AudioGuideKit

A mobile-first Progressive Web App for building guided audio tours. Built with React 19, TypeScript, and Framer Motion.

[GitHub](https://github.com/audioguidekit) · [Documentation](#documentation)

## Features

- **Audio Tours** - Multi-stop audio playback with progress tracking
- **Offline Support** - Full PWA with Service Worker caching
- **Multi-language** - Automatic language detection, seamless switching
- **Theming** - Customizable themes with full control over styling
- **Gestures** - Bottom sheet navigation with spring physics
- **Media Session** - Lock screen controls and background playback
- **Deep Linking** - Shareable URLs to specific stops

## Quick Start

```bash
# Clone the repository
git clone https://github.com/audioguidekit/player.git
cd player

# Install dependencies
bun install

# Start development server
bun run dev
```

Open http://localhost:3000

## Documentation

| Guide | Description |
|-------|-------------|
| [Adding Tours](docs/adding-tours.md) | Create and configure tours |
| [Multi-Language](docs/languages.md) | Language system and translations |
| [Theming](docs/themes.md) | Custom themes and styling |
| [Testing](docs/testing.md) | Playwright testing guide |

## Commands

```bash
bun run dev      # Development server (port 3000)
bun run build    # Production build
bun run preview  # Preview production build
bun run test     # Run Playwright tests
```

## Tech Stack

- **React 19** with TypeScript
- **Vite 6** for builds
- **Framer Motion** for animations
- **Styled Components** + Tailwind
- **Phosphor Icons**
- **Workbox** for PWA/Service Worker

## Project Structure

```
player/
├── screens/           # TourStart, TourDetail
├── components/
│   ├── feed/          # Stop cards (Audio, Video, Text, etc.)
│   ├── sheets/        # Bottom sheets (Rating, Language)
│   └── player/        # Audio player components
├── hooks/             # useAudioPlayer, useProgressTracking, etc.
├── src/
│   ├── services/      # Data loading, IndexedDB, storage
│   ├── theme/         # Theme system
│   └── translations/  # UI translations
├── src/data/tour/  # Tour JSON files
└── docs/              # Documentation
```

## Tour Data

Tours are JSON files in `/src/data/tour/`:

```
src/data/tour/
├── metadata.json    # Shared config (theme, offline mode)
├── en.json          # English content
├── de.json          # German content
└── fr.json          # Add as many as needed
```

See [Adding Tours](docs/adding-tours.md) for the complete guide.

## License

MIT

## Links

- [GitHub Organization](https://github.com/audioguidekit)
- [Info LLMs liek ChatGPT or Claude](https://audioguidekit.org/llms.txt)
