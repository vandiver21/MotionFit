const timeSlider = document.getElementById("timeSlider");
const timeValue = document.getElementById("timeValue");

const pill = document.getElementById("pill");
const title = document.getElementById("workoutTitle");
const desc = document.getElementById("workoutDesc");

const energyButtons = document.querySelectorAll(".energy");
const energyLabel = document.getElementById("energyLabel");

let energy = 3;

const labels = [
  "Recuperación",
  "Ligero",
  "Normal",
  "Fuerte",
  "Máximo"
];

function updateWorkout(duration){

  pill.textContent = `${duration} MIN`;

  if(duration == 20){
    title.textContent = "Express Foundation";
    desc.textContent =
      "Warm-up · 1 superserie · Core · Stretch";
  }

  if(duration == 30){
    title.textContent = "Full Body Foundation";
    desc.textContent =
      "Warm-up · 2 superseries · Core · Stretch";
  }

  if(duration == 40){
    title.textContent = "Foundation Completo";
    desc.textContent =
      "Warm-up · Fuerza · HIIT · Core · Stretch";
  }

  if(duration == 50){
    title.textContent = "Foundation Performance";
    desc.textContent =
      "Incluye bloque explosivo y potencia";
  }

}

timeSlider.addEventListener("input",()=>{

  const value = timeSlider.value;

  timeValue.textContent = `${value} min`;

  updateWorkout(value);

});

energyButtons.forEach(btn=>{

  btn.addEventListener("click",()=>{

    energyButtons.forEach(b=>b.classList.remove("active"));

    btn.classList.add("active");

    energy = Number(btn.dataset.energy);

    energyLabel.textContent = labels[energy-1];

  });

});

updateWorkout(30);
const coachScreen = document.getElementById("coachScreen");
const routineScreen = document.getElementById("routineScreen");

const generateBtn = document.getElementById("generateBtn");
const backBtn = document.getElementById("backBtn");

const durationBadge = document.getElementById("durationBadge");
const warmupTime = document.getElementById("warmupTime");
const coreTime = document.getElementById("coreTime");
const routineTitle = document.getElementById("routineTitle");
const startWorkoutBtn = document.getElementById("startWorkoutBtn");
const workoutScreen = document.getElementById("workoutScreen");
const workoutBackBtn = document.getElementById("workoutBackBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const finishWorkoutBtn = document.getElementById("finishWorkoutBtn");
const workoutPhase = document.getElementById("workoutPhase");
const exerciseInfo = document.querySelector(".exerciseInfo");
const exerciseName = document.getElementById("exerciseName");
const nextExercise = document.getElementById("nextExercise");
const timerValue = document.getElementById("timerValue");
const timerStatus = document.getElementById("timerStatus");
const timerProgress = document.getElementById("timerProgress");
const exerciseVisualArea = document.getElementById("exerciseVisualArea");
const exerciseVisualStart = document.getElementById("exerciseVisualStart");
const exerciseVisualEnd = document.getElementById("exerciseVisualEnd");
const exerciseImageStart = document.getElementById("exerciseImageStart");
const exerciseImageEnd = document.getElementById("exerciseImageEnd");
const exerciseInstruction = document.getElementById("exerciseInstruction");
const routineCard = document.querySelector(".routineCard");
const replaceModal = document.getElementById("replaceModal");
const closeReplaceModal = document.getElementById("closeReplaceModal");
const replaceModalDescription = document.getElementById("replaceModalDescription");
const replacementOptions = document.getElementById("replacementOptions");
const blockSettingsModal = document.getElementById("blockSettingsModal");
const blockSettingsTitle = document.getElementById("blockSettingsTitle");
const blockSettingsContent = document.getElementById("blockSettingsContent");
const progressLabel = document.getElementById("progressLabel");
const progressPercent = document.getElementById("progressPercent");
const progressBar = document.getElementById("progressBar");
const completionScreen = document.getElementById("completionScreen");
const completionTime = document.getElementById("completionTime");
const completionExercises = document.getElementById("completionExercises");
const completionRounds = document.getElementById("completionRounds");
const completionKcal = document.getElementById("completionKcal");
const doneBtn = document.getElementById("doneBtn");

let exerciseCatalog = [];
let generatedBlocks = [];
let workoutExercises = [];

const workoutConfig = {
  workTime:30,
  warmupTime:30,
  restExercise:20,
  restSuperset:75,
  coreTime:30,
  stretchTime:30
};

function getSupersetRounds(duration){
  if(duration === 20) return [2];
  if(duration === 30) return [3,2];
  if(duration === 50) return [3,3,3];
  return [3,3,2];
}

const ringLength = 703.72;
let workoutStep = 0;
let isRest = false;
let secondsLeft = workoutConfig.warmupTime;
let activeRestDuration = workoutConfig.restExercise;
let isPlaying = false;
let timerId = null;
let endTime = null;
let activeExercisePresentation = "";
let activeReplacementIndex = null;
let activeBlockSettingsIndex = null;
let activeSession = null;

const workoutHistoryKey = "motionfit.workoutHistory";
let activeVisualId = null;

async function loadExerciseCatalog(){
  const response = await fetch("data/exercises.json");

  if(!response.ok) throw new Error("No se pudo cargar el catálogo de ejercicios.");

  const catalog = await response.json();

  const requiredFields = ["id", "name", "category", "pattern", "equipment", "muscles", "level", "defaultDuration", "mode", "instruction", "imageStart", "imageEnd"];

  if(!Array.isArray(catalog) || catalog.length !== 55 || new Set(catalog.map(exercise => exercise.id)).size !== 55 || !catalog.every(exercise => requiredFields.every(field => field in exercise) && exercise.level >= 1 && exercise.level <= 3 && ["bodyweight", "kettlebell", "bench", "kettlebell_bench"].includes(exercise.equipment))){
    throw new Error("El catálogo de ejercicios no es válido.");
  }

  let imageMap = {};
  try{
    const imageMapResponse = await fetch("data/exercise-image-map.json");
    if(imageMapResponse.ok) imageMap = await imageMapResponse.json();
  }catch(error){
    if(["localhost", "127.0.0.1"].includes(location.hostname)){
      console.warn("No se pudo cargar el mapa de imágenes de ejercicios.", error);
    }
  }

  return catalog.map(exercise => {
    const mappedImages = imageMap[exercise.id] || {};
    return {
      ...exercise,
      imageStart:exercise.imageStart ?? mappedImages.start ?? "",
      imageEnd:exercise.imageEnd ?? mappedImages.end ?? "",
      mode:exercise.mode === "reps" ? "reps" : "time",
      defaultReps:Number.isFinite(exercise.defaultReps) ? exercise.defaultReps : null
    };
  });
}

function pickExercises(category, count, energy, seed, usedIds = new Set()){
  const candidates = exerciseCatalog
    .filter(exercise => exercise.category === category && !usedIds.has(exercise.id) && (energy > 2 || exercise.level <= 2));
  const previousIds = new Set(generatedBlocks.flatMap(block => block.exercises.map(exercise => exercise.id)));
  const variety = new Map(candidates.map(exercise => {
    let hash = seed;
    for(const character of exercise.id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    return [exercise.id, (hash >>> 0) / 4294967296 + (hasExerciseImage(exercise) ? 0.05 : 0)];
  }));
  const selected = [];
  while(selected.length < count && candidates.length){
    const usedExercises = exerciseCatalog.filter(exercise => usedIds.has(exercise.id) && exercise.category === category);
    const usedPatterns = new Set(usedExercises.map(exercise => exercise.pattern));
    const upperPatterns = ["horizontal-push", "vertical-push", "pull", "shoulder-mobility", "elbow-extension"];
    const preferUpper = usedExercises.length % 2 === 1;
    candidates.sort((a,b) => {
      const redundancy = Number(usedPatterns.has(a.pattern)) - Number(usedPatterns.has(b.pattern));
      const balance = category === "strength" ? Number(upperPatterns.includes(a.pattern) !== preferUpper) - Number(upperPatterns.includes(b.pattern) !== preferUpper) : 0;
      const accessory = category === "strength" ? Number(["shoulder-mobility", "elbow-extension"].includes(a.pattern)) - Number(["shoulder-mobility", "elbow-extension"].includes(b.pattern)) : 0;
      const level = Math.abs(a.level - Math.ceil(energy / 2)) - Math.abs(b.level - Math.ceil(energy / 2));
      const repetition = Number(previousIds.has(a.id)) - Number(previousIds.has(b.id));
      return redundancy || balance || accessory || level || repetition || variety.get(b.id) - variety.get(a.id);
    });
    const exercise = candidates.shift();
    selected.push(exercise);
    usedIds.add(exercise.id);
  }
  return selected;
}

function createBlock(phase, label, exercises, rounds = 1, type = "standard"){
  const mode = exercises.length && exercises.every(exercise => exercise.mode === "reps") ? "reps" : "time";
  return { phase, label, exercises, rounds, type, skipped:false, mode, workTime:null, restExercise:null, restSuperset:null, reps:null };
}

function generateSession(duration, energy){
  const usedIds = new Set();
  const seed = Math.floor(Math.random() * 4294967296);
  const warmupCount = duration === 20 ? 3 : 4;
  const supersetRounds = getSupersetRounds(duration);
  const blocks = [
    createBlock("Warm-up", "Warm-up", pickExercises("warmup", warmupCount, energy, seed, usedIds))
  ];

  supersetRounds.forEach((rounds, index) => {
    blocks.push(createBlock(
      "Fuerza",
      `Superserie ${String.fromCharCode(65 + index)}`,
      pickExercises("strength", 2, energy, seed + index * 3, usedIds),
      rounds,
      "superset"
    ));
  });

  if(duration === 50){
    blocks.push(createBlock("Condicionamiento", "Conditioning", pickExercises("conditioning", 2, energy, seed + 9, usedIds), 2, "conditioning"));
  }

  const coreCount = duration >= 40 ? 2 : 1;
  blocks.push(createBlock("Core", "Core", pickExercises("core", coreCount, energy, seed + 11, usedIds)));

  if(duration >= 40){
    blocks.push(createBlock("Movilidad", "Movilidad", pickExercises("mobility", 1, energy, seed + 13, usedIds)));
  }

  blocks.push(createBlock("Stretch", "Stretch", pickExercises("stretch", 1, energy, seed + 17, usedIds)));

  return blocks;
}

function getExerciseDuration(exercise, phase = ""){
  if(phase === "Condicionamiento") return workoutConfig.workTime;
  if(exercise.category === "warmup") return workoutConfig.warmupTime;
  if(exercise.category === "core") return workoutConfig.coreTime;
  if(["mobility", "stretch"].includes(exercise.category)) return workoutConfig.stretchTime;
  return workoutConfig.workTime;
}

function getBlockWorkTime(block){
  return block.workTime ?? getExerciseDuration(block.exercises[0], block.phase);
}

function getBlockReps(block){
  return block.reps ?? block.exercises[0]?.defaultReps ?? 12;
}

function getBlockRestExercise(block){
  return block.restExercise ?? workoutConfig.restExercise;
}

function getBlockRestSuperset(block){
  return block.restSuperset ?? workoutConfig.restSuperset;
}

function getScheduledDuration(exercise, block){
  return block.workTime ?? exercise.durationOverride ?? getExerciseDuration(exercise, block.phase);
}

function blockSupportsReps(block){
  return block.exercises.length > 0 && block.exercises.every(exercise => Number.isFinite(exercise.defaultReps));
}

function isTimedBlock(block){
  return block.mode !== "reps" || !blockSupportsReps(block);
}

function getBlockControls(block){
  const isRoundBlock = ["superset", "conditioning"].includes(block.type);
  const blockIndex = generatedBlocks.indexOf(block);
  const hasNextBlock = generatedBlocks.slice(blockIndex + 1).some(next => !next.skipped);
  return {
    rounds:isRoundBlock || block.rounds > 1,
    restExercise:block.exercises.length > 1 || (!isRoundBlock && (block.rounds > 1 || hasNextBlock)),
    restSuperset:isRoundBlock && (block.rounds > 1 || hasNextBlock)
  };
}

function getBlockSummary(block){
  const exerciseValue = isTimedBlock(block) ? `${getBlockWorkTime(block)}s` : `${getBlockReps(block)} reps`;
  if(block.type === "superset" || block.type === "conditioning"){
    const controls = getBlockControls(block);
    const rests = [];
    if(controls.restExercise) rests.push(`${getBlockRestExercise(block)}s`);
    if(controls.restSuperset) rests.push(`${getBlockRestSuperset(block)}s`);
    return `${exerciseValue}${rests.length ? ` · ${rests.join(" / ")}` : ""}`;
  }
  return exerciseValue;
}

function getSessionRounds(){
  return generatedBlocks.filter(block => !block.skipped).reduce((total, block) => total + block.rounds, 0);
}

function updateProgress(){
  const total = workoutExercises.length;
  if(!total) return;

  const completed = Math.min(workoutStep + (isRest ? 1 : 0), total);
  const current = Math.min(workoutStep + 1, total);
  const percent = Math.round((completed / total) * 100);

  progressLabel.textContent = `Ejercicio ${current} de ${total}`;
  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
}

function saveWorkoutResult(result){
  try{
    const history = JSON.parse(localStorage.getItem(workoutHistoryKey) || "[]");
    localStorage.setItem(workoutHistoryKey, JSON.stringify([result, ...history].slice(0,50)));
  }catch(error){
    console.warn("No se pudo guardar el historial de entrenamiento.", error);
  }
}

function showCompletionScreen(){
  if(!activeSession || activeSession.saved) return;

  activeSession.saved = true;
  const result = {
    date:new Date().toISOString(),
    duration:activeSession.duration,
    workoutName:activeSession.workoutName,
    completedExercises:activeSession.completedExercises,
    estimatedKcal:activeSession.estimatedKcal
  };

  saveWorkoutResult(result);
  completionTime.textContent = `${result.duration} min`;
  completionExercises.textContent = result.completedExercises;
  completionRounds.textContent = activeSession.rounds;
  completionKcal.textContent = `${result.estimatedKcal} kcal`;
  workoutScreen.classList.add("hidden");
  completionScreen.classList.remove("hidden");
}

function createWorkoutTimeline(blocks){
  const timeline = [];
  const activeBlocks = blocks.filter(block => !block.skipped);

  activeBlocks.forEach((block, blockIndex) => {
    for(let round = 1; round <= block.rounds; round += 1){
      block.exercises.forEach((exercise, exerciseIndex) => {
        const isLastExercise = exerciseIndex === block.exercises.length - 1;
        const isLastRound = round === block.rounds;
        const hasNextBlock = blockIndex < activeBlocks.length - 1;
        const isRoundBlock = block.type === "superset" || block.type === "conditioning";
        const restAfter = isRoundBlock
          ? (isLastExercise ? ((isLastRound && !hasNextBlock) ? 0 : getBlockRestSuperset(block)) : getBlockRestExercise(block))
          : (!isLastExercise || !isLastRound || hasNextBlock ? getBlockRestExercise(block) : 0);

        timeline.push({
          ...exercise,
          phase:block.phase,
          duration:getScheduledDuration(exercise, block),
          mode:isTimedBlock(block) ? "time" : "reps",
          reps:isTimedBlock(block) ? null : getBlockReps(block),
          restAfter,
          round:block.rounds > 1 ? round : null
        });
      });
    }
  });

  return timeline;
}

function getEffectiveDurationSeconds(blocks){
  return createWorkoutTimeline(blocks).reduce((total, exercise) => {
    const workDuration = exercise.mode === "reps" ? exercise.reps * 3 : exercise.duration;
    return total + workDuration + exercise.restAfter;
  }, 0);
}

function getEffectiveDurationMinutes(blocks){
  return Math.max(1, Math.round(getEffectiveDurationSeconds(blocks) / 60));
}

function equipmentLabel(equipment){
  return {bodyweight:"BW", kettlebell:"KB", bench:"Banco", kettlebell_bench:"KB + Banco"}[equipment] || "";
}

function isLocalExerciseImage(path){
  return typeof path === "string" && path.startsWith("assets/exercises/") && !path.includes("..");
}

function hasExerciseImage(exercise){
  return isLocalExerciseImage(exercise?.imageStart) || isLocalExerciseImage(exercise?.imageEnd);
}

function renderExerciseThumbnail(exercise){
  const imagePath = [exercise.imageStart, exercise.imageEnd].find(isLocalExerciseImage);
  return `
    <span class="exerciseThumbnail${imagePath ? " has-image" : " is-fallback"}" aria-hidden="true">
      ${imagePath ? `<img src="${imagePath}" alt="" loading="lazy" decoding="async">` : ""}
    </span>
  `;
}

function renderRoutine(blocks){
  const activeBlocks = blocks.filter(block => !block.skipped);
  const effectiveDuration = getEffectiveDurationMinutes(blocks);
  const exerciseCount = activeBlocks.reduce((total, block) => total + block.exercises.length * block.rounds, 0);
  const supersetCount = activeBlocks.filter(block => block.type === "superset").length;
  let exerciseIndex = 0;
  const blockMarkup = blocks.map((block, blockIndex) => `
    <div class="routineBlock ${block.type !== "standard" ? "routineBlock--superset" : ""}${block.skipped ? " is-skipped" : ""}">
      <div class="routineBlockHeading"><div><h3>${block.label}${block.rounds > 1 ? ` <span>×${block.rounds}</span>` : ""}</h3><small class="blockSummary">${block.skipped ? "Ya realizado" : getBlockSummary(block)}</small></div><div class="blockHeaderActions">${["Warm-up", "Stretch"].includes(block.phase) ? `<label class="blockSkipToggle"><input type="checkbox" data-skip-block="${blockIndex}"${block.skipped ? " checked" : ""}><span>Ya realizado</span></label>` : ""}<button class="blockSettingsBtn" type="button" data-block-settings="${blockIndex}" aria-label="Ajustar ${block.label}">⚙</button></div></div>
      ${block.exercises.map(exercise => {
        const index = exerciseIndex++;
        const exerciseDetail = isTimedBlock(block) ? `${getScheduledDuration(exercise, block)}s` : `${getBlockReps(block)} reps`;
        return `
        <div class="routineExerciseRow">
          ${renderExerciseThumbnail(exercise)}
          <div class="routineExerciseName"><strong>${exercise.name}</strong><span>${exerciseDetail} · Nivel ${exercise.level}</span></div>
          <span class="equipmentBadge">${equipmentLabel(exercise.equipment)}</span>
          <button class="replaceExerciseBtn" type="button" data-exercise-index="${index}">Sustituir</button>
        </div>
      `;
      }).join("")}
    </div>
  `).join("");

  routineCard.innerHTML = `
    <div class="routineMetrics" aria-label="Resumen del entrenamiento">
      <div><strong>⏱ ${effectiveDuration} min</strong><span>Duración</span></div>
      <div><strong>💪 ${exerciseCount} ex</strong><span>Ejercicios</span></div>
      <div><strong>🔁 ${supersetCount} SS</strong><span>Superseries</span></div>
      <div><strong>🔥 ${effectiveDuration * 7} kcal</strong><span>Estimación</span></div>
    </div>
    ${blockMarkup}
  `;
}

const blockSettingLimits = {
  rounds:{min:1, max:5, step:1},
  workTime:{min:15, max:60, step:5},
  reps:{min:5, max:30, step:1},
  restExercise:{min:0, max:45, step:5},
  restSuperset:{min:30, max:120, step:15}
};

function renderStepper(label, value, suffix, field, blockIndex){
  const {min, max, step} = blockSettingLimits[field];
  return `<div class="settingsStepper"><span>${label}</span><div><button type="button" data-block-adjust="${field}" data-block-index="${blockIndex}" data-step="-${step}" aria-label="Reducir ${label}"${value <= min ? " disabled" : ""}>−</button><strong>${value}${suffix}</strong><button type="button" data-block-adjust="${field}" data-block-index="${blockIndex}" data-step="${step}" aria-label="Aumentar ${label}"${value >= max ? " disabled" : ""}>+</button></div></div>`;
}

function openBlockSettings(blockIndex){
  const block = generatedBlocks[blockIndex];
  if(!block) return;

  activeBlockSettingsIndex = blockIndex;
  blockSettingsTitle.textContent = block.label;
  const controls = getBlockControls(block);
  const supportsReps = blockSupportsReps(block);
  const modeControl = supportsReps ? `<div class="settingsMode"><span>Formato</span><div><button type="button" data-block-mode="time" class="${isTimedBlock(block) ? "is-active" : ""}">Tiempo</button><button type="button" data-block-mode="reps" class="${!isTimedBlock(block) ? "is-active" : ""}">Reps</button></div></div>` : "";
  const roundControl = controls.rounds ? renderStepper("Rondas", block.rounds, "", "rounds", blockIndex) : "";
  const workControl = isTimedBlock(block)
    ? renderStepper("Tiempo por ejercicio", getBlockWorkTime(block), "s", "workTime", blockIndex)
    : renderStepper("Repeticiones por ejercicio", getBlockReps(block), " reps", "reps", blockIndex);
  const restControls = `${controls.restExercise ? renderStepper("Descanso entre ejercicios", getBlockRestExercise(block), "s", "restExercise", blockIndex) : ""}${controls.restSuperset ? renderStepper("Descanso entre rondas", getBlockRestSuperset(block), "s", "restSuperset", blockIndex) : ""}`;

  blockSettingsContent.innerHTML = `${modeControl}${roundControl}${workControl}${restControls}<p class="settingsHint">Los cambios se aplican solo a esta sesión.</p>`;
  blockSettingsModal.classList.remove("hidden");
}

function closeBlockSettings(){
  blockSettingsModal.classList.add("hidden");
  activeBlockSettingsIndex = null;
}

function updateRoutineFromBlockSettings(){
  workoutExercises = createWorkoutTimeline(generatedBlocks);
  renderRoutine(generatedBlocks);
  if(activeBlockSettingsIndex !== null) openBlockSettings(activeBlockSettingsIndex);
}

function adjustBlockSetting(blockIndex, field, step){
  const block = generatedBlocks[blockIndex];
  const limits = blockSettingLimits[field];
  if(!block || !limits || ![limits.step, -limits.step].includes(step)) return;
  const current = field === "rounds" ? block.rounds : (field === "workTime" ? getBlockWorkTime(block) : field === "restExercise" ? getBlockRestExercise(block) : field === "restSuperset" ? getBlockRestSuperset(block) : getBlockReps(block));
  const {min, max} = limits;
  const next = Math.max(min, Math.min(max, current + step));
  if(field === "rounds") block.rounds = next;
  else block[field] = next;
  updateRoutineFromBlockSettings();
}

function getGeneratedExerciseReference(index){
  let currentIndex = 0;

  for(const block of generatedBlocks){
    for(let exerciseIndex = 0; exerciseIndex < block.exercises.length; exerciseIndex += 1){
      if(currentIndex === index) return { block, exercise:block.exercises[exerciseIndex] };
      currentIndex += 1;
    }
  }

  return null;
}

function closeReplacementModal(){
  replaceModal.classList.add("hidden");
  activeReplacementIndex = null;
}

function openReplacementModal(index){
  const reference = getGeneratedExerciseReference(index);
  if(!reference) return;

  const alternatives = exerciseCatalog
    .filter(exercise => exercise.pattern === reference.exercise.pattern && exercise.id !== reference.exercise.id)
    .filter(exercise => exercise.category === reference.exercise.category)
    .filter(exercise => !generatedBlocks.some(block => block.exercises.some(selected => selected.id === exercise.id)))
    .sort((a,b) => {
      const levelDifference = Math.abs(a.level - reference.exercise.level) - Math.abs(b.level - reference.exercise.level);
      const equipmentDifference = Number(b.equipment === reference.exercise.equipment) - Number(a.equipment === reference.exercise.equipment);
      const imageDifference = Number(hasExerciseImage(b)) - Number(hasExerciseImage(a));
      return levelDifference || equipmentDifference || imageDifference || a.id.localeCompare(b.id);
    })
    .slice(0,5);

  activeReplacementIndex = index;
  replaceModalDescription.textContent = `${reference.exercise.name} · ${isTimedBlock(reference.block) ? `${getScheduledDuration(reference.exercise, reference.block)}s` : `${getBlockReps(reference.block)} reps`}`;
  replacementOptions.innerHTML = alternatives.map(exercise => `
    <button class="replacementOption" type="button" data-exercise-id="${exercise.id}">
      ${renderExerciseThumbnail(exercise)}
      <span class="replacementOptionName"><strong>${exercise.name}</strong><small><b class="levelBadge">Nivel ${exercise.level}</b><b class="equipmentBadge">${equipmentLabel(exercise.equipment)}</b></small></span>
      <span class="replacementArrow">›</span>
    </button>
  `).join("") || '<p class="settingsHint">No hay otra variante equivalente en la biblioteca V1.</p>';
  replaceModal.classList.remove("hidden");
}

function replaceExercise(index, newExerciseId){
  const reference = getGeneratedExerciseReference(index);
  const replacement = exerciseCatalog.find(exercise => exercise.id === newExerciseId);

  if(!reference || !replacement) return;

  const samePatternAlternative = replacement.pattern === reference.exercise.pattern;
  const sameMovementFamily = replacement.category === reference.exercise.category;
  const alreadySelected = generatedBlocks.some(block => block.exercises.some(exercise => exercise.id === replacement.id));
  if(!samePatternAlternative || !sameMovementFamily || alreadySelected) return;

  const preservedDuration = isTimedBlock(reference.block) ? getScheduledDuration(reference.exercise, reference.block) : null;
  reference.block.exercises[reference.block.exercises.indexOf(reference.exercise)] = {
    ...replacement,
    ...(preservedDuration !== null ? { durationOverride:preservedDuration } : {})
  };

  workoutExercises = createWorkoutTimeline(generatedBlocks);
  renderRoutine(generatedBlocks);
  closeReplacementModal();
}

function formatTime(seconds){
  const totalSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function updateExercisePresentation(exercise, resting){
  const nextState = `${exercise.id}-${resting ? "rest" : "work"}`;

  if(nextState === activeExercisePresentation) return;

  activeExercisePresentation = nextState;
  exerciseInfo.classList.remove("is-changing");
  void exerciseInfo.offsetWidth;
  exerciseInfo.classList.add("is-changing");
}

function refreshExerciseVisualArea(){
  const visibleImages = [exerciseVisualStart, exerciseVisualEnd]
    .filter(visual => !visual.classList.contains("hidden")).length;
  exerciseVisualArea.classList.toggle("hidden", visibleImages === 0);
  exerciseVisualArea.classList.toggle("is-single", visibleImages === 1);
}

function loadExerciseImage(image, figure, path, alt, visualId){
  figure.classList.add("hidden");
  image.removeAttribute("src");
  if(!isLocalExerciseImage(path)) return;

  image.alt = alt;
  image.onload = () => {
    if(activeVisualId !== visualId) return;
    figure.classList.remove("hidden");
    refreshExerciseVisualArea();
  };
  image.onerror = () => {
    if(activeVisualId !== visualId) return;
    image.removeAttribute("src");
    figure.classList.add("hidden");
    refreshExerciseVisualArea();
    if(["localhost","127.0.0.1"].includes(location.hostname)) console.warn(`No se pudo cargar la imagen del ejercicio: ${path}`);
  };
  image.src = path;
}

function updateExerciseVisual(exercise){
  const visualId = exercise?.id || "";
  if(visualId === activeVisualId) return;
  activeVisualId = visualId;

  exerciseVisualArea.classList.add("hidden");
  exerciseVisualStart.classList.add("hidden");
  exerciseVisualEnd.classList.add("hidden");
  exerciseInstruction.classList.toggle("hidden", !exercise?.instruction);
  exerciseInstruction.textContent = exercise?.instruction || "";

  if(!exercise) return;
  loadExerciseImage(exerciseImageStart, exerciseVisualStart, exercise.imageStart, `Inicio: ${exercise.name}`, visualId);
  loadExerciseImage(exerciseImageEnd, exerciseVisualEnd, exercise.imageEnd, `Final: ${exercise.name}`, visualId);
}

function updateTimerView(){
  const current = workoutExercises[workoutStep];
  if(!current) return;
  const isRepsExercise = !isRest && current.mode === "reps";
  const duration = isRest ? activeRestDuration : current.duration;
  const progress = isRepsExercise ? 1 : Math.max(0, secondsLeft) / duration;
  const upcoming = isRest ? workoutExercises[workoutStep + 1] : workoutExercises[workoutStep + 1];

  timerValue.textContent = isRepsExercise ? `${current.reps} reps` : formatTime(secondsLeft);
  timerProgress.style.strokeDashoffset = ringLength * (1 - progress);
  timerProgress.classList.toggle("is-rest", isRest);
  timerProgress.classList.toggle("is-final", !isRepsExercise && secondsLeft <= 5);
  workoutPhase.textContent = isRest ? "Descanso" : current.phase;
  exerciseName.textContent = isRest ? "Recupera el aliento" : current.name;
  nextExercise.textContent = upcoming ? upcoming.name : "Sesión completada";
  timerStatus.textContent = isRest ? "Descansa" : isRepsExercise ? "Objetivo de repeticiones" : "En movimiento";

  updateExercisePresentation(current, isRest);
  updateExerciseVisual(isRest ? null : current);
  updateProgress();
}

function completeWorkout(){
  clearInterval(timerId);
  timerId = null;
  isPlaying = false;
  secondsLeft = 0;
  workoutPhase.textContent = "Stretch";
  exerciseName.textContent = "¡Sesión completada!";
  nextExercise.textContent = "Buen trabajo";
  timerStatus.textContent = "Finalizado";
  timerProgress.style.strokeDashoffset = ringLength;
  playPauseBtn.textContent = "↻ Repetir sesión";
  playPauseBtn.setAttribute("aria-pressed", "false");
  showCompletionScreen();
}

function advanceWorkout(){
  if(isRest){
    isRest = false;
    workoutStep += 1;
  }else{
    const restAfter = workoutExercises[workoutStep].restAfter;

    if(restAfter > 0 && workoutStep < workoutExercises.length - 1){
      isRest = true;
      activeRestDuration = restAfter;
    }else{
      workoutStep += 1;
    }
  }

  if(workoutStep >= workoutExercises.length){
    completeWorkout();
    return;
  }

  const current = workoutExercises[workoutStep];
  secondsLeft = isRest ? activeRestDuration : current.duration;
  endTime = Date.now() + secondsLeft * 1000;
  if(!isRest && current.mode === "reps"){
    clearInterval(timerId);
    timerId = null;
    playPauseBtn.textContent = "✓ Completar ejercicio";
    playPauseBtn.setAttribute("aria-pressed", "true");
  }else if(isPlaying){
    if(!timerId) timerId = setInterval(runTimer, 200);
    playPauseBtn.textContent = "❚❚ Pausar";
    playPauseBtn.setAttribute("aria-pressed", "true");
  }
  updateTimerView();
}

function runTimer(){
  if(!isPlaying) return;
  secondsLeft = Math.max(0, (endTime - Date.now()) / 1000);
  updateTimerView();
  if(secondsLeft <= 0) advanceWorkout();
}

function startTimer(){
  if(isPlaying) return;
  isPlaying = true;
  const current = workoutExercises[workoutStep];
  if(!isRest && current?.mode === "reps"){
    updateTimerView();
    playPauseBtn.textContent = "✓ Completar ejercicio";
    playPauseBtn.setAttribute("aria-pressed", "true");
    return;
  }
  endTime = Date.now() + secondsLeft * 1000;
  timerId = setInterval(runTimer, 200);
  runTimer();
  playPauseBtn.textContent = "❚❚ Pausar";
  playPauseBtn.setAttribute("aria-pressed", "true");
}

function pauseTimer(){
  if(!isPlaying) return;
  if(isRest || workoutExercises[workoutStep]?.mode !== "reps") runTimer();
  isPlaying = false;
  clearInterval(timerId);
  timerId = null;
  timerStatus.textContent = "En pausa";
  playPauseBtn.textContent = "▶ Reanudar";
  playPauseBtn.setAttribute("aria-pressed", "false");
}

function resetWorkout(){
  clearInterval(timerId);
  timerId = null;
  workoutStep = 0;
  isRest = false;
  activeRestDuration = workoutConfig.restExercise;
  if(!workoutExercises.length) return;
  secondsLeft = workoutExercises[0].duration;
  isPlaying = false;
  activeExercisePresentation = "";
  updateTimerView();
  playPauseBtn.textContent = "❚❚ Pausar";
  playPauseBtn.setAttribute("aria-pressed", "false");
}

generateBtn.addEventListener("click",()=>{
  const minutes = Number(timeSlider.value);

  generatedBlocks = generateSession(minutes, energy);
  workoutExercises = createWorkoutTimeline(generatedBlocks);

  durationBadge.textContent = `${minutes} min`;
  routineTitle.textContent = title.textContent.replace("Full Body ", "");
  renderRoutine(generatedBlocks);

  coachScreen.classList.add("hidden");
  routineScreen.classList.remove("hidden");
});

backBtn.addEventListener("click",()=>{

  routineScreen.classList.add("hidden");
  coachScreen.classList.remove("hidden");

});

startWorkoutBtn.addEventListener("click",()=>{
  activeSession = {
    duration:getEffectiveDurationMinutes(generatedBlocks),
    workoutName:routineTitle.textContent,
    completedExercises:workoutExercises.length,
    rounds:getSessionRounds(),
    estimatedKcal:getEffectiveDurationMinutes(generatedBlocks) * 7,
    saved:false
  };
  routineScreen.classList.add("hidden");
  workoutScreen.classList.remove("hidden");
  resetWorkout();
  startTimer();
});

workoutBackBtn.addEventListener("click",()=>{
  pauseTimer();
  workoutScreen.classList.add("hidden");
  routineScreen.classList.remove("hidden");
});

finishWorkoutBtn.addEventListener("click",()=>{
  pauseTimer();
  resetWorkout();
  activeSession = null;
  workoutScreen.classList.add("hidden");
  routineScreen.classList.remove("hidden");
});

doneBtn.addEventListener("click",()=>{
  completionScreen.classList.add("hidden");
  coachScreen.classList.remove("hidden");
  activeSession = null;
});

routineCard.addEventListener("click", event => {
  const replaceButton = event.target.closest(".replaceExerciseBtn");
  if(replaceButton) openReplacementModal(Number(replaceButton.dataset.exerciseIndex));
  const settingsButton = event.target.closest("[data-block-settings]");
  if(settingsButton) openBlockSettings(Number(settingsButton.dataset.blockSettings));
});

routineCard.addEventListener("change", event => {
  const skipToggle = event.target.closest("[data-skip-block]");
  if(!skipToggle) return;
  const block = generatedBlocks[Number(skipToggle.dataset.skipBlock)];
  if(!block) return;
  block.skipped = skipToggle.checked;
  workoutExercises = createWorkoutTimeline(generatedBlocks);
  renderRoutine(generatedBlocks);
});

closeReplaceModal.addEventListener("click", closeReplacementModal);

replaceModal.addEventListener("click", event => {
  if(event.target.matches("[data-close-replace-modal]")) closeReplacementModal();
});

replacementOptions.addEventListener("click", event => {
  const option = event.target.closest(".replacementOption");
  if(option && activeReplacementIndex !== null){
    replaceExercise(activeReplacementIndex, option.dataset.exerciseId);
  }
});

document.getElementById("closeBlockSettings").addEventListener("click", closeBlockSettings);

blockSettingsModal.addEventListener("click", event => {
  if(event.target.matches("[data-close-block-settings]")) closeBlockSettings();
  const modeButton = event.target.closest("[data-block-mode]");
  if(modeButton && activeBlockSettingsIndex !== null){
    const block = generatedBlocks[activeBlockSettingsIndex];
    if(block && (modeButton.dataset.blockMode === "time" || blockSupportsReps(block))){
      block.mode = modeButton.dataset.blockMode;
      updateRoutineFromBlockSettings();
    }
  }
  const adjustButton = event.target.closest("[data-block-adjust]");
  if(adjustButton){
    adjustBlockSetting(Number(adjustButton.dataset.blockIndex), adjustButton.dataset.blockAdjust, Number(adjustButton.dataset.step));
  }
});

document.addEventListener("error", event => {
  const image = event.target;
  if(!(image instanceof HTMLImageElement) || !image.matches(".exerciseThumbnail img")) return;
  image.closest(".exerciseThumbnail")?.classList.add("is-fallback");
}, true);

playPauseBtn.addEventListener("click",()=>{
  if(workoutStep === workoutExercises.length - 1 && secondsLeft === 0){
    resetWorkout();
    startTimer();
  }else if(isPlaying && !isRest && workoutExercises[workoutStep]?.mode === "reps"){
    advanceWorkout();
  }else if(isPlaying){
    pauseTimer();
  }else{
    startTimer();
  }
});

generateBtn.disabled = true;

loadExerciseCatalog()
  .then(catalog => {
    exerciseCatalog = catalog;
    generateBtn.disabled = false;
  })
  .catch(error => {
    console.error(error);
    generateBtn.textContent = "No se pudo cargar la sesión";
  });

updateTimerView();

if("serviceWorker" in navigator){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(error => {
      console.warn("No se pudo registrar el modo sin conexión.", error);
    });
  });
}
