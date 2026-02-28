# Usage Guide

## Quick Start

```bash
# Install dependencies
uv sync

# Run the application
uv run python -m main
```

The application will automatically open in your browser at `http://127.0.0.1:8000`.

## Features

### 1. Upload JSON Files

Click on the upload area in the sidebar or drag and drop JSON files:
- Supports multiple files at once
- Files are added to the file list
- Automatically switches to the first new file

### 2. Paste JSON Data

Paste JSON directly into the text area and click "添加到列表":
- Useful for quick testing
- Automatically named with timestamp

### 3. Navigate Between Files

Use any of these methods:
- "上一个"/"下一个" buttons
- Click on a file in the list
- Keyboard: ← (previous), → (next)

### 4. Manage Files

- Click file name to view
- Hover and click × to remove
- Default tree can also be removed

### 5. Interactive Tree

- Click nodes to collapse/expand
- Smooth animations
- Connection lines update automatically
- Use zoom buttons (放大 / 缩小 / 重置)
- Mouse wheel on visualization area to zoom
- Hold `Space` and drag with left mouse button to pan

## JSON Format

### Format 1: Compact
```json
{
  "Root": [
    {"Child1": [{"GrandChild1": []}]},
    {"Child2": []}
  ]
}
```

### Format 2: Explicit
```json
{
  "name": "Root",
  "children": [
    {
      "name": "Child1",
      "children": [
        {"name": "GrandChild1", "children": []}
      ]
    }
  ]
}
```

## Command Line Options

```bash
# Show help
uv run python -m main --help

# Custom port
uv run python -m main --port 8080

# Don't open browser
uv run python -m main --no-browser

# Load initial file
uv run python -m main --file mytree.json

# Custom host
uv run python -m main --host 0.0.0.0 --port 8080
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ← (Left Arrow) | Previous file |
| → (Right Arrow) | Next file |
| Space + Drag | Pan tree viewport |
| Click node | Collapse/expand |

## Troubleshooting

### Port already in use
```bash
# Use a different port
uv run python -m main --port 8081
```

### Browser doesn't open
```bash
# Manually open http://127.0.0.1:8000
# Or use --no-browser and open manually
```

### Invalid JSON
Check your JSON syntax:
- Use double quotes for strings
- No trailing commas
- Valid Unicode characters

## Tips

1. **Batch Upload**: Select multiple files in the file picker
2. **Quick Test**: Paste simple JSON like `{"A": [{"B": []}]}`
3. **Navigation**: Use arrow keys for quick file switching
4. **Organization**: Remove files you don't need to keep the list clean
