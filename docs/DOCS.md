# AudioTour Pro - Documentation Guide

Complete documentation for developers, content creators, and stakeholders.

## 📖 Documentation Files

### Core Documentation

**[README.md](README.md)** - Main project documentation
- Project overview and features
- Technology stack
- Installation and setup
- Project structure
- Data management

**[ADDING_TOURS.md](ADDING_TOURS.md)** - Guide for adding new tours
- Step-by-step tour creation
- JSON templates and examples
- Image sourcing guidelines
- Troubleshooting

**[public/data/README.md](public/data/README.md)** - Data structure reference
- JSON file formats
- Field descriptions
- Schema examples
- Best practices

---

## 📁 Project Structure

```
/
├── README.md              # Main documentation
├── DOCS.md               # This file
├── ADDING_TOURS.md       # Tour creation guide
├── public/data/
│   ├── README.md         # Data format reference
│   ├── languages.json    # Supported languages
│   └── tours/
│       ├── index.json    # Tour manifest
│       └── *.json        # Tour files
├── services/
│   └── dataService.ts    # Data loading + caching
├── hooks/
│   └── useDataLoader.ts  # React hooks for data
└── ...
```

---

## 🎯 Quick Start

### New to the Project?
1. Read [README.md](README.md) for overview
2. Follow installation instructions
3. Explore the codebase

### Want to Add a Tour?
1. Read [ADDING_TOURS.md](ADDING_TOURS.md)
2. Create tour JSON in `/public/data/tours/`
3. Update manifest in `/public/data/tours/index.json`
4. Test with `npm run dev`

### Need Data Format Details?
Check [public/data/README.md](public/data/README.md) for complete specifications

---

## 🚀 Quick Reference

### Add New Tour (3 steps)
```bash
# 1. Create tour JSON file
touch public/data/tours/my-tour.json

# 2. Add entry to manifest
# Edit public/data/tours/index.json

# 3. Test
npm run dev
```

### Load Tour Data
```typescript
import { useTourData, useLanguages } from './hooks/useDataLoader';

function MyComponent() {
  const { data: tour, loading, error } = useTourData('rome-01');
  const { data: languages } = useLanguages();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <TourDisplay tour={tour} />;
}
```

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 🔍 Finding Information

| Need | Documentation |
|------|---------------|
| Setup & overview | [README.md](README.md) |
| Add a tour | [ADDING_TOURS.md](ADDING_TOURS.md) |
| Data format | [public/data/README.md](public/data/README.md) |
| Type definitions | `types.ts` |
| Data service API | `services/dataService.ts` (inline comments) |
| React hooks | `hooks/useDataLoader.ts` (inline comments) |

---

## 📚 Documentation by Role

### Content Creators / Tour Managers
**Primary docs:**
1. [ADDING_TOURS.md](ADDING_TOURS.md) - How to create tours
2. [public/data/README.md](public/data/README.md) - Data format

**Quick start:**
- Use the template in ADDING_TOURS.md
- Look at `/public/data/tours/ancient-rome.json` as example
- Validate JSON at [jsonlint.com](https://jsonlint.com)

### Developers
**Primary docs:**
1. [README.md](README.md) - Project overview & architecture
2. Inline code comments in `services/` and `hooks/`
3. `types.ts` - TypeScript definitions

**Quick start:**
- Clone and `npm install`
- Review project structure in README
- Check types.ts for data models

### Project Managers / Stakeholders
**Primary docs:**
1. [README.md](README.md) - Project overview & features

---

## 💡 Common Tasks

### "I want to add a new tour"
→ Follow [ADDING_TOURS.md](ADDING_TOURS.md)

### "What's the data format?"
→ See [public/data/README.md](public/data/README.md)

### "How do I load tour data in code?"
→ See code examples in this file above, or check `hooks/useDataLoader.ts`

### "I'm getting JSON errors"
→ Validate at [jsonlint.com](https://jsonlint.com) and check [public/data/README.md](public/data/README.md)

---

## 🆘 Getting Help

1. **Check documentation** - Start with relevant doc above
2. **Review examples** - Look at existing tour: `/public/data/tours/ancient-rome.json`
3. **Check types** - See `types.ts` for TypeScript definitions
4. **Read comments** - Inline JSDoc in `services/` and `hooks/`

---

**Last Updated:** 2025-11-25 | **Version:** 1.0.0
