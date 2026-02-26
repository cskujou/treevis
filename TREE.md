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
│   └── app.js              # Frontend JavaScript
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

### `static/app.js`
- Frontend JavaScript application
- Tree rendering and visualization
- File upload handling
- Drag and drop support
- Keyboard navigation
- UI updates

### `templates/`
- Jinja2 HTML templates
- Component-based structure
- Reusable sidebar component
