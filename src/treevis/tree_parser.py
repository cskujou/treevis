"""Tree parsing utilities."""

from typing import Any, Dict, Union


def parse_tree(data: Any) -> Dict[str, Any]:
    """Convert various tree formats to normalized dict format.

    Supports formats:
    - {name: str, children: list}
    - {key: [children]}
    - Primitive values (converted to leaf node)

    Returns normalized format: {name: str, children: [child, ...]}
    """
    if isinstance(data, dict):
        # Already in normalized format
        if "name" in data:
            children = data.get("children", [])
            return {
                "name": data["name"],
                "children": [parse_tree(c) for c in children],
            }

        # Format: {"key": [children]}
        for key, value in data.items():
            children = value if isinstance(value, list) else [value]
            return {"name": key, "children": [parse_tree(c) for c in children]}

    # Primitive value - create leaf node
    return {"name": str(data), "children": []}


def parse_tree_data(data: Any) -> Dict[str, Any]:
    """JavaScript-compatible version for frontend use.

    This is the same as parse_tree but with a name that matches
    the JavaScript implementation.
    """
    return parse_tree(data)


def tree_to_json(tree: Dict[str, Any]) -> str:
    """Convert tree to JSON string."""
    import json
    return json.dumps(tree, ensure_ascii=False, indent=2)
