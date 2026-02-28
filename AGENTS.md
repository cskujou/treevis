# AGENTS.md

This file provides guidance to CodeX when working with code in this repository.

## Project Overview

A web-based tree visualization tool that supports general tree structures (not just binary trees). The tree is defined in JSON format where each node is a key and its children are represented as a list.

Current UI capabilities include:
- Uploading multiple JSON files
- Pasting JSON directly
- File list management (remove entries, including default tree)
- File sorting (`manual`, `name`, `time`)
- Drag-and-drop reorder in manual sort mode
- Empty-state prompt when no tree data exists
- Visual/JSON dual view
- Tree zoom controls (`+`, `-`, reset)
- Mouse wheel zoom in visualization area
- `Space` + drag panning in visualization area

## Development Commands

Run the development server:
```bash
uv run treevis
```

Add dependencies:
```bash
uv add <package-name>
```

Sync dependencies:
```bash
uv sync
```

## Project Structure

For detailed project structure and module responsibilities, please refer to the [TREE.md](TREE.md) file.

## Tree Data Format

The tree uses a JSON format where each node is a key and children are in a list:

```json
{
  "Root": [
    {"Child1": [{"GrandChild1": []}, {"GrandChild2": []}]},
    {"Child2": []}
  ]
}
```

Rules:
- Each node is a key-value pair where the key is the node name and the value is a list of children
- Empty list `[]` indicates a leaf node (no children)
- Children are themselves objects with the same structure

## Architecture

- **Backend**: FastAPI serves a single-page application
- **Tree Parsing**: `parse_tree()` in `src/treevis/tree_parser.py` normalizes input to `{name, children[]}`
- **Frontend entry**: `static/app.js` (legacy global API bridge)
- **Frontend modules**: `static/js/state.js`, `static/js/tree.js`, `static/js/files.js`, `static/js/ui.js`
- **Templating**: `templates/index.html` + `templates/components/sidebar.html`
- **Interactivity**: click handlers toggle `hidden`/`collapsed` classes; keyboard left/right switches files
- **Styling**: `static/styles.css` uses flex layout, gradients, and SVG connector lines

The visualization uses flexbox for the tree layout, CSS gradients for node styling, and SVG bezier curves for drawing smooth, natural-looking connection lines between parent and child nodes.

## Key Implementation Details

- `loadNewTree()` in `static/js/tree.js` renders the tree; `renderEmptyState()` handles no-data state
- `updateFileListUI()` in `static/js/files.js` renders the sidebar list and binds remove/drag handlers
- `applySort()` in `static/js/files.js` supports list sorting modes (`manual`, `name`, `time`)
- Drag reorder is enabled only when sort mode is `manual`
- `buildTree()` in `static/js/tree.js` recursively creates DOM elements from parsed tree data
- Collapsed nodes show a visual indicator (`+` badge) and connector lines are redrawn dynamically
