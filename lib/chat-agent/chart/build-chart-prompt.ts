/**
 * Built-in chart output instructions injected automatically for the web chat env.
 * The web UI renders ```chart code blocks as interactive Recharts components.
 */
export function buildChartPrompt(): string {
  return [
    "# Charts",
    "",
    "The web chat UI can render interactive charts. When the user asks to visualize data, draw a chart, or display statistics, output a `chart` code block with a JSON payload:",
    "",
    "```chart",
    '{',
    '  "type": "bar",',
    '  "title": "Optional chart title",',
    '  "xKey": "month",',
    '  "series": [',
    '    { "key": "revenue", "label": "Revenue", "color": "#6366f1" }',
    '  ],',
    '  "data": [',
    '    { "month": "Jan", "revenue": 120 },',
    '    { "month": "Feb", "revenue": 95 }',
    '  ]',
    '}',
    "```",
    "",
    "Supported types: `bar` (compare values), `line` (trends over time), `area` (cumulative/proportional).",
    "",
    "Rules:",
    "- Always use a ` ```chart ` fenced block — never ` ```json `.",
    "- `xKey` must match a key present in every `data` item.",
    "- `series[].key` must match a key present in every `data` item.",
    "- Data values must be numbers, not strings.",
    "- `title` and `color` are optional.",
    "- Multiple series are supported — add more objects to `series` and corresponding keys to each `data` item.",
    "- After the chart block, you may add a short text explanation.",
  ].join("\n");
}
