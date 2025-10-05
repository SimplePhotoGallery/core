# clean

Removes gallery files while preserving original photos.

```bash
spg clean [options]
```

## How it works

The command will remove the `index.html` file and the `gallery` folder from the gallery directory. It will also remove the `gallery.json` file. After running this command, your photos folder will return to the same state as it was before you initialized the gallery.

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
spg clean

# Clean specific directory
spg clean -g /path/to/gallery

# Clean all galleries recursively
spg clean -r
```
