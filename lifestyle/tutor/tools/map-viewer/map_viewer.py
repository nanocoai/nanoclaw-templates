#!/usr/bin/env python3
"""Tutor map viewer: renders a NanoClaw tutor agent's memory folder as a live concept graph.

Usage: python3 map_viewer.py <path-to-memory-folder> [port]
Then open http://127.0.0.1:<port>/ (default 8787). Stdlib only.
"""
import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

MEMORY = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "memory")
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8787
HERE = os.path.dirname(os.path.abspath(__file__))


def parse_frontmatter(text):
    """Minimal YAML front matter: scalars, [a, b] lists, and '- item' lists."""
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if not m:
        return {}, text
    fm, body = {}, m.group(2)
    key = None
    for line in m.group(1).splitlines():
        if re.match(r"^\s+-\s", line) and key:
            fm.setdefault(key, [])
            if not isinstance(fm[key], list):
                fm[key] = []
            fm[key].append(line.split("-", 1)[1].strip().strip('"'))
            continue
        mm = re.match(r"^([A-Za-z_]+):\s*(.*)$", line)
        if not mm:
            continue
        key, val = mm.group(1), mm.group(2).strip()
        if val.startswith("[") and val.endswith("]"):
            fm[key] = [v.strip().strip('"') for v in val[1:-1].split(",") if v.strip()]
        elif val == "":
            fm[key] = []
        else:
            fm[key] = val.strip('"')
    return fm, body


def sections(body):
    """Split a markdown body into {heading: [bullet lines]}."""
    out, cur = {}, None
    for line in body.splitlines():
        h = re.match(r"^##\s+(.*)$", line)
        if h:
            cur = h.group(1).strip()
            out[cur] = []
        elif cur and line.strip().startswith("- "):
            out[cur].append(line.strip()[2:])
    return out


def slug_from_link(link, subject):
    """'closures' -> ('python','closures'); '../math/induction' -> ('math','induction')."""
    link = link.strip().strip('"')
    link = re.sub(r"\.md$", "", link)
    if link.startswith("../"):
        parts = link[3:].split("/", 1)
        if len(parts) == 2:
            return parts[0], parts[1]
        return subject, parts[0]
    return subject, link.split("/")[-1]


def read(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return ""


def build_map():
    subjects_dir = os.path.join(MEMORY, "subjects")
    nodes, edges, subjects = [], [], []
    if os.path.isdir(subjects_dir):
        for s in sorted(os.listdir(subjects_dir)):
            sdir = os.path.join(subjects_dir, s)
            if not os.path.isdir(sdir):
                continue
            sfm, _ = parse_frontmatter(read(os.path.join(sdir, "index.md")))
            subjects.append({"slug": s, "title": sfm.get("title", s), "description": sfm.get("description", "")})
            for fn in sorted(os.listdir(sdir)):
                if not fn.endswith(".md") or fn == "index.md":
                    continue
                slug = fn[:-3]
                fm, body = parse_frontmatter(read(os.path.join(sdir, fn)))
                sec = sections(body)
                nid = f"{s}/{slug}"
                nodes.append({
                    "id": nid, "subject": s, "slug": slug,
                    "title": fm.get("title", slug.replace("-", " ")),
                    "status": fm.get("status", "untouched"),
                    "last_touched": fm.get("last_touched", ""),
                    "sources": fm.get("sources", []) if isinstance(fm.get("sources"), list) else [],
                    "got": sec.get("What they've got", []),
                    "threads": sec.get("Open threads", []),
                    "notes": sec.get("Notes", []),
                })
                for kind in ("prerequisites", "related"):
                    for link in fm.get(kind, []) or []:
                        ts, tslug = slug_from_link(link, s)
                        edges.append({"from": f"{ts}/{tslug}", "to": nid, "kind": kind})
    ids = {n["id"] for n in nodes}
    edges = [e for e in edges if e["from"] in ids and e["to"] in ids]
    # de-duplicate reverse 'related' pairs
    seen, clean = set(), []
    for e in edges:
        key = (e["kind"],) + tuple(sorted([e["from"], e["to"]])) if e["kind"] == "related" else (e["kind"], e["from"], e["to"])
        if key in seen:
            continue
        seen.add(key)
        clean.append(e)
    idx = read(os.path.join(MEMORY, "index.md"))
    where = ""
    m = re.search(r"Where we are:\s*(.*)", idx)
    if m:
        where = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", m.group(1)).strip()
    learner = ""
    m = re.search(r"Learner:\s*(.*)", idx)
    if m:
        learner = m.group(1).strip()
    return {"subjects": subjects, "nodes": nodes, "edges": clean, "where": where, "learner": learner}


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, code, ctype, data):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.startswith("/api/map"):
            self.send(200, "application/json", json.dumps(build_map()).encode())
        elif self.path.startswith("/api/file"):
            q = self.path.split("?", 1)[1] if "?" in self.path else ""
            rel = dict(p.split("=", 1) for p in q.split("&") if "=" in p).get("p", "")
            rel = rel.replace("%2F", "/")
            full = os.path.normpath(os.path.join(MEMORY, "subjects", rel + ".md"))
            if not full.startswith(MEMORY):
                return self.send(403, "text/plain", b"no")
            self.send(200, "text/plain; charset=utf-8", read(full).encode())
        else:
            self.send(200, "text/html; charset=utf-8", read(os.path.join(HERE, "index.html")).encode())


if __name__ == "__main__":
    print(f"Tutor map viewer: {MEMORY}\nhttp://127.0.0.1:{PORT}/")
    HTTPServer(("127.0.0.1", PORT), H).serve_forever()
