# Approved library QA

Run the dependency-free data checks from the project root:

```sh
python3 tests/validate_library.py
```

Optionally pass `--repdb /path/to/official/exercises.json` to verify every imported image path against RepDB's source record.

Build an isolated browser fixture:

```sh
python3 tests/validate_library.py --browser-fixture /private/tmp/motionfit-library-qa.html
```

Open that file in a browser, using a 390px mobile viewport for the layout checks. Inspect `document.querySelector('#qa-result').textContent` in the console after it finishes. A passing result is hidden to leave the routine available for visual inspection; failures appear above the app.

The fixture uses the real app JavaScript, HTML, CSS, local images and catalog, replacing only network catalog fetches with local fixtures. It exercises 200 generated sessions, all 55 live exercise presentations, image decoding/fallback, mode defaults, block limits, substitution, skip/restore, pause/resume, completion and browser-local history. It does not test service-worker updates or deployment networking. Run it in a temporary browser profile to isolate QA history from normal use.
