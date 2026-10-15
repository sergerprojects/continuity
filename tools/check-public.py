from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
site=root/'site'
assert {p.name for p in site.iterdir()}=={'index.html','app.js','styles.css','icon.svg','.nojekyll'}
text='\n'.join(p.read_text() for p in site.iterdir() if p.is_file())
for forbidden in ['@pm.me','/Users/','.private.json','MRN:','DOB:']:
    assert forbidden not in text, f'Private content marker: {forbidden}'
for forbidden in [r'\bfetch\s*\(',r'\bXMLHttpRequest\b',r'\bsendBeacon\b',r'\bWebSocket\b',r'\blocalStorage\b',r'\bsessionStorage\b',r'\bindexedDB\b',r'\bdocument\.cookie\b',r'https?://']:
    # SVG namespace is a format identifier, never a network dependency.
    searchable=text.replace('http://www.w3.org/2000/svg','')
    assert not re.search(forbidden,searchable), f'Unexpected network/storage capability: {forbidden}'
assert "connect-src 'none'" in (site/'index.html').read_text()
print('Public artifact: allowlisted viewer files only; no private markers, external URLs or network/storage APIs.')
