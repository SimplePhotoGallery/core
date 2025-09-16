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

## Sub-galleries

Sub-galleries are links to other galleries, typically located in subdirectories of the photos folder. They are used to create navigation between galleries and sub-galleries.

Sub-galleries are generated automatically when you initialize the gallery in the top-level folder with the `-r` or `--recursive` flag. After that, you can edit the `subGalleries` attribute in the `gallery.json` file if you want to use different titles or images for the links.

## Captions

When displaying photos and videos in full screen, you can show captions at the bottom. The captions are automatically extracted from the EXIF data of the photos if you used a tool to add them. If not, you can add them manually in the `gallery.json` file using the `alt` attribute of each image or video.

## Thumbnail size

Thumbnails will automatically be generated using sizes that fit the theme (300px height and 600px height for retina displays). If you want, you can change the size using the `thumbnailSize` attribute in the `gallery.json` file.
