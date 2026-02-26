"""Tree Visualization Application - Main Entry Point.

This application provides an interactive web-based tree visualization tool
with support for batch file uploads, drag-and-drop, and keyboard navigation.
"""

import json
import webbrowser
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .models import DEFAULT_TREE
from .tree_parser import parse_tree

# Initialize FastAPI application
app = FastAPI(title="Tree Visualization Tool")

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize Jinja2 templates
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def get_tree(request: Request):
    """Serve the main tree visualization page."""
    # Parse the default tree into normalized format
    tree_data = parse_tree(DEFAULT_TREE)

    # Render the template with the tree data
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "title": "树结构可视化",
            "tree_data": tree_data
        }
    )


@app.post("/tree")
async def set_tree(request: Request):
    """Update the tree data dynamically via API."""
    try:
        data = await request.json()
        return {
            "success": True,
            "message": "Tree updated successfully",
            "data": parse_tree(data)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to update tree"
        }


def load_tree_from_file(file_path: str) -> dict:
    """Load tree data from a JSON file."""
    path = Path(file_path)
    if not path.exists():
        print(f"Error: File '{file_path}' not found.")
        return DEFAULT_TREE

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"Loaded tree from '{file_path}'")
        return data
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in '{file_path}': {e}")
        return DEFAULT_TREE
    except Exception as e:
        print(f"Error reading '{file_path}': {e}")
        return DEFAULT_TREE


def main():
    """Main entry point for the application."""
    import argparse

    parser = argparse.ArgumentParser(description="Tree visualization tool")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", "-p", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--no-browser", action="store_true", help="Don't automatically open browser")

    args = parser.parse_args()

    # Print startup message
    url = f"http://{args.host}:{args.port}"
    print(f"Starting tree visualization server at {url}")

    # Open browser if requested
    if not args.no_browser:
        webbrowser.open(url)

    # Start the server
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
