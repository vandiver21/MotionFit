# MotionFit V1 exercise sources

Verified against the [official RepDB free catalog](https://github.com/RepDB/exercise-dataset/blob/main/exercises.json) on 2026-09-10 (schema 3, 601 records). This is the in-app 55-movement allowlist, not a redistribution of the source dataset. Spanish names are normalized from RepDB; short cues, categories, levels, defaults and sport tags are MotionFit editorial metadata.

Image paths are copied from each verified `images.flat` record, preserving the source filenames under `assets/exercises/repdb/`. `start` and `peak` map to `imageStart` and `imageEnd`; `main` maps to `imageStart` alone. Empty fields deliberately have no illustration. See [licenses](../LICENSES.md).

Equipment-specific matching:

- Good Morning uses `bodyweight-good-morning`, not the barbell entry.
- Reverse Lunge uses `bodyweight-reverse-lunge`, not the dumbbell entry.
- Single Leg Romanian Deadlift uses `one-arm-single-leg-kettlebell-romanian-deadlift` for the available single kettlebell.
- Kettlebell Floor Press uses `one-arm-kettlebell-floor-press`; the generic RepDB entry requires two kettlebells.
- Sumo Squat stays bodyweight. The exact RepDB entry requires a barbell; the dumbbell variation also differs from the available setup. No illustration is assigned.
- Romanian Deadlift uses one kettlebell in MotionFit. The exact RepDB entry uses a barbell and no reliable bilateral single-kettlebell RDL entry exists. No illustration is assigned.

Repetition targets for unilateral movements are per side, as stated in their cues. Timed unilateral movements switch sides halfway through the existing work interval. Holds have no rep target. The existing block-level format remains the only mode control; blocks of rep-preferred exercises start in Reps, mixed or timed blocks start in Tiempo. Generator work/rest timing defaults are unchanged.

| MotionFit ID | Verified RepDB ID | Source image schema |
| --- | --- | --- |
| cat-cow | cat-cow | main |
| high-knees | high-knees | main |
| jumping-jacks | jumping-jacks | start + peak |
| bodyweight-good-morning | bodyweight-good-morning | start + peak |
| half-kneeling-hip-flexor-rock | half-kneeling-hip-flexor-rock | start + peak |
| bear-crawl | bear-crawl | start + peak |
| bodyweight-squat | bodyweight-squat | start + peak |
| goblet-squat | goblet-squat | start + peak |
| sumo-squat | — | No compatible equipment match |
| bodyweight-reverse-lunge | bodyweight-reverse-lunge | start + peak |
| split-squat | split-squat | start + peak |
| kettlebell-bulgarian-split-squat | kettlebell-bulgarian-split-squat | start + peak |
| kettlebell-goblet-lunge | kettlebell-goblet-lunge | start + peak |
| step-ups | step-ups | start + peak |
| glute-bridge | glute-bridge | start + peak |
| glute-bridge-hold | glute-bridge-hold | main |
| romanian-deadlift | — | No compatible equipment match |
| one-arm-single-leg-kettlebell-romanian-deadlift | one-arm-single-leg-kettlebell-romanian-deadlift | start + peak |
| kettlebell-deadlift | kettlebell-deadlift | start + peak |
| kettlebell-rotational-lunge | kettlebell-rotational-lunge | start + peak |
| knee-push-ups | knee-push-ups | start + peak |
| incline-push-ups | incline-push-ups | start + peak |
| push-up | push-up | start + peak |
| diamond-push-ups | diamond-push-ups | start + peak |
| pike-push-ups | pike-push-ups | start + peak |
| one-arm-kettlebell-row | one-arm-kettlebell-row | start + peak |
| one-arm-kettlebell-floor-press | one-arm-kettlebell-floor-press | start + peak |
| kettlebell-halo | kettlebell-halo | start + peak |
| kettlebell-overhead-tricep-extension | kettlebell-overhead-tricep-extension | start + peak |
| dead-bug | dead-bug | start + peak |
| bird-dog | bird-dog | start + peak |
| bird-dog-hold | bird-dog-hold | main |
| plank | plank | main |
| side-plank | side-plank | main |
| hollow-body-hold | hollow-body-hold | main |
| lying-leg-raise | lying-leg-raise | start + peak |
| scissor-kicks | scissor-kicks | start + peak |
| kettlebell-russian-twist | kettlebell-russian-twist | start + peak |
| suitcase-carry | suitcase-carry | main |
| mountain-climbers | mountain-climbers | start + peak |
| jump-squat | jump-squat | start + peak |
| burpees | burpees | main |
| kettlebell-swing | kettlebell-swing | start + peak |
| kettlebell-sumo-high-pull | kettlebell-sumo-high-pull | start + peak |
| kettlebell-swing-clean | kettlebell-swing-clean | start + peak |
| pilates-spine-twist | pilates-spine-twist | start + peak |
| butterfly-stretch | butterfly-stretch | main |
| pigeon-stretch | pigeon-stretch | main |
| kneeling-hip-flexor-stretch | kneeling-hip-flexor-stretch | main |
| camel-pose | camel-pose | main |
| childs-pose | childs-pose | main |
| cobra-stretch | cobra-stretch | main |
| cross-body-shoulder-stretch | cross-body-shoulder-stretch | main |
| overhead-triceps-stretch | overhead-triceps-stretch | main |
| neck-side-stretch | neck-side-stretch | main |
