#!/usr/bin/env python3
import re

with open('crm/qualification-roadmap.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace smart quotes with straight quotes
content = content.replace('‘', "'")  # left single quote
content = content.replace('’', "'")  # right single quote / apostrophe
content = content.replace('“', '"')  # left double quote
content = content.replace('”', '"')  # right double quote

# Escape apostrophes in contractions (word'word pattern)
content = re.sub(r"([a-zA-Z])'([a-zA-Z])", r"\1\\'\2", content)

with open('crm/qualification-roadmap.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed all smart quotes")
