# Deployment Guide

Three ways to deploy your gallery, from simple to advanced.

## Option 1: Same Folder (Simplest)

Generate the gallery in your photos folder and upload everything.

```bash
cd /path/to/photos
npx simple-photo-gallery init
npx simple-photo-gallery build
```

**Upload**: Entire folder including photos, index.html, and gallery/

**Pros**: Dead simple, works anywhere  
**Cons**: Uploads all photos every time

## Option 2: Separate Build Folder

Build gallery in different location, keeping photos separate.

```bash
npx simple-photo-gallery init -p ~/Photos/vacation -g ~/Sites/vacation
npx simple-photo-gallery build -g ~/Sites/vacation
```

Then either:
- Copy photos to the build folder, or
- Use `--base-url` to point to photos location

```bash
# Copy photos
cp -r ~/Photos/vacation/* ~/Sites/vacation/

# OR use base URL
npx simple-photo-gallery build -g ~/Sites/vacation -b ../Photos/vacation/
```

**Pros**: Clean separation, easier updates  
**Cons**: Need to manage two folders

## Option 3: CDN for Photos

Host photos on CDN, serve only HTML from your server.

```bash
# Upload photos to CDN first
# Then build with CDN URL
npx simple-photo-gallery build --base-url https://cdn.example.com/photos/
```

**Pros**: Fast global delivery, minimal hosting needs  
**Cons**: Requires CDN setup

## Hosting on Cloudflare Pages

Free, fast, and simple hosting for your gallery.

### 1. Prepare Your Gallery

```bash
# Create gallery
npx simple-photo-gallery init
npx simple-photo-gallery build
```

### 2. Create Cloudflare Project

1. Sign up at [pages.cloudflare.com](https://pages.cloudflare.com)
2. Create new project
3. Connect to Git or upload directly

### 3. Direct Upload Method

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy gallery
wrangler pages deploy . --project-name=my-gallery
```

### 4. Git Method

1. Push gallery to GitHub/GitLab
2. Connect repo in Cloudflare Pages
3. Set build command: `echo "No build needed"`
4. Set output directory: `/`

### 5. Custom Domain (Optional)

1. Go to Custom domains in Cloudflare Pages
2. Add your domain
3. Update DNS records as shown

## Cloudflare + R2 Storage (Advanced)

For large galleries, use R2 for photo storage:

### 1. Create R2 Bucket

```bash
# Create bucket
wrangler r2 bucket create my-photos

# Upload photos
wrangler r2 object put my-photos/vacation/ --file ./photos --recursive
```

### 2. Configure Public Access

1. Go to R2 in Cloudflare dashboard
2. Select bucket → Settings
3. Enable public access
4. Copy the public URL

### 3. Build with R2 URL

```bash
npx simple-photo-gallery build --base-url https://pub-xxx.r2.dev/
```

### 4. Deploy HTML to Pages

```bash
wrangler pages deploy gallery/ --project-name=my-gallery
```

## Other Hosting Options

### GitHub Pages
```bash
# Build to docs folder
npx simple-photo-gallery build -g ./docs

# Push to GitHub
git add docs
git commit -m "Add gallery"
git push

# Enable Pages in repo settings
```

### Netlify
```bash
# Build gallery
npx simple-photo-gallery build

# Deploy with CLI
npx netlify deploy --prod
```

### Traditional Web Hosting

Upload via FTP/SFTP:
1. Build gallery locally
2. Upload entire folder
3. Navigate to index.html

## Performance Tips

1. **Optimize photos before upload**
   - Resize to reasonable dimensions (2000-4000px)
   - Use WebP format for better compression
   - Consider separate folders by resolution

2. **Use CDN for global audience**
   - Cloudflare R2
   - Amazon S3 + CloudFront  
   - Bunny CDN

3. **Enable caching**
   - Photos: Cache for 1 year
   - HTML: Cache for 1 hour
   - Thumbnails: Cache for 1 month

## Quick Deploy Commands

### Local Preview
```bash
npx simple-photo-gallery init && npx simple-photo-gallery build
python3 -m http.server 8000
```

### Cloudflare Pages
```bash
npx simple-photo-gallery init && npx simple-photo-gallery build
wrangler pages deploy . --project-name=gallery
```

### With External Photos
```bash
# Upload photos to CDN first
npx simple-photo-gallery build --base-url https://cdn.example.com/
wrangler pages deploy gallery/ --project-name=gallery
```