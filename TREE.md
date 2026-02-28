# Project Structure

```
treevis/
├── __init__.py              # Package initialization
├── main.py                  # FastAPI application entry point
├── models.py                # Data models (TreeNode, FileItem)
├── tree_parser.py           # Tree parsing utilities
├── run.sh                   # Convenience script to run the app
├── pyproject.toml           # Project dependencies and metadata
├── example_tree.json        # Example tree data
│
├── static/                  # Static assets
│   ├── styles.css          # All CSS styles
│   ├── app.js              # Thin frontend entry and legacy global API bridge
│   └── js/
│       ├── state.js        # Shared state, constants, helpers, message API
│       ├── tree.js         # Tree parsing/rendering, connector lines, zoom controls
│       ├── files.js        # File list CRUD, upload/paste, sorting, drag reorder
│       └── ui.js           # View switching, keyboard/drag-drop, pan/wheel interactions
│
├── templates/               # Jinja2 HTML templates
│   ├── index.html          # Main page template
│   └── components/
│       └── sidebar.html    # Sidebar component
│
└── README.md               # Project documentation
```

## Module Responsibilities

### `main.py`
- FastAPI application setup
- Route handlers (GET /, POST /tree)
- Template rendering with Jinja2
- Static file serving
- Command-line interface

### `models.py`
- Data class definitions
- `TreeNode`: Represents a node in the tree
- `FileItem`: Represents a file in the file list
- `DEFAULT_TREE`: Default tree structure

### `tree_parser.py`
- `parse_tree()`: Converts various tree formats to normalized format
- `tree_to_json()`: Converts tree to JSON string
- Supports multiple input formats

### `static/styles.css`
- All CSS styles for the application
- Layout styles (sidebar, main content)
- Tree node styling
- Interactive states (hover, active, collapsed)

### Frontend (`static/app.js` + `static/js/*.js`)
- `static/app.js`: lightweight compatibility layer exposing global handlers used by template `onclick`/`onchange`
- `static/js/state.js`: centralized runtime state, constants, utility functions, success/error messaging
- `static/js/tree.js`: tree lifecycle (`loadNewTree`, `renderEmptyState`), recursive DOM rendering, SVG line drawing, zoom controls
- `static/js/files.js`: file entry model, list rendering, upload/paste parsing, sort modes, manual drag reorder, navigation
- `static/js/ui.js`: UI wiring (visual/json mode, input mode), keyboard navigation, drag-and-drop import, wheel zoom and space-drag panning

### `templates/`
- Jinja2 HTML templates
- Component-based structure
- Reusable sidebar component

## Recent Frontend Changes

- Refactored monolithic `static/app.js` into modular `static/js/` files while keeping old global API signatures for backward compatibility.
- Fixed large-tree viewport behavior so full horizontal range can be scrolled and left-most nodes stay reachable.
- Added tree zoom controls (zoom in / zoom out / reset), with connector lines recalculated correctly at non-100% zoom.
- Added viewport gestures:
  - mouse wheel zoom inside the visualization area
  - hold `Space` + left drag to pan horizontally and vertically
