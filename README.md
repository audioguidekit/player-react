# AudioGuideKit, open-source audio guide player

A mobile-first lightweight audio guide player built in React for the web. Runs online and offline as a PWA, self-hosted by default, with easy customization via themes.

[Live demo](https://audioguidekit.vercel.app/) · [Documentation](https://audioguidekit.org/docs) · [GitHub](https://github.com/audioguidekit/player-react)

![AudioGuideKit demo](https://github.com/audioguidekit/player-react/releases/download/v1.0.0/audioguidekit-video.gif)

## Features

- **Audio tours** - Create and configure audio tours
- **Progress tracking** - Application-wide progress tracking
- **Offline support** - Full PWA with Service Worker caching and Media Session API support
- **Multiple languages support** - Automatic language detection, seamless switching
- **Localised app UI** - UI out-of-the-box supports English, German, Italian, French, Spanish and Czech
- **Layout options** - Simple list of stops, image thumbnails or large images, fullscreen player
- **Theming** - Customizable themes with full control over styling
- **Deep Linking** - Shareable URLs to specific stops

## Quick start

```bash
# Clone the repository
git clone https://github.com/audioguidekit/player-react.git
cd player-react

# Install dependencies
bun install

# Start development server
bun run dev
```

Open http://localhost:3000

## Documentation

| Guide | Description |
|-------|-------------|
| [Adding tours](docs/adding-tours.md) | Create and configure tours |
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

## Tech stack

- **React 19** with TypeScript
- **Vite 6** for builds
- **Framer Motion** for animations
- **Styled Components** + Tailwind
- **Phosphor Icons**
- **Workbox** for PWA/Service Worker

## Project structure

```
player-react/
├── screens/           # TourStart, TourDetail, FullscreenPlayer
├── components/
│   ├── feed/          # Stop cards (Audio, Video, Text, 3D, etc.)
│   ├── sheets/        # Bottom sheets (Rating, Language, TourComplete)
│   └── player/        # Audio player components
├── hooks/             # useAudioPlayer, useProgressTracking, useDeepLink, etc.
├── context/           # React context providers
├── src/
│   ├── services/      # Data loading, IndexedDB, storage
│   ├── theme/         # Theme system
│   ├── translations/  # UI translations
│   └── data/tour/     # Tour JSON files
├── tests/             # Playwright e2e tests
├── types.ts           # Shared TypeScript types
└── docs/              # Documentation
```

## Tour data

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
- [llms.txt](https://audioguidekit.org/llms.txt) — for AI assistants
