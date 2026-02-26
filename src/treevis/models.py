"""Data models for tree visualization."""

from dataclasses import dataclass
from typing import Any, Dict, List, Union


@dataclass
class TreeNode:
    """Represents a node in the tree."""
    name: str
    children: List['TreeNode']

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            "name": self.name,
            "children": [child.to_dict() for child in self.children]
        }


@dataclass
class FileItem:
    """Represents a file in the file list."""
    name: str
    data: Dict[str, Any]
    type: str  # 'default', 'file', 'pasted'

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "name": self.name,
            "data": self.data,
            "type": self.type
        }


# Default tree structure
DEFAULT_TREE = {
    "A": [
        {"B": [{"D": []}, {"E": []}]},
        {"C": [{"F": [{"H": []}, {"I": []}]}, {"G": []}]},
    ]
}
