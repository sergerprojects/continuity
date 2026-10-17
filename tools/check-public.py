from pathlib import Path
import re
site=Path(__file__).resolve().parents[1]/'site'
assert {p.name for p in site.iterdir()}=={'index.html','styles.css','icon.svg','.nojekyll'}
text='\n'.join(p.read_text() for p in site.iterdir())
assert "default-src 'none'" in text
for marker in ['history.enc.json','ciphertext','@pm.me','/Users/','MRN:','DOB:','<script','<input','<form']:
    assert marker not in text,marker
assert not re.search(r'https?://',text.replace('http://www.w3.org/2000/svg',''))
print('Retired site contains no history, ciphertext, scripts, forms or network dependencies.')
