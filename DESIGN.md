# Design system

Reference for shared UI primitives. Visual examples live at `/dev/demo-ui`.

Theme tokens are defined in `app/globals.css` and exposed to Tailwind via `@theme inline`.

## Color tokens

Use semantic tokens — not raw hex or Tailwind gray scales — for app surfaces and text.

| Token | Light usage | Dark usage |
| ----- | ----------- | ---------- |
| `background` | Main canvas / page fill (off-white) | Deep charcoal page fill |
| `foreground` | Primary text, headings | Primary text |
| `card` | Elevated panels, assistant cards, composer | Elevated panels |
| `card-foreground` | Text on cards | Text on cards |
| `popover` | Dropdowns, menus, workspace switcher | Dropdowns, menus |
| `primary` | Primary buttons, send action, logo mark | Inverted primary actions |
| `primary-foreground` | Text/icons on primary | Text/icons on primary |
| `secondary` | Low-emphasis fills, chip backgrounds | Muted fills |
| `muted` | Hover surfaces, subtle sections | Hover surfaces |
| `muted-foreground` | Placeholders, subtitles, section labels | Secondary text |
| `accent` | List item hover in navigation | List item hover |
| `border` | Card borders, dividers, input outlines | Subtle borders |
| `input` | Input borders and unchecked controls | Input borders |
| `sidebar` | Left navigation rail background | Sidebar background |
| `sidebar-foreground` | Sidebar labels and icons | Sidebar labels |
| `sidebar-accent` | Active / hovered nav item | Active / hovered nav item |
| `sidebar-border` | Sidebar separators | Sidebar separators |
| `destructive` | Delete, error states | Delete, error states |

### Usage rules

- **Page layout:** `bg-background` for main content; `bg-sidebar` for the navigation rail.
- **Cards & composer:** `bg-card` with `border-border` or `ring-foreground/10` — never `bg-background` on elevated UI.
- **Hierarchy:** `text-foreground` for titles; `text-muted-foreground` for descriptions, timestamps, and section headers.
- **Actions:** one `primary` button per focused surface (e.g. send, new chat). Secondary actions use `outline`, `secondary`, or `ghost`.
- **Accent avatars & tool chips:** use Tailwind palette utilities (`bg-*-100 text-*-700`) only for decorative avatar/tool colors — not for structural surfaces.
- **Dark mode:** toggled via `class="dark"` on `<html>` (managed by `ThemeProvider`). Prefer tokens over `dark:` overrides on structural colors.

Source components:

- Button — `components/ui/button.tsx`
- Badge — `components/ui/badge.tsx`

## Button

Component: `Button` from `@/components/ui/button`

Default props: `variant="default"`, `size="default"`

### Variants

| Variant | Prop value | Notes |
| ------- | ---------- | ----- |
| Default | `default` | Primary filled action. |
| Outline | `outline` | Bordered, neutral background. |
| Secondary | `secondary` | Muted filled action. |
| Ghost | `ghost` | No background until hover. |
| Destructive | `destructive` | Dangerous or irreversible actions. |
| Link | `link` | Text-style, underline on hover. |

### Sizes

| Size | Prop value | Notes |
| ---- | ---------- | ----- |
| Extra small | `xs` | Compact text button. |
| Small | `sm` | Dense UI, forms, toolbars. |
| Default | `default` | Standard control height. |
| Large | `lg` | Emphasized actions. |
| Icon extra small | `icon-xs` | Square icon-only. |
| Icon small | `icon-sm` | Square icon-only. |
| Icon | `icon` | Square icon-only, default icon size. |
| Icon large | `icon-lg` | Square icon-only, larger hit target. |

### Usage rules

| Variant | When to use |
| ------- | ----------- |
| **Default** | Primary actions: create, edit, update, save, submit. |
| **Destructive** | Actions that remove or retire data: delete, archive. |
| **Outline / Secondary / Ghost** | Secondary or low-emphasis actions on the same surface (cancel, filter, toggle). |
| **Link** | Inline navigation or tertiary actions inside text. |

One primary **default** button per form or dialog footer. Pair destructive actions with a neutral cancel when confirmation is needed.

## Badge

Component: `Badge` from `@/components/ui/badge`

Default props: `variant="default"`

### Variants

| Variant | Prop value | Notes |
| ------- | ---------- | ----- |
| Default | `default` | Primary emphasis label. |
| Secondary | `secondary` | Muted label on secondary surface. |
| Destructive | `destructive` | Error, danger, or blocked state. |
| Active | `active` | Live or enabled record. |
| Warning | `warning` | Sensitive or publicly exposed data. |
| Outline | `outline` | Bordered, neutral label. |
| Ghost | `ghost` | Minimal label, hover surface only. |
| Link | `link` | Text-style, underline on hover. |

### Usage rules

| Variant | When to use |
| ------- | ----------- |
| **Active** | Data that is currently active or enabled. |
| **Warning** | Data that is fragile or publicly shared (e.g. public visibility, exposed secrets). |
| **Destructive** | Failed, blocked, or error states. |
| **Default / Secondary / Outline** | Status tags, counts, and categories that are not active/warning/danger. |