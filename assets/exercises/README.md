# MotionFit exercise images

Exercise images are optional local assets used only on the live workout screen.

- Prefer optimized WebP files; PNG and JPEG also work when referenced by the exercise data.
- Use lowercase, underscore-separated filenames: `push_up_start.webp` and `push_up_end.webp`.
- Use matching `*_start` and `*_end` images for the opening and closing positions.
- Keep portrait-friendly crops, with the full body visible and a simple, high-contrast background.
- Add paths through `imageStart` and `imageEnd` in `data/exercises.json`, and record reusable mappings in `data/exercise-image-map.json`.

The app does not preload this folder. Missing or omitted images are hidden without interrupting a workout.

## RepDB attribution

Selected illustrations in this folder are from the RepDB free exercise dataset. Exercise data and images: [RepDB](https://repdb.co). See the project [LICENSES.md](../../LICENSES.md) for the applicable free-tier license terms.
