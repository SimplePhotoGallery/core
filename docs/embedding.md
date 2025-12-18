# Embedding

When embedding the Simple Photo Gallery in another website (e.g., via an `iframe` tag), you can customize its appearance using URL query string parameters. This allows the gallery to blend seamlessly with your host site's design.

## Basic Embedding

To embed the gallery, use an iframe pointing to your gallery URL:

```html
<iframe src="https://your-gallery-url.com/" width="100%" height="800" frameborder="0" allowfullscreen></iframe>
```

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

You can also use any valid CSS color value:

- Hex: `ff5500`, `#ff5500`, `abc`, `#abc`
- CSS color names: `red`, `coral`, `steelblue`
- RGB/RGBA: `rgb(255,85,0)`, `rgba(255,85,0,0.9)`

When using a custom color, the description color is automatically derived with 80% opacity.

**Examples:**

```
?typographyColor=dark
?typographyColor=ff5500
?typographyColor=steelblue
```

---

### `sectionBgColor`

Sets the background color for all gallery sections. This is the base color that applies to all sections unless overridden by `sectionBgColorEven` or `sectionBgColorOdd`.

**Accepted values:** Any valid CSS color (hex, color names, rgb/rgba, `transparent`)

**Example:**

```
?sectionBgColor=f5f5f5
```

---

### `sectionBgColorEven`

Sets the background color specifically for even-numbered sections (2nd, 4th, 6th, etc.). Overrides `sectionBgColor` for even sections.

**Default:** `#f9fafb` (light gray)

**Example:** White background for even sections

```
?sectionBgColorEven=ffffff
```

---

### `sectionBgColorOdd`

Sets the background color specifically for odd-numbered sections (1st, 3rd, 5th, etc.). Overrides `sectionBgColor` for odd sections.

**Default:** `transparent`

**Example:** Light blue background for odd sections

```
?sectionBgColorOdd=e0f2fe
```

---

## Common Embedding Scenarios

### Minimal Embed (No Hero, Transparent Background)

Perfect for embedding as a component within another page:

```
?headerImage=false&background=transparent
```

### Dark Theme Integration

For embedding in a dark-themed website:

```
?background=transparent&typographyColor=light&sectionBgColor=transparent
```

### Custom Brand Colors

Match your brand colors:

```
?typographyColor=1e3a5f&sectionBgColorOdd=ffffff&sectionBgColorEven=f0f4f8
```

### Compact Header

Show hero but at reduced height:

```
?heroHeight=50
```

### Full Customization Example

```
?headerImage=false&background=transparent&typographyColor=dark&sectionBgColor=transparent
```

---

## Notes

- All color values can be specified with or without the `#` prefix (e.g., `ff5500` or `#ff5500`)
- Invalid parameter values are ignored, and defaults are used instead
- Parameters are case-sensitive for values (e.g., `transparent`, not `Transparent`)
- Multiple parameters are joined with `&`
