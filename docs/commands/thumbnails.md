# thumbnails

Generates optimized thumbnail images for all media files.

```bash
npx simple-photo-gallery thumbnails [options]
```

## How it works

The command will go through all media files and generate thumbnails with suitable resolutions for the gallery and will also update the `gallery.json` file with the new thumbnail paths.

Thumbnails for videos require FFmpeg to be installed so it can extract the first frame of the video. You can install it via:

- macOS: `brew install ffmpeg`
- Ubuntu/Debian: `sudo apt install ffmpeg`
- Windows: [Download from ffmpeg.org](https://ffmpeg.org/download.html)

> Note: usually you don't need to run this command manually as it is run automatically when you run the `simple-photo-gallery build` command.

## Options

| Option                 | Description               | Default           |
| ---------------------- | ------------------------- | ----------------- |
| `-g, --gallery <path>` | Path to gallery directory | Current directory |
| `-r, --recursive`      | Process subdirectories    | `false`           |
| `-v, --verbose`        | Show detailed output      |                   |
| `-q, --quiet`          | Only show warnings/errors |                   |
| `-h, --help`           | Show command help         |                   |

## Examples

```bash
# Generate thumbnails in current directory
npx simple-photo-gallery thumbnails

# Process specific gallery
npx simple-photo-gallery thumbnails -g /path/to/gallery

# Process all galleries recursively
npx simple-photo-gallery thumbnails -r
```
