# Architecture

Detailed overview of Simple Photo Gallery's multi-theme architecture.

## Package Structure

### Monorepo Layout

```
spg-core/
├── common/          - Shared library (@simple-photo-gallery/common)
├── gallery/         - CLI tool (simple-photo-gallery)
│   └── src/modules/create-theme/templates/base/  - Base theme template
└── themes/modern/   - Default theme (@simple-photo-gallery/theme-modern)
```

### Dependencies

- **gallery** depends on **common** (uses types and validation schemas)
- **themes** depend on **common** (uses theme and client utilities)
- **common** has no internal dependencies (standalone library)

**Build order:** `common` → `gallery` | `themes/modern` (parallel)

### Why Common Must Be Built First

TypeScript and ESLint need the compiled type definitions from `common/dist/` to resolve imports in gallery and theme packages. Running `yarn workspace @simple-photo-gallery/common build` generates the necessary `.d.ts` files and JavaScript output.

The common package uses `tsup` to build:
- TypeScript source files → JavaScript (ESM and CJS)
- Type definitions (`.d.ts`)
- Multiple entry points (main, theme, client)
- CSS bundling for PhotoSwipe styles

---

## Data Flow

### 1. Gallery Initialization (`spg init`)

```
User photos → scanDirectory() → generateGalleryData() → gallery.json
                                                        ↓
                                               extractThumbnails() → images/thumbnails/
```

**Implementation:** [gallery/src/modules/init/](../gallery/src/modules/init/)

The initialization process:

1. **Directory Scanning**
   - Recursively scans photo directories
   - Identifies images and videos by extension
   - Maintains directory structure for sections

2. **Metadata Extraction**
   - Reads EXIF data for image dimensions
   - Extracts video dimensions via FFmpeg
   - Generates unique blurhash for each image
   - Creates thumbnail metadata structure

3. **Gallery Data Generation**
   - Organizes photos into sections (by directory or custom)
   - Creates `GalleryData` structure
   - Writes `gallery.json` to output directory

4. **Thumbnail Generation**
   - Creates optimized thumbnail images
   - Generates standard and retina (@2x) versions
   - Stores in `images/thumbnails/` directory

### 2. Theme Build Process (`spg build --theme <name>`)

```
gallery.json (raw data)
    ↓
Theme package resolution
    ↓
Environment variables set: GALLERY_JSON_PATH, GALLERY_OUTPUT_DIR
    ↓
Theme's Astro build process runs
    ↓ (in theme code)
loadGalleryData() → Raw GalleryData
    ↓
resolveGalleryData() → ResolvedGalleryData
    ↓
Components render using resolved data
    ↓
Static HTML output → _build/ → copied to gallery directory
```

**Implementation:** [gallery/src/modules/build/](../gallery/src/modules/build/)

#### Theme Resolution

The CLI resolves theme packages in the following order:

1. **Local Path Detection**
   - If theme name starts with `.` or `/`: treat as filesystem path
   - Resolve relative to current working directory
   - Verify `package.json` exists at path

2. **npm Package Resolution**
   - Use Node's module resolution algorithm
   - Searches `node_modules/` in current and parent directories
   - Works with scoped packages (`@org/theme-name`)
   - Supports private npm registries

3. **Package Validation**
   - Verify theme package has `package.json`
   - Check for required Astro configuration
   - Validate directory structure

**Default:** If no theme specified, uses `@simple-photo-gallery/theme-modern`

#### Build Execution

The build process:

1. **Environment Setup**
   ```javascript
   process.env.GALLERY_JSON_PATH = '/absolute/path/to/gallery.json'
   process.env.GALLERY_OUTPUT_DIR = '/absolute/path/to/output'
   ```

2. **Astro Build Invocation**
   - Runs `npx astro build` in theme package directory
   - Theme's `astro.config.ts` reads environment variables
   - Astro performs static site generation

3. **Output Processing**
   - Copy `_build/*` directory contents to gallery output
   - Move `_build/index.html` to gallery root
   - Preserve existing `gallery.json` and `images/` directories

#### Data Loading in Themes

Themes use the common package utilities:

**[common/src/theme/loader.ts](../common/src/theme/loader.ts):**
```typescript
const raw = loadGalleryData(galleryJsonPath, { validate: true });
```

This function:
- Reads `gallery.json` from filesystem using Node's `fs` module
- Optionally validates with Zod schema
- Returns raw `GalleryData` structure
- Throws descriptive errors if validation fails

**[common/src/theme/resolver.ts](../common/src/theme/resolver.ts):**
```typescript
const resolved = await resolveGalleryData(raw, { galleryJsonPath });
```

This function:
- **Computes image paths:** Uses `mediaBaseUrl` or relative paths
- **Computes thumbnail paths:** Uses `thumbsBaseUrl` or default location
- **Builds responsive srcsets:** Creates srcset strings for hero images with multiple variants (AVIF, JPG, landscape, portrait)
- **Parses markdown:** Converts markdown descriptions to HTML using `marked` library
- **Resolves sub-galleries:** Computes relative paths between gallery.json files
- Returns `ResolvedGalleryData` ready for rendering

**Key Design:** All path computation and data transformation happens at **build time**, not runtime. This ensures fast static output with no client-side processing needed.

### 3. Client-Side Initialization

After the static HTML is generated, client-side JavaScript enhances the page:

```html
<!-- In built HTML -->
<canvas data-blurhash="LGF5]+Yk^6#M..." width="32" height="32"></canvas>

<script type="module">
  import { decodeAllBlurhashes, createGalleryLightbox } from '@simple-photo-gallery/common/client';

  decodeAllBlurhashes();  // Finds all canvases, decodes blurhash
  const lightbox = createGalleryLightbox();  // Configures PhotoSwipe
  lightbox.init();
</script>
```

**Implementation:** [common/src/client/](../common/src/client/)

Client-side features:

1. **Blurhash Decoding**
   - Finds canvas elements with `data-blurhash` attribute
   - Decodes blurhash strings to pixel data
   - Renders low-quality image placeholders

2. **PhotoSwipe Lightbox**
   - Configures PhotoSwipe with sensible defaults
   - Adds video support via custom plugin
   - Enables full-screen image viewing

3. **Hero Image Fallback**
   - Transitions from blurhash to actual image
   - Smooth fade effect when image loads
   - Improves perceived performance

4. **CSS Utilities**
   - Dynamic CSS custom property manipulation
   - Color parsing and transformation
   - Theme customization support

---

## Theme System Design

### Theme Package Discovery

**Local Paths:**
- Theme string starts with `.` or `/`: filesystem path
- Path resolved relative to current working directory
- Must contain valid `package.json` file
- Useful for development and private themes

**npm Packages:**
- Standard Node.js module resolution
- Searches `node_modules/` directories
- Works with scoped packages (`@organization/theme-name`)
- Supports private npm registries
- Ideal for sharing themes publicly or across projects

**Example:**
```bash
# Local theme
spg build --theme ./themes/my-theme

# npm package (installed)
npm install @myorg/custom-theme
spg build --theme @myorg/custom-theme

# Default theme (no --theme flag)
spg build  # Uses @simple-photo-gallery/theme-modern
```

### Build Process Integration

Themes integrate via Astro's static site generation:

1. **Theme Configuration** ([themes/modern/astro.config.ts](../themes/modern/astro.config.ts))
   ```typescript
   const galleryJsonPath = process.env.GALLERY_JSON_PATH;
   const outputDir = process.env.GALLERY_OUTPUT_DIR;

   export default defineConfig({
     output: 'static',  // Must be static
     outDir: `${outputDir}/_build`,  // CLI expects _build subdirectory
     // ... other config
   });
   ```

2. **Data Loading** (in theme pages)
   ```typescript
   import { loadGalleryData, resolveGalleryData } from '@simple-photo-gallery/common/theme';

   const galleryJsonPath = import.meta.env.GALLERY_JSON_PATH || './gallery.json';
   const raw = loadGalleryData(galleryJsonPath, { validate: true });
   const gallery = await resolveGalleryData(raw, { galleryJsonPath });
   ```

3. **Component Rendering**
   - Components receive resolved data types
   - Use pre-computed paths directly
   - No runtime path calculation needed

4. **Static Output**
   - Astro generates `index.html` and assets
   - CLI moves output to gallery directory
   - Result is fully static, hostable anywhere

**Key constraint:** Themes MUST use `output: 'static'` and generate `index.html`. The CLI expects this structure and will fail if the build doesn't produce static output.

### Environment Variable Passing

#### `GALLERY_JSON_PATH`

Absolute path to the source `gallery.json` file.

**Set by:** CLI before invoking Astro build
**Used by:** Theme to load gallery data
**Available as:** `process.env.GALLERY_JSON_PATH` (Node) and `import.meta.env.GALLERY_JSON_PATH` (Vite)

**Note:** Must be passed to Vite via `define` config for `import.meta.env` access:
```typescript
export default defineConfig({
  vite: {
    define: {
      'process.env.GALLERY_JSON_PATH': JSON.stringify(sourceGalleryPath),
    },
  },
});
```

#### `GALLERY_OUTPUT_DIR`

Directory where the final gallery should be output.

**Set by:** CLI before invoking Astro build
**Used by:** Theme to set Astro's `outDir`
**Default:** Same directory as `gallery.json`

**Usage:**
```typescript
const outputDir = process.env.GALLERY_OUTPUT_DIR || galleryJsonPath.replace('gallery.json', '');

export default defineConfig({
  outDir: `${outputDir}/_build`,  // CLI expects _build subdirectory
});
```

### Why Path Resolution Happens in Common

**Design Decision:** Themes receive fully-resolved data rather than computing paths themselves.

**Benefits:**

1. **Consistency**
   - All themes compute paths identically
   - No risk of path bugs in individual themes
   - Easier to reason about path structure

2. **Simplicity**
   - Themes focus on layout and styling
   - No need to understand path computation logic
   - Reduces cognitive load for theme developers

3. **Performance**
   - Paths computed once at build time
   - No per-component computation
   - No runtime overhead

4. **Flexibility**
   - Path logic can evolve in common package
   - Themes automatically benefit from improvements
   - Bug fixes apply to all themes immediately

5. **Testability**
   - Resolver logic is unit-testable in isolation
   - Easier to verify correctness
   - Can test edge cases comprehensively

**Trade-off:** Themes lose some flexibility in custom path logic, but gain reliability and development speed. This is an intentional choice prioritizing consistency over flexibility.

---

## Multi-Theme Support

### Shared Utilities

All themes import from `@simple-photo-gallery/common`:

**Gallery Module** (`.`):
- Raw `GalleryData` types
- Zod validation schemas
- Type definitions for all data structures

**Theme Module** (`./theme`):
- `loadGalleryData()` - File loading and validation
- `resolveGalleryData()` - Data transformation
- Path utility functions
- Markdown rendering
- Astro integrations

**Client Module** (`./client`):
- PhotoSwipe lightbox integration
- Blurhash decoding utilities
- Hero image fallback behavior
- CSS manipulation helpers

**Styles** (`./styles/photoswipe`):
- PhotoSwipe CSS bundle
- Customizable via CSS custom properties

**This ensures:**
- Consistent behavior across all themes
- Shared bug fixes benefit everyone
- Common package can add features without breaking themes
- Theme developers can focus on presentation

### Theme Independence

Themes are independent npm packages with:

**Own Dependencies:**
- Each theme chooses its Astro version
- Can use different UI libraries
- Can include additional integrations

**Complete Style Control:**
- Themes own all CSS
- No inherited styles from common
- Full creative freedom

**Custom Components:**
- Themes can structure components however they want
- No required component hierarchy
- Only constraint: must read `gallery.json` and generate `index.html`

**Independent Development:**
- Themes can be developed separately
- Can have different maintainers
- Can follow different versioning strategies

**Example:** A theme could use React components via Astro's framework integrations, while another uses plain Astro components. Both work with the same gallery data.

### Scaffolding System

#### Overview

`spg create-theme <name>` creates new themes from a base template.

**Command:** `spg create-theme my-theme [--path ./custom/path]`

**Implementation:** [gallery/src/modules/create-theme/](../gallery/src/modules/create-theme/)

#### Template Source

**Primary Location:** [gallery/src/modules/create-theme/templates/base/](../gallery/src/modules/create-theme/templates/base/)
- Bundled with the CLI package
- Works out-of-the-box after `npm install -g simple-photo-gallery`
- Used in production

**Fallback Location:** `themes/base/` in workspace root
- Only available during local development
- Allows testing template changes without rebuilding CLI
- Not included in published package

#### Scaffolding Process

1. **Validation**
   - Theme name must be alphanumeric with optional hyphens
   - Validates theme name format: `/^[a-z0-9-]+$/`

2. **Monorepo Detection**
   - Searches for workspace root (looks for `package.json` with `workspaces` field)
   - If found: prefer `<root>/themes/<name>` as output location
   - Otherwise: use current directory or custom `--path`

3. **Directory Creation**
   - Determine output path
   - Verify target directory doesn't exist
   - Create parent directories if needed

4. **Template Copy**
   - Copy all files from base template
   - **Exclude:**
     - `node_modules/`
     - `.astro/`, `dist/`, `_build/`
     - `.git/`, `.DS_Store`
     - `README.md`, `README_BASE.md` (handled separately)
     - Log files

5. **Customization**
   - **Update `package.json`:**
     - Replace package name with `@simple-photo-gallery/theme-<name>`
     - Keep version and dependencies unchanged

   - **Generate `README.md`:**
     - Read `README_BASE.md` template
     - Replace `{{THEME_NAME}}` placeholders
     - Write to `README.md` in new theme

6. **Completion**
   - Print success message with next steps
   - Suggest running `yarn install` in theme directory

#### Base Template Structure

```
base/
├── src/
│   ├── pages/
│   │   └── index.astro              - Main gallery page
│   ├── features/
│   │   └── themes/
│   │       └── base-theme/          - Reusable base theme components
│   │           ├── pages/           - Actual page implementations
│   │           ├── components/      - Gallery components
│   │           ├── layouts/         - HTML structure
│   │           └── scripts/         - Client-side code
│   └── styles/                      - Global styles
├── public/                          - Static assets
├── astro.config.ts                  - Astro configuration
├── package.json                     - Dependencies and scripts
├── tsconfig.json                    - TypeScript configuration
└── README_BASE.md                   - Template for generated README
```

**Key Pattern:** The template uses a "wrapper + base-theme" structure:
- `src/pages/index.astro` - Simple wrapper that imports BaseTheme
- `src/features/themes/base-theme/` - Actual implementation
- This pattern allows easy customization by modifying the wrapper or extending the base theme

---

## Adding New Features

### When to Add to Common Package

Add features to [common/](../common/) when:

**Cross-Theme Functionality:**
- Feature is needed by multiple themes
- Feature involves shared business logic
- Feature should behave consistently everywhere

**Examples:**
- New gallery data field → Add to `common/src/gallery/types.ts` and schemas
- Video thumbnail support → Add to `common/src/theme/paths.ts`
- New image transformation → Add to `common/src/theme/resolver.ts`
- Lazy loading utility → Add to `common/src/client/`

**Data Transformation:**
- Any computation that should happen once at build time
- Path resolution logic
- URL construction
- Responsive image srcset generation

**Validation:**
- New fields in `gallery.json` structure
- Schema validation logic
- Type definitions

**Client Utilities:**
- Browser-side helpers that multiple themes might use
- PhotoSwipe extensions
- Animation utilities
- Performance optimizations

### When to Add to Individual Themes

Add features to specific theme packages when:

**Visual/Stylistic:**
- Layout changes
- CSS styling
- Typography choices
- Color schemes

**Theme-Specific Behavior:**
- Custom navigation patterns
- Unique interaction patterns
- Specialized component variants

**Examples:**
- Grid layout variations → Theme CSS
- Custom lightbox animations → Theme JavaScript
- Unique hero section design → Theme components
- Brand-specific styling → Theme CSS variables

### Maintaining Backward Compatibility

#### Common Package

**Rules:**
- Never remove exported functions (deprecate instead)
- Add new fields as optional in TypeScript types
- Keep Zod schemas backward-compatible
- Document breaking changes in CHANGELOG
- Consider migration path before major version

**Example - Adding Optional Field:**
```typescript
// ✅ Good - Optional field
interface GalleryData {
  // ... existing fields
  newFeature?: string;  // Optional
}

// ❌ Bad - Required field (breaking)
interface GalleryData {
  // ... existing fields
  newFeature: string;  // Required - breaks existing galleries
}
```

**Example - Deprecating Function:**
```typescript
// ✅ Good - Deprecate but keep
/**
 * @deprecated Use getPhotoPath() instead
 */
export function getImagePath(filename: string): string {
  return getPhotoPath(filename);
}
```

#### Themes

**Best Practices:**
- Test against multiple `common` package versions
- Use optional chaining for new fields: `gallery.newFeature?.value`
- Provide sensible fallbacks for missing data
- Document minimum required `common` version in `package.json`

**Example:**
```typescript
// ✅ Good - Handles missing field gracefully
const feature = gallery.newFeature ?? 'default-value';

// ❌ Bad - Assumes field exists
const feature = gallery.newFeature.value;  // Runtime error if undefined
```

### Testing Across Themes

When changing the common package:

1. **Build Common Package**
   ```bash
   yarn workspace @simple-photo-gallery/common build
   ```

2. **Test Modern Theme**
   ```bash
   yarn workspace @simple-photo-gallery/theme-modern build
   ```
   Verify no TypeScript errors or build failures

3. **Create Test Theme**
   ```bash
   spg create-theme test-theme
   cd themes/test-theme
   yarn install
   ```

4. **Test with Real Gallery**
   ```bash
   # Create test gallery
   spg init -p /path/to/photos -g /tmp/test-gallery

   # Build with test theme
   spg build --theme ./themes/test-theme -g /tmp/test-gallery
   ```

5. **Verify Output**
   - Open `/tmp/test-gallery/index.html` in browser
   - Check console for JavaScript errors
   - Verify all features work as expected
   - Test responsive behavior
   - Verify lightbox functionality

6. **Cross-Browser Testing**
   - Test in Chrome, Firefox, Safari
   - Test on mobile devices
   - Verify PWA functionality (if applicable)

---

## Key Implementation Files

| Component | Location |
|-----------|----------|
| Build orchestration | [gallery/src/modules/build/](../gallery/src/modules/build/) |
| Gallery initialization | [gallery/src/modules/init/](../gallery/src/modules/init/) |
| Data loader | [common/src/theme/loader.ts](../common/src/theme/loader.ts) |
| Data resolver | [common/src/theme/resolver.ts](../common/src/theme/resolver.ts) |
| Path utilities | [common/src/theme/paths.ts](../common/src/theme/paths.ts) |
| Markdown rendering | [common/src/theme/markdown.ts](../common/src/theme/markdown.ts) |
| Client utilities | [common/src/client/](../common/src/client/) |
| Blurhash utilities | [common/src/client/blurhash.ts](../common/src/client/blurhash.ts) |
| PhotoSwipe integration | [common/src/client/photoswipe/](../common/src/client/photoswipe/) |
| Gallery types | [common/src/gallery/types.ts](../common/src/gallery/types.ts) |
| Gallery schemas | [common/src/gallery/schemas.ts](../common/src/gallery/schemas.ts) |
| Base template | [gallery/src/modules/create-theme/templates/base/](../gallery/src/modules/create-theme/templates/base/) |
| Modern theme | [themes/modern/](../themes/modern/) |
| Theme base components | [themes/modern/src/features/themes/base-theme/](../themes/modern/src/features/themes/base-theme/) |
| Theme scaffolder | [gallery/src/modules/create-theme/](../gallery/src/modules/create-theme/) |

---

## Design Principles

### 1. Separation of Concerns

**CLI** handles:
- Gallery data generation from photos
- Thumbnail creation
- Theme resolution and build orchestration
- File system operations

**Common** handles:
- Data validation and schemas
- Data transformation and resolution
- Path computation
- Client-side utilities

**Themes** handle:
- Layout and presentation
- Component structure
- Styling and visual design
- User experience

This separation allows each package to evolve independently while maintaining clear interfaces between them.

### 2. Static-First

Everything is computed at **build time**, not runtime:
- All paths resolved during build
- Markdown parsed to HTML during build
- Responsive srcsets generated during build
- No runtime data transformation

**Benefits:**
- Fast page loads (no client-side processing)
- Works without JavaScript
- Hostable anywhere (just static files)
- Excellent SEO (all content in HTML)

### 3. Type Safety

TypeScript throughout the entire stack:
- Common package exports comprehensive types
- Themes get full IntelliSense support
- Catch errors at development time
- Self-documenting code

**Example:**
```typescript
import type { ResolvedGalleryData } from '@simple-photo-gallery/common/theme';

// TypeScript knows the exact structure
const gallery: ResolvedGalleryData = await resolveGalleryData(raw);
gallery.sections[0].images  // ✅ TypeScript validates this
```

### 4. Developer Experience

**Simple scaffolding:**
```bash
spg create-theme my-theme  # One command to start
```

**Clear utilities:**
```typescript
// Intuitive API
const gallery = await resolveGalleryData(raw);
const lightbox = createGalleryLightbox();
```

**Good defaults:**
- PhotoSwipe configured out of the box
- Sensible path resolution
- Validation enabled by default

**Comprehensive documentation:**
- API reference in common README
- Architecture guide (this document)
- Theme development guide
- Command documentation

### 5. Flexibility

**Multiple theme sources:**
- npm packages (public or private)
- Local filesystem paths
- Default theme built-in

**Extensibility:**
- Themes can add custom features
- Common package is extensible
- Plugin system via Astro integrations

**No lock-in:**
- Themes are just npm packages
- Can fork and customize
- Can create completely custom themes

---

## See Also

- [Common Package API](../common/README.md) - Complete API reference
- [Custom Themes Guide](./themes.md) - Theme development guide
- [Commands Reference](./commands/README.md) - CLI documentation
- [Modern Theme Source](../themes/modern/) - Reference implementation
- [Gallery Configuration](./configuration.md) - gallery.json manual editing
