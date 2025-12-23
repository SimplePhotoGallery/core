# build

Creates the static HTML gallery website.

```bash
spg build [options]
```

## How it works

The command will generate the static HTML gallery from the `gallery.json` file and the linked photos and videos. It will also generate thumbnails for the photos and videos, as well as a social media image for the gallery.

If you have created the gallery in a different folder from the photos folder, the command will copy the photos and videos to the gallery folder. If you have set the `-b` or `--base-url` option, the command will link to the photos and videos from the external URL instead of copying them. Additionally, you can also set the `-t` or `--thumbs-base-url` option to specify the base URL for the thumbnails.

## Options

| Option                        | Description                                 | Default                              |
| ----------------------------- | ------------------------------------------- | ------------------------------------ |
| `-g, --gallery <path>`        | Path to gallery directory                   | Current directory                    |
| `-r, --recursive`             | Build all galleries                         | `false`                              |
| `-b, --base-url <url>`        | Base URL for external hosting               | None                                 |
| `-t, --thumbs-base-url <url>` | Base URL for external hosting of thumbnails | None                                 |
| `--theme <package>`           | Theme package to use                        | `@simple-photo-gallery/theme-modern` |
| `--no-scan`                   | Do not scan for new photos                  | `true`                               |
| `--no-thumbnails`             | Skip creating thumbnails                    | `true`                               |
| `-v, --verbose`               | Show detailed output                        |                                      |
| `-q, --quiet`                 | Only show warnings/errors                   |                                      |
| `-h, --help`                  | Show command help                           |                                      |

## Examples

```bash
# Build gallery in current directory
spg build

# Build specific gallery
spg build -g /path/to/gallery

# Build all galleries recursively
spg build -r

# Build with external base URL (no photo copying) - useful for hosting photos separately from the gallery
spg build -b https://photos.example.com/

# Build with external base URL for photos and thumbnails
spg build -b https://photos.example.com/ -t https://photos.example.com/thumbnails

# Build without scanning for new photos
spg build --no-scan

# Build without creating thumbnails
spg build --no-thumbnails

# Build with a custom theme package
spg build --theme @your-org/your-private-theme
```

## Custom Themes

You can use custom theme packages by specifying the `--theme` option. The theme package must be installed as a dependency in your project. See the [Custom Themes](../themes.md) guide for requirements and how to create your own theme.
