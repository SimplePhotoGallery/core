# clean

Removes gallery files while preserving original photos.

```bash
npx simple-photo-gallery clean [options]
```

## How it works

The command will remove the `index.html` file and the `gallery` folder from the gallery directory. It will also remove the `gallery.json` file. After calling this command, your photos folder will be back in the same state as it was before you initialized the gallery.

## Options

| Option                 | Description               | Default           |
| ---------------------- | ------------------------- | ----------------- |
| `-g, --gallery <path>` | Path to gallery directory | Current directory |
| `-r, --recursive`      | Clean all galleries       | `false`           |
| `-v, --verbose`        | Show detailed output      |                   |
| `-q, --quiet`          | Only show warnings/errors |                   |
| `-h, --help`           | Show command help         |                   |

## Examples

```bash
# Clean current directory
npx simple-photo-gallery clean

# Clean specific directory
npx simple-photo-gallery clean -g /path/to/gallery

# Clean all galleries recursively
npx simple-photo-gallery clean -r
```
