# Deployment Guide

The goal of Simple Photo Gallery is to provide an easy way to create galleries that you can self-host. There are two main ways to deploy a gallery, depending mostly on how many photos you have:

1. Deploy the gallery and photos together
2. Deploy the photos and the gallery site separately

> **See also:** [Configuration Guide](./configuration.md) | [Commands Reference](./commands/README.md) | [Main Documentation](./README.md)

## Deploying the gallery and photos together

This is the simplest way to deploy a gallery and is the default option when you run the [`init`](./commands/init.md) and [`build`](./commands/build.md) commands. Simple Photo Gallery will create all necessary files for the gallery site directly in the same folder as your photos, so you can simply upload the entire folder to any static page hosting provider. Some good options are:

- [Cloudflare Pages](https://pages.cloudflare.com/)
- [GitHub Pages](https://pages.github.com/)
- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)

If you have many photos and videos, you may run into the limits that these providers impose on the size of the files you can upload.

## Deploying the photos and the gallery site separately

For larger galleries, you'll typically want to deploy the photos and the gallery site separately. This is especially useful when you want to host the photos on a different provider than the gallery site. Some good options for hosting the photos are:

- [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)
- [AWS S3](https://aws.amazon.com/s3/)
- [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces)

You should initialize the gallery in a different folder from the photos folder using the `-g` or `--gallery` option in the [`init` command](./commands/init.md). After you have uploaded all the photos and videos, you can use the [`build` command](./commands/build.md) with the `-b` or `--base-url` option to tell the gallery where to find the photos and videos. The created gallery site files can then be hosted using any of the providers mentioned above, as they are very small and will link to the separately uploaded photos and videos.

If you also want to host the thumbnails separately, you can use the `-t` or `--thumbs-base-url` option in the [`build` command](./commands/build.md) to specify the base URL for the thumbnails. This is useful if you want to host all image and video files separately from the gallery.

You can also set a `baseUrl` property on individual thumbnails in `gallery.json` to host specific thumbnails on different CDNs. Thumbnail-specific `baseUrl` values override the gallery-level `thumbsBaseUrl` setting. See the [Configuration Guide](./configuration.md#thumbnail-url-resolution) for more details.
