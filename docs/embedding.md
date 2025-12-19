# Embedding

Simple Photo Gallery supports URL query parameters to customize gallery appearance at runtime. This enables dynamic styling for embedding and customization without rebuilding the gallery.

## Overview

URL query parameters allow you to customize the gallery's appearance dynamically by adding parameters to the gallery URL. This is particularly useful when:

- **Embedding galleries** in other websites with transparent backgrounds
- **Dynamically adjusting colors** to match parent page themes
- **Hiding header images** when embedding in constrained spaces
- **Customizing appearance** without rebuilding the gallery

All parameters are applied at runtime, so you can create multiple variations of the same gallery by simply changing the URL.

## Features

The query parameter system supports the following customization options:

- **Header visibility**: `?headerImage=false` to hide the hero section
- **Transparent background**: `?background=transparent` for embedding scenarios
- **Typography colors**: `?typographyColor=light|dark` or custom hex/rgba colors
- **Section backgrounds**: `?sectionBgColor`, `?sectionBgColorEven`, `?sectionBgColorOdd` for custom section colors
- **Hero height**: `?heroHeight=50` to adjust the hero section height

## Basic Embedding

To embed the gallery, use an iframe pointing to your gallery URL:

```html
<iframe
  src="https://your-gallery-url.com/"
  width="100%"
  height="800"
  frameborder="0"
  allowfullscreen
></iframe>
```

## Usage Example

Here's a complete example showing how to embed a gallery with custom styling:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Website with Embedded Gallery</title>
    <style>
      body {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        margin: 0;
        padding: 20px;
        font-family: system-ui, sans-serif;
      }
      .gallery-container {
        max-width: 1200px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        backdrop-filter: blur(10px);
      }
      iframe {
        border-radius: 8px;
        border: none;
      }
    </style>
  </head>
  <body>
    <div class="gallery-container">
      <h1>My Photo Gallery</h1>
      <iframe
        src="https://gallery.example.com/?background=transparent&headerImage=false&typographyColor=light&sectionBgColor=transparent"
        width="100%"
        height="1200"
        frameborder="0"
        allowfullscreen
      ></iframe>
    </div>
  </body>
</html>
```

In this example:

- `background=transparent` makes the gallery background transparent so the parent page's gradient shows through
- `headerImage=false` hides the hero section to save vertical space
- `typographyColor=light` sets white text that contrasts well with the dark gradient background
- `sectionBgColor=transparent` ensures section backgrounds are also transparent

The result is a gallery that seamlessly blends into the parent page's design.

## Query String Parameters

Add parameters to the URL to customize the gallery's appearance:

```
https://your-gallery-url.com/?background=transparent&headerImage=false
```

### Available Parameters

| Parameter            | Values                    | Description                                            |
| -------------------- | ------------------------- | ------------------------------------------------------ |
| `headerImage`        | `false`, `0`              | Hide the hero/header section                           |
| `heroHeight`         | Number (e.g., `50`, `80`) | Set hero height in viewport height units (vh)          |
| `background`         | `transparent`             | Make all backgrounds transparent                       |
| `typographyColor`    | Preset or color value     | Change text colors                                     |
| `sectionBgColor`     | Color value               | Set background color for all sections                  |
| `sectionBgColorEven` | Color value               | Set background color for even sections (2nd, 4th, ...) |
| `sectionBgColorOdd`  | Color value               | Set background color for odd sections (1st, 3rd, ...)  |

---

## Parameter Details

### `headerImage`

Controls the visibility of the hero section (the large header image with title).

| Value       | Effect                           |
| ----------- | -------------------------------- |
| `false`     | Hides the hero section           |
| `0`         | Hides the hero section           |
| _(omitted)_ | Shows the hero section (default) |

**Example:** Hide the hero section

```
?headerImage=false
```

---

### `heroHeight`

Sets the height of the hero section. Accepts a number that is interpreted as viewport height units (`vh`).

| Value | Effect                                 |
| ----- | -------------------------------------- |
| `100` | Full viewport height (100vh) - default |
| `50`  | Half viewport height (50vh)            |
| `80`  | 80% of viewport height (80vh)          |

**Example:** Set hero to 50% of viewport height

```
?heroHeight=50
```

---

### `background`

Controls the background transparency of the gallery. Useful when embedding in a page where you want the host page's background to show through.

| Value         | Effect                                                   |
| ------------- | -------------------------------------------------------- |
| `transparent` | Makes all backgrounds transparent (html, body, sections) |
| _(omitted)_   | Uses default backgrounds                                 |

**Example:** Transparent background for iframe embedding

```
?background=transparent
```

---

### `typographyColor`

Sets the color of section titles and descriptions. Accepts preset names or custom color values.

#### Presets

| Preset            | Title Color                 | Description Color           |
| ----------------- | --------------------------- | --------------------------- |
| `light` / `white` | `rgba(255, 255, 255, 0.95)` | `rgba(255, 255, 255, 0.75)` |
| `dark` / `black`  | `#111827`                   | `#6b7280`                   |

#### Custom Colors

You can also use custom color values in the following formats:

- **Hex colors**: `ff5500`, `abc` (without `#` prefix, 6-digit or 3-digit format)
- **RGB/RGBA**: `rgb(255,85,0)`, `rgba(255,85,0,0.9)`

When using a custom color, the description color is automatically derived with 80% opacity.

**Examples:**

```
?typographyColor=dark
?typographyColor=ff5500
?typographyColor=rgba(255,85,0,0.9)
```

---

### `sectionBgColor`

Sets the background color for all gallery sections. This is the base color that applies to all sections unless overridden by `sectionBgColorEven` or `sectionBgColorOdd`.

**Accepted values:**

- Hex colors: `f5f5f5`, `abc` (without `#` prefix)
- RGB/RGBA: `rgb(245,245,245)`, `rgba(245,245,245,0.9)`
- `transparent`

**Example:**

```
?sectionBgColor=f5f5f5
?sectionBgColor=rgba(245,245,245,0.9)
```

---

### `sectionBgColorEven`

Sets the background color specifically for even-numbered sections (2nd, 4th, 6th, etc.). Overrides `sectionBgColor` for even sections.

**Default:** `f9fafb` (light gray)

**Accepted values:**

- Hex colors: `ffffff`, `abc` (without `#` prefix)
- RGB/RGBA: `rgb(255,255,255)`, `rgba(255,255,255,0.9)`
- `transparent`

**Example:** White background for even sections

```
?sectionBgColorEven=ffffff
?sectionBgColorEven=rgba(255,255,255,0.9)
```

---

### `sectionBgColorOdd`

Sets the background color specifically for odd-numbered sections (1st, 3rd, 5th, etc.). Overrides `sectionBgColor` for odd sections.

**Default:** `transparent`

**Accepted values:**

- Hex colors: `e0f2fe`, `abc` (without `#` prefix)
- RGB/RGBA: `rgb(224,242,254)`, `rgba(224,242,254,0.9)`
- `transparent`

**Example:** Light blue background for odd sections

```
?sectionBgColorOdd=e0f2fe
?sectionBgColorOdd=rgba(224,242,254,0.9)
```

---

## Common Embedding Scenarios

### Embed in Other Websites with Transparent Backgrounds

Perfect for embedding galleries in other websites where you want the parent page's background to show through:

```
?background=transparent&headerImage=false
```

### Dynamically Adjust Colors to Match Parent Page Themes

Match your host site's color scheme by adjusting typography and section colors:

**For dark-themed websites:**

```
?background=transparent&typographyColor=light&sectionBgColor=transparent
```

**For light-themed websites:**

```
?background=transparent&typographyColor=dark&sectionBgColor=ffffff
```

**Match custom brand colors:**

```
?typographyColor=1e3a5f&sectionBgColorOdd=ffffff&sectionBgColorEven=f0f4f8
```

### Hide Header Images in Constrained Spaces

When embedding in limited vertical space, hide the hero section entirely:

```
?headerImage=false&background=transparent
```

Or reduce the hero height for a more compact view:

```
?heroHeight=50&background=transparent
```

### Full Customization Example

Combine multiple parameters for complete control:

```
?headerImage=false&background=transparent&typographyColor=dark&sectionBgColor=transparent
```

---

## Notes

- **Hex colors** must be specified without the `#` prefix (e.g., `ff5500`, not `#ff5500`)
- **RGB/RGBA colors** are supported for typography and section background colors (e.g., `rgba(255,85,0,0.9)`)
- Invalid parameter values are ignored, and defaults are used instead
- Parameters are case-sensitive for values (e.g., `transparent`, not `Transparent`)
- Multiple parameters are joined with `&`
