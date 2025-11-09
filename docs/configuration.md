# Gallery Configuration

The `gallery.json` file controls your gallery's structure, metadata, and organization. This file is created by the [`init` command](./commands/init.md) but can be manually edited for advanced customization.

This page explains how to use the advanced configuration options.

> **See also:** [Commands Reference](./commands/README.md) | [Deployment Guide](./deployment.md) | [Main Documentation](./README.md)

## Site metadata

The site metadata is used by search engines and social media platforms to get structured data for your site and display a nice-looking card. Simple Photo Gallery has already automated part of this by setting the title and description of the gallery and generating a social media card from the header image.

However, you may want to add some more information using the following parameters:

- `author` - The author of the site
- `keywords` - The keywords of the site
- `language` - The language of the site
- `robots` - The robots of the site
- `ogType` - The type of the site, e.g. `website` or `article`
- `ogSiteName` - The name of the site
- `twitterSite` - The site to use for the social media card
- `twitterCreator` - The creator to use for the social media card

Additionally, the following parameters are automatically generated, but you can override them:

- `canonicalUrl` - The canonical URL of the site
- `ogUrl` - The URL of the site
- `ogImage` - The image to use for the social media card
- `ogImageWidth` - The width of the image
- `ogImageHeight` - The height of the image

## Sections

Sections can be used to group your photos with their own titles and descriptions. This is useful if you have a large gallery and want to split it into smaller sections.

The `sections` array can be used to define the sections of the gallery. Each section object can have the following properties:

- `title` - The title of the section (optional)
- `description` - The description of the section (optional)
- `images` - An array of images to display in the section

You will usually initialize the gallery with the `init` command to scan all the photos and then split them into sections manually in the `gallery.json` file.

## Media files

Each item in the `images` array of a section represents a media file (image or video). Media files have the following properties:

### Required properties

- `type` - The type of media: `"image"` or `"video"`
- `filename` - The filename of the media file (e.g., `"photo-001.jpg"`)
- `width` - The width of the media in pixels
- `height` - The height of the media in pixels

### Optional properties

- `url` - A custom URL for the media file. If provided, this URL will be used directly as the source, regardless of the `mediaBaseUrl` setting or base path configuration. This is useful when you want to host specific images on different CDNs or use external URLs.
- `alt` - A caption/description for the media (supports Markdown formatting)
- `thumbnail` - Thumbnail metadata object with `path`, `pathRetina`, `width`, `height`, optional `blurHash`, and optional `baseUrl`
- `lastMediaTimestamp` - Timestamp metadata (automatically generated)

### URL resolution

By default, the full image URL is constructed by combining the `mediaBaseUrl` (if set) with the `filename`. However, if a `url` field is present, it will always be used instead, ignoring any base URL or path settings.

**Example without custom URL:**

```json
{
  "type": "image",
  "filename": "photo-001.jpg",
  "width": 1920,
  "height": 1080
}
```

If `mediaBaseUrl` is set to `"https://cdn.example.com/images"`, the final URL will be `"https://cdn.example.com/images/photo-001.jpg"`.

**Example with custom URL:**

```json
{
  "type": "image",
  "filename": "photo-001.jpg",
  "url": "https://special-cdn.example.com/custom-path/photo-001.jpg",
  "width": 1920,
  "height": 1080
}
```

The final URL will always be `"https://special-cdn.example.com/custom-path/photo-001.jpg"`, regardless of the `mediaBaseUrl` setting.

### Thumbnail URL resolution

By default, thumbnail URLs are constructed by combining the `thumbsBaseUrl` (if set at the gallery level) with the thumbnail `path` or `pathRetina`. However, you can override this for individual thumbnails by setting a `baseUrl` property directly on the thumbnail object.

**Priority order for thumbnail URLs:**
1. If a thumbnail has a `baseUrl` property, it will be used to construct the URL: `${thumbnail.baseUrl}/${path}` or `${thumbnail.baseUrl}/${pathRetina}`
2. Otherwise, if `thumbsBaseUrl` is set at the gallery level, it will be used: `${thumbsBaseUrl}/${path}` or `${thumbsBaseUrl}/${pathRetina}`
3. Otherwise, thumbnails will use the default relative path: `gallery/images/${path}`

**Example with gallery-level thumbsBaseUrl:**
```json
{
  "thumbsBaseUrl": "https://cdn.example.com/thumbs",
  "sections": [
    {
      "images": [
        {
          "type": "image",
          "filename": "photo-001.jpg",
          "width": 1920,
          "height": 1080,
          "thumbnail": {
            "path": "photo-001.avif",
            "pathRetina": "photo-001@2x.avif",
            "width": 300,
            "height": 200
          }
        }
      ]
    }
  ]
}
```

The thumbnail URLs will be:
- Regular: `https://cdn.example.com/thumbs/photo-001.avif`
- Retina: `https://cdn.example.com/thumbs/photo-001@2x.avif`

**Example with thumbnail-specific baseUrl:**
```json
{
  "thumbsBaseUrl": "https://cdn.example.com/thumbs",
  "sections": [
    {
      "images": [
        {
          "type": "image",
          "filename": "photo-001.jpg",
          "width": 1920,
          "height": 1080,
          "thumbnail": {
            "baseUrl": "https://special-cdn.example.com/custom-thumbs",
            "path": "photo-001.avif",
            "pathRetina": "photo-001@2x.avif",
            "width": 300,
            "height": 200
          }
        }
      ]
    }
  ]
}
```

The thumbnail URLs will be:
- Regular: `https://special-cdn.example.com/custom-thumbs/photo-001.avif`
- Retina: `https://special-cdn.example.com/custom-thumbs/photo-001@2x.avif`

The thumbnail-specific `baseUrl` overrides the gallery-level `thumbsBaseUrl`, allowing you to host specific thumbnails on different CDNs or use external URLs.

> **Note:** When building galleries with the CLI, thumbnail-specific `baseUrl` values are preserved and will not be overwritten by the `--thumbs-base-url` option.

## Sub-galleries

Sub-galleries are links to other galleries, typically located in subdirectories of the photos folder. They are used to create navigation between galleries and sub-galleries.

Sub-galleries are generated automatically when you initialize the gallery in the top-level folder with the `-r` or `--recursive` flag. After that, you can edit the `subGalleries` attribute in the `gallery.json` file if you want to use different titles or images for the links.

## Captions

When displaying photos and videos in full screen, you can show captions at the bottom. The captions are automatically extracted from the EXIF data of the photos if you used a tool to add them. If not, you can add them manually in the `gallery.json` file using the `alt` attribute of each image or video.

## Markdown formatting

Gallery descriptions, section descriptions, and image captions support Markdown formatting for rich text styling. This allows you to add emphasis, links, lists, and code snippets to your text.

### Supported Markdown features

The following Markdown elements are supported:

- **Bold text** - Use `**bold**` or `__bold__`
- _Italic text_ - Use `*italic*` or `_italic_`
- [Links](https://example.com) - Use `[link text](url)`
- Lists - Both ordered (`1. Item`) and unordered (`- Item`)
- `Inline code` - Use backticks: `` `code` ``
- Code blocks - Use triple backticks:
  ````
  ```
  code block
  ```
  ````
- Block quotes - Use `> quote text`

### Where you can use Markdown

Markdown formatting is available in:

1. **Gallery description** - The main description shown on the hero section
2. **Section descriptions** - Descriptions for each gallery section
3. **Image/video captions** - The `alt` attribute of images and videos

### Example

```json
{
  "title": "My Gallery",
  "description": "Welcome to my **photo collection**! Check out [my website](https://example.com) for more.",
  "sections": [
    {
      "title": "Tokyo 2024",
      "description": "Photos from *Japan* featuring:\n\n- Cherry blossoms\n- Street photography\n- `Fujifilm X-T5`",
      "images": [
        {
          "type": "image",
          "filename": "tokyo-001.jpg",
          "width": 1920,
          "height": 1080,
          "alt": "Sunset at **Mount Fuji** - taken with `50mm f/1.8`"
        }
      ]
    }
  ]
}
```

### Styling notes

- **Links** are styled with a subtle gray color that stands out from regular text
- **Headings** in Markdown are automatically converted to paragraphs to maintain consistent styling
- **Images** and **tables** are not supported for security and layout consistency
- **HTML tags** are stripped for security

## Thumbnail size

Thumbnails will automatically be generated using sizes that fit the theme (300px height and 600px height for retina displays). If you want, you can change the size using the `thumbnailSize` attribute in the `gallery.json` file.

## Analytics script

You can add custom analytics scripts (such as Google Analytics, Plausible, or other tracking services) to your gallery by including an `analyticsScript` field in your `gallery.json` file. The script will be embedded at the end of the HTML body tag.

### Example

```json
{
  "title": "My Gallery",
  "description": "My gallery with fantastic photos.",
  "analyticsScript": "<!-- Google Analytics -->\n<script async src=\"https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID\"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'GA_MEASUREMENT_ID');\n</script>",
  ...
}
```

> **Security Note:** The `analyticsScript` field accepts arbitrary HTML and JavaScript that will be embedded directly into your gallery. Only add scripts from trusted sources and never include user-provided content in this field. This field is intended to be edited by the gallery owner, not by end users.
