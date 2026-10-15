# Continuity

A small, static personal-history viewer for GitHub Pages. Open a private `continuity-v1` JSON file in the browser to view its timeline, source references, questions and printable doctor brief.

## Privacy

Only the viewer and fictional example belong in this repository. Real history files, medical records, screenshots and printouts stay outside Git. The app uses the File API to read the chosen file into tab memory. There are no uploads, remote fonts, trackers, network calls, cookies or browser-storage writes. A Content Security Policy blocks network connections. Refreshing or choosing Close history clears the loaded record. Printed or saved PDFs are private copies managed by the user.

Never add a real history file to this repository, GitHub Actions or a Pages artifact. `site/` is the entire publication boundary. A private repository alone does not make a Pages website private.

## Run

Run `python3 -m http.server 8765 --directory site` and open localhost:8765. No dependencies or build step.

## Publish

Deploy only `site/` with the included GitHub Pages workflow. `tools/check-public.py` checks the public file allowlist, network/storage APIs, and absence of known private-data markers. Real records are maintained separately in the owner's private vault.

## Print

Print my story uses the selected plain-English milestones and a short goal when the file supplies them. Older files keep their appointment brief. Print full history includes every event regardless of screen filters. The browser's own print command defaults to the short version. Disable browser headers/footers for the cleanest PDF.

## Story view

Files may supply storyTitle, story, storyDate and keyEvent on each event. Key events appear first; Show every event reveals the full clinical chronology and search includes the hidden events. Medical transcription remains available under each event. A storyBrief selects print milestones; storyGoal provides an explicit short goal, otherwise all questions are retained. Private standalone copies can embed the local data and viewer for offline use; these documents must remain outside this repository.
