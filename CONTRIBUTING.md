# Contributing to AudioGuideKit

Thanks for your interest in contributing! AudioGuideKit is an open-source project built for developers, museums, and cultural institutions — and contributions from the community are what make it better for everyone.

## Ways to contribute

- **Bug reports** — found something broken? Open an issue
- **Feature requests** — have an idea? We'd love to hear it
- **Code contributions** — fix a bug, build a feature, improve performance
- **Documentation** — improve guides, fix typos, add examples
- **New themes** — create and share your own themes for the player
- **Spread the word** — star the repo, write about it, share with institutions that could benefit

## Getting started

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm

### Local setup

```bash
# Fork and clone the repo
git clone https://github.com/audioguidekit/player-react.git
cd player-react

# Install dependencies
bun install

# Start the development server
bun run dev
```

Visit `http://localhost:3000` to see the app running locally.

## Development workflow

1. **Fork** the repository on GitHub
2. **Create a branch** for your change: `git checkout -b feat/your-feature-name`
3. **Make your changes** and test them locally
4. **Run tests** to make sure nothing is broken (see [Testing](#testing))
5. **Commit** using clear, descriptive messages (see below)
6. **Push** your branch and open a **Pull Request**

### Commit message format

We follow a simple convention:

```
feat: add multilingual audio track support
fix: GPS trigger not firing on iOS 17
docs: update quickstart guide
refactor: simplify AudioPlayer component
```

Prefixes: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Pull request guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- If your PR fixes an issue, reference it: `Closes #42`
- Add or update tests if relevant
- Ensure the project builds without errors: `bun run build`

## Testing

This project uses [Playwright](https://playwright.dev/) for end-to-end testing. See the full [Testing Guide](docs/testing.md) for details.

```bash
bun run test          # Run all tests (headless)
bun run test:headed   # Run with browser visible
bun run test:ui       # Interactive Playwright UI
bun run test:debug    # Debug with Playwright Inspector
```

Tests auto-discover available tours and languages — they don't hardcode tour names, so they work with any content.

## Reporting bugs

When opening a bug report, please include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (browser, OS, device if mobile)
- Any relevant console errors or screenshots

## Suggesting features

Open an issue with the `enhancement` label. Describe:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you considered

We're especially interested in features that help real-world cultural institutions, museum technologists, and tour operators.

## Project structure

```
player-react/
├── components/
│   ├── feed/          # Stop cards (Audio, Video, Text, etc.)
│   ├── sheets/        # Bottom sheets (Rating, Language)
│   └── player/        # Audio player components
├── screens/           # Page-level components
├── hooks/             # Custom hooks
├── context/           # React context providers
├── src/
│   ├── services/      # Data loading, IndexedDB, storage
│   ├── theme/         # Theme system
│   ├── translations/  # UI translations
│   └── data/tour/     # Tour JSON files (metadata.json, en.json, etc.)
├── tests/             # Playwright tests
├── docs/              # Documentation
└── types.ts           # Shared TypeScript types
```

## Code style

- TypeScript is required — avoid `any` where possible
- Components use functional style with hooks
- Keep components small and focused
- CSS-in-JS via Twin.macro / Tailwind + Styled Components

## Questions?

Open a [GitHub Discussion](https://github.com/audioguidekit/player-react/discussions) or check the documentation at [audioguidekit.org](https://audioguidekit.org).

We're a small team and review PRs as quickly as we can. Thank you for helping make audio guides more accessible to the world.
