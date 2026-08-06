# Design system

Reference for shared UI primitives. Visual examples live at `/dev/demo-ui`.

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