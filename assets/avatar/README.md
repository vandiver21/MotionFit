# MotionFit rigged avatar asset

Place the production model at `assets/avatar/motionfit-athlete.glb`.

Use a clean, low-poly, neutral athletic humanoid with a `SkinnedMesh` and common humanoid bones: hips/pelvis, spine, chest, neck, head, shoulders, upper arms, forearms, hands, thighs, shins, and feet. Names such as `Hips`, `Spine`, `Chest`, `LeftUpperArm`, `LeftForeArm`, `LeftUpLeg`, and `LeftLeg` are mapped automatically.

Keep the GLB lightweight and texture-free where possible. A bind-pose model works: MotionFit applies temporary skeletal procedural exercise motion. Optional embedded clips can use keys such as `squat`, `gobletSquat`, `lunge`, `pushup`, `pikePushup`, `catCow`, `birdDog`, `deadBug`, `stretch`, and `armCircles`.

The primitive Three.js renderer is a development fallback only, not the final production demonstrator.
