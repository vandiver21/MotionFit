"""Validate the curated data and optionally build an isolated browser QA fixture."""
import argparse
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APPROVED_IDS = '''cat-cow high-knees jumping-jacks bodyweight-good-morning half-kneeling-hip-flexor-rock bear-crawl bodyweight-squat goblet-squat sumo-squat bodyweight-reverse-lunge split-squat kettlebell-bulgarian-split-squat kettlebell-goblet-lunge step-ups glute-bridge glute-bridge-hold romanian-deadlift one-arm-single-leg-kettlebell-romanian-deadlift kettlebell-deadlift kettlebell-rotational-lunge knee-push-ups incline-push-ups push-up diamond-push-ups pike-push-ups one-arm-kettlebell-row one-arm-kettlebell-floor-press kettlebell-halo kettlebell-overhead-tricep-extension dead-bug bird-dog bird-dog-hold plank side-plank hollow-body-hold lying-leg-raise scissor-kicks kettlebell-russian-twist suitcase-carry mountain-climbers jump-squat burpees kettlebell-swing kettlebell-sumo-high-pull kettlebell-swing-clean pilates-spine-twist butterfly-stretch pigeon-stretch kneeling-hip-flexor-stretch camel-pose childs-pose cobra-stretch cross-body-shoulder-stretch overhead-triceps-stretch neck-side-stretch'''.split()
parser = argparse.ArgumentParser()
parser.add_argument('--repdb', type=Path, help='Optional official exercises.json to audit provenance')
parser.add_argument('--browser-fixture', type=Path)
args = parser.parse_args()
catalog = json.loads((ROOT / 'data/exercises.json').read_text())
image_map = json.loads((ROOT / 'data/exercise-image-map.json').read_text())
assert [e['id'] for e in catalog] == APPROVED_IDS
assert set(image_map) == set(APPROVED_IDS)
assert Counter(e['category'] for e in catalog) == dict(warmup=6, strength=23, core=10, conditioning=6, mobility=5, stretch=5)
images = set()
for e in catalog:
    assert e['equipment'] in ['bodyweight', 'kettlebell', 'bench', 'kettlebell_bench']
    assert e['level'] in [1, 2, 3] and e['defaultDuration'] == 30
    assert e['tags'] and set(e['tags']) <= {'general', 'golf', 'surf', 'golf_surf'}
    assert 6 <= len(e['instruction'].split()) <= 14 and e['muscles'] and e['name']
    assert (e['mode'] == 'time' and e['defaultReps'] is None) or (e['mode'] == 'reps' and 5 <= e['defaultReps'] <= 30)
    if e['category'] in ['warmup', 'conditioning', 'mobility', 'stretch'] or 'hold' in e['id'] or 'plank' in e['id']:
        assert e['mode'] == 'time' and e['defaultReps'] is None
    for field, key in [('imageStart', 'start'), ('imageEnd', 'end')]:
        path = e[field]
        assert path == image_map[e['id']][key]
        if path:
            assert path.startswith('assets/exercises/repdb/') and '..' not in path
            blob = (ROOT / path).read_bytes()
            assert blob[:4] == b'RIFF' and blob[8:12] == b'WEBP', path
            images.add(path)
for id in ['pike-push-ups','one-arm-single-leg-kettlebell-romanian-deadlift','burpees','kettlebell-sumo-high-pull','kettlebell-swing-clean']:
    assert next(e for e in catalog if e['id'] == id)['level'] == 3
assert {e['id'] for e in catalog if not e['imageStart']} == {'sumo-squat','romanian-deadlift'}
if args.repdb:
    source = {e['id']: e for e in json.loads(args.repdb.read_text())['exercises']}
    for e in catalog:
        if 'repdbId' not in e:
            continue
        flat = source[e['repdbId']]['images']['flat']
        for field, original in [('imageStart', flat.get('start') or flat.get('main')), ('imageEnd', flat.get('peak'))]:
            expected = 'assets/exercises/repdb/' + original.removeprefix('images/flat/') if original else ''
            assert e[field] == expected, e['id']
print(f'PASS: 55 approved exercises, {len(images)} valid WebP assets, schema, modes, cues, equipment, tags and source mappings')
if args.browser_fixture:
    fixtures = {'data/exercises.json': catalog, 'data/exercise-image-map.json': image_map}
    setup = '<script>window.testErrors=[];window.addEventListener("error",e=>{if(e.message)testErrors.push(e.message)});const fixtures='+json.dumps(fixtures)+';window.fetch=async p=>({ok:true,json:async()=>fixtures[p]});</script>'
    html = (ROOT / 'index.html').read_text().replace('<head>', '<head><base href="'+ROOT.as_uri()+'/">')
    html = html.replace('<script src="js/app.js"></script>', setup+'<script>'+(ROOT/'js/app.js').read_text()+'</script><script>'+(ROOT/'tests/library-qa.js').read_text()+'</script>')
    args.browser_fixture.write_text(html)
    print('Browser fixture:', args.browser_fixture)
