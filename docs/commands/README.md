# Commands

This is the command reference for Simple Photo Gallery CLI. All commands can be run with `npx simple-photo-gallery@latest <command>`.

> **Navigation:** [Configuration Guide](../configuration.md) | [Deployment Guide](../deployment.md) | [Main Documentation](../README.md)

## Available Commands

- **[init](./init.md)** - Initialize a new gallery by scanning a folder for images and videos
- **[build](./build.md)** - Generate the HTML gallery from your photos and gallery.json
- **[thumbnails](./thumbnails.md)** - Generate optimized thumbnail images for all media files
- **[clean](./clean.md)** - Remove gallery files while preserving original photos

## Quick Reference

For the fastest way to get started, install the `simple-photo-gallery` package globally and then you can use the `spg` command:

```bash
npm install -g simple-photo-gallery@latest
spg init
spg build
```

Alternatively you can use `npx` to run the commands directly:

```bash
npx simple-photo-gallery@latest init
npx simple-photo-gallery@latest build
```

For more advanced workflows and configuration options, see the individual command documentation above.
