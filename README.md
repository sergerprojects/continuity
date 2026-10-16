# Continuity

A lightweight personal history viewer with a phone-friendly unlock screen and printable plain-English story.

Only `site/` is deployed to GitHub Pages. The hosted history is encrypted using AES-256-GCM and a strong random passphrase, with PBKDF2-SHA256 (600,000 iterations). The passphrase is kept separately in the owner's private iCloud guide. It is never included in Git, the deployed site, or the knowledge vault.

Open the site in Safari or Chrome, enter the passphrase, and tap Unlock my story. Print my story produces the short patient handout; Print full history retains the medical chronology and source references. File import and a fictional example remain available.

Decryption happens in the browser. No tracking, external fonts, server accounts, or browser storage. Lock history or refresh to clear the unlocked page. Anyone with both the passphrase and encrypted snapshot can read it. Previously downloaded encrypted snapshots remain decryptable with their corresponding passphrase.

For updates, regenerate the encrypted snapshot through the private local workflow. Keep originals, JSON, guides, passphrases, screenshots, and PDFs outside Git. Publish only the encrypted envelope and generic viewer.

Checks: `python3 tools/check-public.py`, `node --check site/app.js`, browser unlock/wrong-passphrase/lock/print/mobile checks, and Codex review.
