# thumbnails

Generates optimized thumbnail images for all media files.

```bash
spg thumbnails [options]
```

## How it works

The command will go through all media files and generate thumbnails with suitable resolutions for the gallery. It will also update the `gallery.json` file with the new thumbnail paths.

Thumbnail configuration follows the [configuration hierarchy](../configuration.md#thumbnail-configuration): CLI options → gallery.json → themeConfig.json → built-in defaults (300px, auto edge). If your gallery.json specifies a theme, the theme's thumbnail settings will be loaded as a fallback.

Thumbnails for videos require FFmpeg to be installed so it can extract the first frame of the video. You can install it via:

- **macOS:** `brew install ffmpeg`
- **Ubuntu/Debian:** `sudo apt install ffmpeg`
- **Windows:** [Download from ffmpeg.org](https://ffmpeg.org/download.html)

> **Note:** Usually you don't need to run this command manually, as it runs automatically when you execute the [`simple-photo-gallery build`](./build.md) command.

## Options

| Option                        | Description                                       | Default               |
| ----------------------------- | ------------------------------------------------- | --------------------- |
| `-g, --gallery <path>`        | Path to gallery directory                         | Current directory     |
| `-r, --recursive`             | Process subdirectories                            | `false`               |
| `--thumbnail-size <pixels>`   | Override thumbnail size in pixels                 | From config hierarchy |
| `--thumbnail-edge <mode>`     | Override size mode: auto, width, or height        | From config hierarchy |
| `-v, --verbose`               | Show detailed output                              |                       |
| `-q, --quiet`                 | Only show warnings/errors                         |                       |
| `-h, --help`                  | Show command help                                 |                       |

## Examples

```bash
# Generate thumbnails in current directory
spg thumbnails

# Process specific gallery
spg thumbnails -g /path/to/gallery

# Process all galleries recursively
npx simple-photo-gallery@latest thumbnails -r

# Override thumbnail size via CLI
spg thumbnails --thumbnail-size 400

# Override both size and edge mode
spg thumbnails --thumbnail-size 250 --thumbnail-edge height
```
