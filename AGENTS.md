# Continuity

This is a static browser-local history viewer. Only site/ is deployed. The user approved a strong-passphrase encrypted snapshot for phone access; history.enc.json may contain only the encrypted envelope, never plaintext or the passphrase.
Never add private history files, patient information, screenshots, browser snapshots or PDFs to Git.
When asked to review this repository, perform the review directly and report actionable findings. Do not invoke another reviewer or run codex review from inside a review: that would recurse. Check file import, text escaping, privacy, printing, and mobile layout. Run tools/check-public.py for the public boundary.
