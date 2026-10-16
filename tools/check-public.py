from pathlib import Path
import re,json,base64
root=Path(__file__).resolve().parents[1]
site=root/'site'
assert {p.name for p in site.iterdir()}=={'index.html','app.js','styles.css','icon.svg','.nojekyll','history.enc.json'}
envelope=json.loads((site/'history.enc.json').read_text())
assert set(envelope)=={'format','iterations','salt','iv','ciphertext'}
assert envelope['format']=='continuity-encrypted-v1' and envelope['iterations']==600000
assert len(base64.b64decode(envelope['salt'],validate=True))==16
assert len(base64.b64decode(envelope['iv'],validate=True))==12
assert len(base64.b64decode(envelope['ciphertext'],validate=True))>16
text='\n'.join(p.read_text() for p in site.iterdir() if p.is_file() and p.name!='history.enc.json')
for forbidden in ['@pm.me','/Users/','.private.json','MRN:','DOB:']:
    assert forbidden not in text, f'Private content marker: {forbidden}'
for forbidden in [r'\bXMLHttpRequest\b',r'\bsendBeacon\b',r'\bWebSocket\b',r'\blocalStorage\b',r'\bsessionStorage\b',r'\bindexedDB\b',r'\bdocument\.cookie\b',r'https?://']:
    assert not re.search(forbidden,text.replace('http://www.w3.org/2000/svg','')), f'Unexpected network/storage capability: {forbidden}'
assert re.findall(r"fetch\(([^,]+),",text)==["'history.enc.json'"]
assert "connect-src 'self'" in (site/'index.html').read_text()
print('Public boundary passed: encrypted envelope only, one same-site encrypted read, no external services or browser storage.')
