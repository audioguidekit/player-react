/**
 * Self-hosted fonts (@fontsource, pinned to exact versions in package.json).
 * Nothing is requested from a third party: the files are bundled and served
 * from the app's own origin. Subsets: latin, latin-ext (Czech, Polish, Turkish
 * and more), cyrillic, cyrillic-ext, greek and vietnamese, wherever the package
 * ships them (Space Grotesk has only latin, latin-ext and vietnamese). Each
 * subset is its own @font-face with a unicode-range, so the browser only
 * downloads the files for the characters a page actually uses.
 *
 * A theme picks a font by name in `typography.fontFamily` — one of:
 *   Inter, IBM Plex Sans, Space Grotesk, JetBrains Mono
 * (see docs/themes.md). Anything else falls back to the next name in the stack.
 */
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/latin-ext-500.css';
import '@fontsource/inter/latin-ext-600.css';
import '@fontsource/inter/latin-ext-700.css';
import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/cyrillic-500.css';
import '@fontsource/inter/cyrillic-600.css';
import '@fontsource/inter/cyrillic-700.css';
import '@fontsource/inter/cyrillic-ext-400.css';
import '@fontsource/inter/cyrillic-ext-500.css';
import '@fontsource/inter/cyrillic-ext-600.css';
import '@fontsource/inter/cyrillic-ext-700.css';
import '@fontsource/inter/greek-400.css';
import '@fontsource/inter/greek-500.css';
import '@fontsource/inter/greek-600.css';
import '@fontsource/inter/greek-700.css';
import '@fontsource/inter/vietnamese-400.css';
import '@fontsource/inter/vietnamese-500.css';
import '@fontsource/inter/vietnamese-600.css';
import '@fontsource/inter/vietnamese-700.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-sans/latin-700.css';
import '@fontsource/ibm-plex-sans/latin-ext-400.css';
import '@fontsource/ibm-plex-sans/latin-ext-500.css';
import '@fontsource/ibm-plex-sans/latin-ext-600.css';
import '@fontsource/ibm-plex-sans/latin-ext-700.css';
import '@fontsource/ibm-plex-sans/cyrillic-400.css';
import '@fontsource/ibm-plex-sans/cyrillic-500.css';
import '@fontsource/ibm-plex-sans/cyrillic-600.css';
import '@fontsource/ibm-plex-sans/cyrillic-700.css';
import '@fontsource/ibm-plex-sans/cyrillic-ext-400.css';
import '@fontsource/ibm-plex-sans/cyrillic-ext-500.css';
import '@fontsource/ibm-plex-sans/cyrillic-ext-600.css';
import '@fontsource/ibm-plex-sans/cyrillic-ext-700.css';
import '@fontsource/ibm-plex-sans/greek-400.css';
import '@fontsource/ibm-plex-sans/greek-500.css';
import '@fontsource/ibm-plex-sans/greek-600.css';
import '@fontsource/ibm-plex-sans/greek-700.css';
import '@fontsource/ibm-plex-sans/vietnamese-400.css';
import '@fontsource/ibm-plex-sans/vietnamese-500.css';
import '@fontsource/ibm-plex-sans/vietnamese-600.css';
import '@fontsource/ibm-plex-sans/vietnamese-700.css';
import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-600.css';
import '@fontsource/space-grotesk/latin-700.css';
import '@fontsource/space-grotesk/latin-ext-400.css';
import '@fontsource/space-grotesk/latin-ext-500.css';
import '@fontsource/space-grotesk/latin-ext-600.css';
import '@fontsource/space-grotesk/latin-ext-700.css';
import '@fontsource/space-grotesk/vietnamese-400.css';
import '@fontsource/space-grotesk/vietnamese-500.css';
import '@fontsource/space-grotesk/vietnamese-600.css';
import '@fontsource/space-grotesk/vietnamese-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import '@fontsource/jetbrains-mono/latin-ext-400.css';
import '@fontsource/jetbrains-mono/latin-ext-500.css';
import '@fontsource/jetbrains-mono/latin-ext-600.css';
import '@fontsource/jetbrains-mono/latin-ext-700.css';
import '@fontsource/jetbrains-mono/cyrillic-400.css';
import '@fontsource/jetbrains-mono/cyrillic-500.css';
import '@fontsource/jetbrains-mono/cyrillic-600.css';
import '@fontsource/jetbrains-mono/cyrillic-700.css';
import '@fontsource/jetbrains-mono/cyrillic-ext-400.css';
import '@fontsource/jetbrains-mono/cyrillic-ext-500.css';
import '@fontsource/jetbrains-mono/cyrillic-ext-600.css';
import '@fontsource/jetbrains-mono/cyrillic-ext-700.css';
import '@fontsource/jetbrains-mono/greek-400.css';
import '@fontsource/jetbrains-mono/greek-500.css';
import '@fontsource/jetbrains-mono/greek-600.css';
import '@fontsource/jetbrains-mono/greek-700.css';
import '@fontsource/jetbrains-mono/vietnamese-400.css';
import '@fontsource/jetbrains-mono/vietnamese-500.css';
import '@fontsource/jetbrains-mono/vietnamese-600.css';
import '@fontsource/jetbrains-mono/vietnamese-700.css';
