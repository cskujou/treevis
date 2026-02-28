#!/usr/bin/env python3
"""Synchronize AGENTS.md and CLAUDE.md body content.

Behavior:
- Preserve each file's own preamble (title + intro text before first `##` heading).
- Synchronize the markdown body (from first `##` onward) from the newest source.
- Source selection:
  - `auto` (default): pick file with newer mtime.
  - `agents`: force AGENTS.md as source body.
  - `claude`: force CLAUDE.md as source body.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
import sys


@dataclass(frozen=True)
class Sections:
    preamble: str
    body: str


def split_sections(text: str, path: Path) -> Sections:
    lines = text.splitlines(keepends=True)
    for idx, line in enumerate(lines):
        if line.startswith("## "):
            preamble = "".join(lines[:idx]).rstrip() + "\n\n"
            body = "".join(lines[idx:]).rstrip() + "\n"
            return Sections(preamble=preamble, body=body)
    raise ValueError(f"{path} is missing a level-2 heading (`## ...`).")


def choose_source(mode: str, agents: Path, claude: Path) -> Path:
    if mode == "agents":
        return agents
    if mode == "claude":
        return claude

    # auto
    agents_mtime = agents.stat().st_mtime
    claude_mtime = claude.stat().st_mtime
    if agents_mtime >= claude_mtime:
        return agents
    return claude


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync AGENTS.md and CLAUDE.md body content.")
    parser.add_argument(
        "--source",
        choices=("auto", "agents", "claude"),
        default="auto",
        help="Choose source body. Default: auto (newest mtime).",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check mode: exit 1 if changes would be made, without writing files.",
    )
    parser.add_argument(
        "--root",
        default=".",
        help="Repository root containing AGENTS.md and CLAUDE.md (default: current dir).",
    )
    args = parser.parse_args()

    root = Path(args.root).resolve()
    agents = root / "AGENTS.md"
    claude = root / "CLAUDE.md"

    for path in (agents, claude):
        if not path.exists():
            print(f"Missing file: {path}", file=sys.stderr)
            return 2

    agents_sections = split_sections(agents.read_text(encoding="utf-8"), agents)
    claude_sections = split_sections(claude.read_text(encoding="utf-8"), claude)

    source = choose_source(args.source, agents, claude)
    source_body = agents_sections.body if source == agents else claude_sections.body

    new_agents = agents_sections.preamble + source_body
    new_claude = claude_sections.preamble + source_body

    changed_agents = new_agents != agents.read_text(encoding="utf-8")
    changed_claude = new_claude != claude.read_text(encoding="utf-8")

    if args.check:
        if changed_agents or changed_claude:
            print("Out of sync: AGENTS.md and/or CLAUDE.md would be updated.")
            return 1
        print("In sync.")
        return 0

    if changed_agents:
        agents.write_text(new_agents, encoding="utf-8")
    if changed_claude:
        claude.write_text(new_claude, encoding="utf-8")

    changed = []
    if changed_agents:
        changed.append("AGENTS.md")
    if changed_claude:
        changed.append("CLAUDE.md")

    if changed:
        print(f"Synchronized from {source.name}: {', '.join(changed)}")
    else:
        print("No changes needed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
