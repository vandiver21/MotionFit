# MotionFit exercise images

Exercise images are optional local assets used in routine rows, substitutions and the live workout screen.

- Prefer optimized WebP files; PNG and JPEG also work when referenced by the exercise data.
- The V1 library preserves official RepDB filenames in `repdb/`; never construct source filenames from exercise IDs.
- Import `images.flat.start` / `peak` as `imageStart` / `imageEnd`, or `images.flat.main` as a single `imageStart`.
- Keep portrait-friendly crops, with the full body visible and a simple, high-contrast background.
- Add paths through `imageStart` and `imageEnd` in `data/exercises.json`, and record reusable mappings in `data/exercise-image-map.json`.

The app does not preload this folder. Missing or omitted images are hidden without interrupting a workout.

See [the V1 source audit](../../data/EXERCISE_SOURCES.md) for verified matches. Older assets remain for compatibility but are not referenced by the V1 catalog.

## RepDB attribution

Selected illustrations in this folder are from the RepDB free exercise dataset. Exercise data and images: [RepDB](https://repdb.co). See the project [LICENSES.md](../../LICENSES.md) for the applicable free-tier license terms.
