# init

Scans a folder for images and videos and creates a `gallery.json` file.

```bash
npx simple-photo-gallery init [options]
```

## How it works

This command is used to initialize a new gallery by scanning a folder (and optionally its subfolders) for images and videos. The command will prompt you to enter the gallery title, description, header image and URL where it will be hosted. All of these can later be edited in the `gallery.json` file.

> Note: the URL is important if you want to have the automatically generated social media images work correctly, as it needs to be an absolute URL.

After that, the command will create a `gallery` folder and a `gallery.json` file in it. The `gallery.json` file contains all the information about the gallery, including the title, description, header image, URL and all images and videos in the gallery.

## Options

| Option                 | Description                          | Default               |
| ---------------------- | ------------------------------------ | --------------------- |
| `-p, --photos <path>`  | Path to folder containing photos     | Current directory     |
| `-g, --gallery <path>` | Where to create the gallery          | Same as photos folder |
| `-r, --recursive`      | Create galleries from subdirectories | `false`               |
| `-d, --default`        | Use default settings (skip prompts)  | `false`               |
| `-v, --verbose`        | Show detailed output                 |                       |
| `-q, --quiet`          | Only show warnings/errors            |                       |
| `-h, --help`           | Show command help                    |                       |

## Examples

```bash
# Create gallery in current folder
npx simple-photo-gallery init

# Scan specific folder
npx simple-photo-gallery init -p /path/to/photos

# Create gallery in different location
npx simple-photo-gallery init -p /photos -g /gallery

# Scan subdirectories and create multiple galleries
npx simple-photo-gallery init -r

# Skip interactive prompts
npx simple-photo-gallery init -d
```

## Creating the gallery in a folder other than the photos folder

The simples way to create the gallery is in the same folder where your photos are. However, this means you will have the `index.html` file and the `gallery` folder in the same folder as your photos. If you want to keep your photo folders clean and not add any files, you can create the gallery in a differnt folder using the `-g` flag.

If you do this, you will need to choose how the gallery links to your photos and there are two options for that:

### Copy all photos in the gallery folder

This is the simplest option and will copy all photos in the gallery folder to the `gallery` folder. This is the default option and you will be able to just upload the whole gallery folder to your hosting provider.

### Link to photos uploaded separately

If you want to avoid copying the photos to the gallery folder, you can tell simple photo gallery the URL where they are uploaded and upload them separately from the gallery. For this you can use the `-b` or `--base-url` option in the `simple-photo-gallery build` command.

This is especially useful for large galleries as static page hosting providers often have a limit on the size of the files you can upload. In this case, you can upload the photos to some kind of bucket storage that doesn't support hosting sites like for example Cloudflare R2, AWS S3 or DigitalOcean Spaces, while you keep hosting the gallery itself on another provider like Cloudflare Pages, GitHub Pages, Vercel or Netlify.

Keep in mind that the local files will be used when scanning the photos and when generating the thumbnails. The URL where they are hosted will only be used to link to them in the gallery.

## Recursive gallery initialization

The `-r` or `--recursive` flag can be used to create galleries from all subdirectories of the photos folder. This is useful if you have a lot of photos in subdirectories and you want to create a gallery for each subdirectory.

```bash
npx simple-photo-gallery init -r
```

The command will recursively scan all subdirectories of the photos folder and create a separate gallery for each subdirectory. This has the same effect as running the command multiple times with the `-p` flag set to each subdirectory.

What the recursive option does in addition is that it creates links between the galleries and subgallries will appear as links in the each folder gallery. This way you can navigate between the galleries and subgallries.

> Node: if you have a lot of subdirectories you might want to use the `-d` or `--default` flag to skip the interactive prompts.
