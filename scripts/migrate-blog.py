#!/usr/bin/env python3
"""One-off migration: Squarespace post JSON -> Markdown content entries.

Usage: migrate-blog.py <dir-with-json> <out-dir>
Images embedded in post bodies are NOT migrated (rights unconfirmed); they are listed on stderr.
"""
import html, json, re, sys, glob, os
from datetime import datetime
from zoneinfo import ZoneInfo
from html.parser import HTMLParser


class MD(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.list_stack, self.href, self.bq, self.in_li = [], [], None, 0, 0
        self.skipped = []

    def emit(self, s):
        self.out.append(s)

    def handle_starttag(self, tag, a):
        a = dict(a)
        if tag in ("strong", "b"):
            self.emit("**")
        elif tag in ("em", "i"):
            self.emit("*")
        elif tag == "br":
            self.emit("  \n")
        elif tag in ("ul", "ol"):
            self.list_stack.append([tag, 0])
            self.emit("\n\n")
        elif tag == "li":
            kind = self.list_stack[-1]
            kind[1] += 1
            marker = f"{kind[1]}. " if kind[0] == "ol" else "- "
            self.in_li += 1
            self.emit("\n" + marker)
        elif tag == "blockquote":
            self.bq += 1
            self.emit("\n\n> ")
        elif tag == "p":
            if not self.in_li:
                self.emit("\n\n" + ("> " if self.bq else ""))
        elif re.fullmatch(r"h[1-6]", tag):
            # h1 is reserved for the post title, so demote everything one level
            lvl = min(int(tag[1]) + 1, 6)
            self.emit("\n\n" + "#" * lvl + " ")
        elif tag == "a" and a.get("href"):
            self.href = a["href"]
            self.emit("[")
        elif tag == "img":
            self.skipped.append(a.get("data-src") or a.get("src") or "?")

    def handle_endtag(self, tag):
        if tag in ("strong", "b"):
            self.emit("**")
        elif tag in ("em", "i"):
            self.emit("*")
        elif tag == "li":
            self.in_li -= 1
        elif tag in ("ul", "ol"):
            self.list_stack.pop()
            self.emit("\n\n")
        elif tag == "blockquote":
            self.bq -= 1
            self.emit("\n\n")
        elif tag == "a" and self.href:
            self.emit(f"]({self.href})")
            self.href = None
        elif re.fullmatch(r"h[1-6]", tag):
            self.emit("\n\n")

    def handle_data(self, d):
        d = d.replace("\xa0", " ")
        if d.strip() == "" and "\n" in d:
            return
        self.emit(d)


def tidy(md):
    md = re.sub(r"\*\*\s*\*\*|\*\s+\*(?!\*)", " ", md)          # empty emphasis
    md = re.sub(r"(\*{1,3})([^*\n]*?\S)([ \t]+)\1", r"\1\2\1\3", md)  # trailing space inside emphasis
    md = re.sub(r"(\*{1,3})([ \t]+)([^*\n]*?\S)\1", r"\2\1\3\1", md)  # leading space inside emphasis
    md = re.sub(r"[ \t]+\n", "\n", md)
    md = re.sub(r"\n{3,}", "\n\n", md)
    md = re.sub(r"^> *\n", "", md, flags=re.M)
    return md.strip() + "\n"


def yaml_str(s):
    return json.dumps(s, ensure_ascii=False)


src, out = sys.argv[1], sys.argv[2]
for f in sorted(glob.glob(os.path.join(src, "*.json"))):
    it = json.load(open(f))["item"]
    p = MD()
    body = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", it["body"], flags=re.S)
    p.feed(body)
    md = tidy("".join(p.out))
    when = datetime.fromtimestamp(it["publishOn"] / 1000, tz=ZoneInfo("America/Los_Angeles"))
    url_id = it["urlId"]
    slug = url_id.split("/")[-1]
    slug_short = slug if len(slug) < 60 else slug[:60].rsplit("-", 1)[0]
    excerpt = re.sub(r"<[^>]+>", " ", it.get("excerpt") or "")
    excerpt = re.sub(r"\s+", " ", html.unescape(excerpt)).strip()
    fm = [
        "---",
        f"title: {yaml_str(html.unescape(it['title']).strip())}",
        f"date: {when.date().isoformat()}",
        f"path: {yaml_str(url_id)}",
        f"excerpt: {yaml_str(excerpt)}",
        "tags: " + json.dumps(it.get("tags") or [], ensure_ascii=False),
        "---",
        "",
    ]
    name = f"{when.date().isoformat()}-{slug_short}.md"
    open(os.path.join(out, name), "w").write("\n".join(fm) + md)
    print(name, len(md), "chars", file=sys.stderr)
    for s in p.skipped:
        print("   skipped image:", s, file=sys.stderr)
