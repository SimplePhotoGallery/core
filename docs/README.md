# Simple Photo Gallery Documentation

Complete documentation for all gallery features and options.

## Commands

- [init](init.md) - Scan folders and create gallery configuration
- [thumbnails](thumbnails.md) - Generate thumbnail images
- [build](build.md) - Build the HTML gallery
- [clean](clean.md) - Remove generated files

## Configuration

- [gallery.json](gallery-json.md) - Manual configuration and multiple sections

## Deployment

- [Deployment Guide](deployment.md) - Hosting options and Cloudflare setup

## Quick Reference

### Most Common Use Case
```bash
cd /path/to/photos
npx simple-photo-gallery init
npx simple-photo-gallery build
# Open index.html
```

### Build in Different Folder
```bash
npx simple-photo-gallery init -p ~/Photos -g ~/Website
npx simple-photo-gallery build -g ~/Website
```

### Recursive Galleries
```bash
npx simple-photo-gallery init -r
npx simple-photo-gallery build -r
```

### Deploy to Cloudflare
```bash
npx simple-photo-gallery init && npx simple-photo-gallery build
wrangler pages deploy . --project-name=my-gallery
```