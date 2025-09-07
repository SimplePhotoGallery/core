# Clean Command

The `clean` command removes all generated gallery files.

## Basic Usage

```bash
npx simple-photo-gallery clean
```

Deletes `index.html` and the `gallery/` directory.

## Options

### Gallery Path (`-g, --gallery`)

Specify which gallery to clean.

```bash
npx simple-photo-gallery clean --gallery /path/to/gallery
```

**Default**: Current directory

### Recursive (`-r, --recursive`)

Clean galleries in subdirectories.

```bash
npx simple-photo-gallery clean --recursive
```

## What It Removes

- `index.html` - Generated gallery page
- `gallery/` - All gallery assets and thumbnails
- Preserves:
  - Your original photos
  - `gallery.json` configuration

## When to Use

- **Starting fresh** - Remove old gallery before rebuilding
- **Changing themes** - Clean before switching gallery themes
- **Fixing issues** - Clear corrupted or incomplete builds
- **Saving space** - Remove galleries you no longer need

## Safety

The clean command:
- ✅ Never deletes original photos
- ✅ Preserves gallery.json
- ✅ Only removes generated files
- ✅ Asks for confirmation (unless using `--quiet`)

## Examples

### Clean current directory
```bash
npx simple-photo-gallery clean
```

### Clean specific gallery
```bash
npx simple-photo-gallery clean -g ~/Sites/vacation-gallery
```

### Clean all sub-galleries
```bash
npx simple-photo-gallery clean -r
```

### Clean without prompts
```bash
npx simple-photo-gallery clean -q
```

## Workflow Example

```bash
# Clean old build
npx simple-photo-gallery clean

# Regenerate everything
npx simple-photo-gallery init
npx simple-photo-gallery build
```