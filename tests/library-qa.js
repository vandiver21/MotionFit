// Run through validate_library.py --browser-fixture; exercises the real DOM and local images.
setTimeout(async () => {
  const passed = [];
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const test = async (name, fn) => { await fn(); passed.push(name); };
  const nextFrame = () => new Promise(resolve => setTimeout(resolve, 30));
  const fresh = (duration=30, level=3) => {
    closeBlockSettings(); timeSlider.value=duration; timeSlider.dispatchEvent(new Event('input'));
    document.querySelector(`[data-energy="${level}"]`).click(); generateBtn.click();
  };
  const selectedIds = () => generatedBlocks.flatMap(b=>b.exercises.map(e=>e.id));
  const skip = phase => routineCard.querySelector(`[data-skip-block="${generatedBlocks.findIndex(b=>b.phase===phase)}"]`).click();
  const settleVisuals = async () => {
    await Promise.all([exerciseImageStart,exerciseImageEnd].filter(img=>img.hasAttribute('src')).map(img=>img.decode().catch(()=>{})));
    await nextFrame();
  };
  try {
    await test('Startup, 55 approved records, holds have no invented reps', () => {
      assert(!generateBtn.disabled && exerciseCatalog.length===55 && !testErrors.length,'Startup');
      assert(exerciseCatalog.filter(e=>e.mode==='time').every(e=>e.defaultReps===null),'Timed reps');
    });
    await test('20 duration/energy combinations × 10 runs: structure, unique references, quality and variation', () => {
      const approved=new Set(fixtures['data/exercises.json'].map(e=>e.id));
      for(const duration of [20,30,40,50]) for(let level=1;level<=5;level++){
        const variations=new Set();
        for(let run=0;run<10;run++){
          fresh(duration,level); const ids=selectedIds(); variations.add(ids.join(','));
          assert(ids.every(id=>approved.has(id)) && ids.length===new Set(ids).size,'Exclusive unique selection');
          assert(generatedBlocks[0].exercises.length===(duration===20?3:4),'Warmup count');
          const strength=generatedBlocks.filter(b=>b.type==='superset');
          assert(JSON.stringify(strength.map(b=>b.rounds))===JSON.stringify(duration===20?[2]:duration===30?[3,2]:duration===50?[3,3,3]:[3,3,2]),'Rounds');
          assert(strength.every(b=>b.exercises.length===2),'Strength size');
          const patterns=strength.flatMap(b=>b.exercises.map(e=>e.pattern));
          assert(new Set(patterns).size===patterns.length,'Redundant strength family');
          assert(generatedBlocks.at(-1).exercises.every(e=>e.category==='stretch'),'Stretch category');
          if(duration===50) assert(generatedBlocks.find(b=>b.type==='conditioning').exercises.every(e=>e.category==='conditioning'),'Conditioning category');
          if(level<=2) assert(generatedBlocks.every(b=>b.exercises.every(e=>e.level<=2)),'Low energy technical exercise');
          const expected=generatedBlocks.reduce((n,b)=>n+b.rounds*b.exercises.length,0);
          assert(workoutExercises.length===expected && workoutExercises.at(-1).restAfter===0,'Sequence');
          assert(!routineScreen.classList.contains('hidden') && timeValue.textContent===duration+' min' && energy===level,'Selectors');
        }
        assert(variations.size>1,'No session variation');
      }
    });
    await test('All 88 referenced images decode', async () => {
      const paths=new Set(exerciseCatalog.flatMap(e=>[e.imageStart,e.imageEnd]).filter(Boolean));
      await Promise.all([...paths].map(async path=>{const img=new Image();img.src=path;await img.decode();assert(img.naturalWidth>0,path)}));
    });
    await test('Every exercise: Spanish row/cue, live start/peak, main-only and missing images', async () => {
      for(const exercise of exerciseCatalog){
        generatedBlocks=[createBlock('Core','QA',[exercise])];updateRoutineFromBlockSettings();
        assert(routineCard.querySelector('.routineExerciseName strong').textContent===exercise.name,'Row name');
        if(exercise.imageStart) assert(routineCard.querySelector('.exerciseThumbnail img').getAttribute('src')===exercise.imageStart,'Row image');
        else assert(!routineCard.querySelector('.exerciseThumbnail img') && getComputedStyle(routineCard.querySelector('.exerciseThumbnail')).visibility==='hidden','Empty thumbnail');
        routineScreen.classList.add('hidden');workoutScreen.classList.remove('hidden');
        resetWorkout();await settleVisuals();
        assert(exerciseName.textContent===exercise.name && exerciseInstruction.textContent===exercise.instruction,'Live Spanish');
        const visible=[exerciseVisualStart,exerciseVisualEnd].filter(e=>!e.classList.contains('hidden')).length;
        assert(visible===(exercise.imageEnd?2:exercise.imageStart?1:0),exercise.id+' image count');
        assert(exerciseVisualArea.classList.contains('hidden')===(visible===0),'Empty visual');
        if(visible===1) assert(exerciseVisualArea.classList.contains('is-single'),'Single image centered');
        startTimer();assert(exercise.mode==='reps'?timerValue.textContent===exercise.defaultReps+' reps' && timerId===null:timerValue.textContent==='00:30' && timerId!==null,'Live mode');pauseTimer();
        assert(document.documentElement.scrollWidth<=innerWidth,exercise.id+' live overflow');
        workoutScreen.classList.add('hidden');routineScreen.classList.remove('hidden');
      }
    });
    await test('Invalid image paths and load failures hide cleanly', async () => {
      updateExerciseVisual({id:'invalid-qa',imageStart:'https://invalid.example/image.webp',imageEnd:'../invalid.webp'});
      assert(!exerciseImageStart.hasAttribute('src') && !exerciseImageEnd.hasAttribute('src') && exerciseVisualArea.classList.contains('hidden'),'Invalid path');
      updateExerciseVisual(exerciseCatalog.find(e=>e.id==='goblet-squat'));await settleVisuals();
      exerciseImageStart.onerror();exerciseImageEnd.onerror();assert(exerciseVisualArea.classList.contains('hidden'),'Failed visuals');
      renderRoutine(generatedBlocks);const img=routineCard.querySelector('.exerciseThumbnail img');if(img){img.dispatchEvent(new Event('error'));assert(getComputedStyle(img.closest('.exerciseThumbnail')).visibility==='hidden','Broken row image');}
    });
    await test('Block settings limits, mode switching, recalculation and unchanged selection', () => {
      generatedBlocks=[createBlock('Fuerza','Superserie A',[exerciseCatalog.find(e=>e.id==='goblet-squat'),exerciseCatalog.find(e=>e.id==='push-up')],3,'superset')];
      updateRoutineFromBlockSettings();openBlockSettings(0);const ids=selectedIds().join(',');
      for(const [field,min,max,step] of [['rounds',1,5,1],['workTime',15,60,5],['reps',5,30,1],['restExercise',0,45,5],['restSuperset',30,120,15]]){
        blockSettingsContent.querySelector(`[data-block-mode="${field==='reps'?'reps':'time'}"]`).click();
        const button=sign=>blockSettingsContent.querySelector(`[data-block-adjust="${field}"][data-step="${sign*step}"]`);
        for(let n=0;n<40;n++)button(-1).click();assert(generatedBlocks[0][field]===min && button(-1).disabled,field+' min');
        button(1).click();assert(generatedBlocks[0][field]===min+step,field+' step');
        for(let n=0;n<40;n++)button(1).click();assert(generatedBlocks[0][field]===max && button(1).disabled,field+' max');
      }
      assert(selectedIds().join(',')===ids,'Reselected');
      assert(workoutExercises.length===10 && getEffectiveDurationSeconds(generatedBlocks)===10*60+5*45+4*120,'Exact duration');
      assert(routineCard.querySelector('.routineMetrics strong').textContent==='⏱ 22 min','Duration display');closeBlockSettings();
    });
    await test('Substitution stays within category/pattern, preserves timing and avoids duplicates', () => {
      fresh();const index=selectedIds().findIndex(id=>exerciseCatalog.find(e=>e.id===id).pattern==='horizontal-push');
      assert(index>=0,'Push selection');openReplacementModal(index);assert(!replaceModal.classList.contains('hidden'),'Modal');
      const options=[...replacementOptions.querySelectorAll('[data-exercise-id]')];assert(options.length,'Options');
      const ref=getGeneratedExerciseReference(index), duration=getScheduledDuration(ref.exercise,ref.block);
      const newId=options[0].dataset.exerciseId;assert(!selectedIds().includes(newId),'Already present');options[0].click();
      const changed=getGeneratedExerciseReference(index);assert(changed.exercise.id===newId && changed.exercise.pattern==='horizontal-push' && changed.exercise.category==='strength','Substitution');
      assert(getScheduledDuration(changed.exercise,changed.block)===duration && replaceModal.classList.contains('hidden'),'Preserved timing');
      const single=selectedIds().findIndex(id=>exerciseCatalog.find(e=>e.id===id).category==='stretch');openReplacementModal(single);assert(replacementOptions.textContent.includes('No hay otra variante'),'Empty equivalent message');closeReplacementModal();
    });
    await test('Skip/restore, fresh defaults, pause/resume, completion and history', () => {
      fresh(20,1);const original=JSON.stringify(workoutExercises),seconds=getEffectiveDurationSeconds(generatedBlocks);
      skip('Warm-up');skip('Stretch');assert(!workoutExercises.some(e=>['Warm-up','Stretch'].includes(e.phase)) && getEffectiveDurationSeconds(generatedBlocks)<seconds,'Skip');
      skip('Warm-up');skip('Stretch');assert(JSON.stringify(workoutExercises)===original,'Restore');
      startWorkoutBtn.click();playPauseBtn.click();assert(!isPlaying && timerId===null,'Pause');playPauseBtn.click();assert(isPlaying,'Resume');
      const expected=workoutExercises.length;let guard=0;
      while(completionScreen.classList.contains('hidden') && guard++<200){
        if(!isRest && workoutExercises[workoutStep].mode==='reps')playPauseBtn.click();else{endTime=Date.now()-1;runTimer()}
      }
      assert(guard<200 && !completionScreen.classList.contains('hidden') && timerId===null,'Completion');
      assert(Number(completionExercises.textContent)===expected,'Completion count');
      assert(JSON.parse(localStorage.getItem(workoutHistoryKey))[0].completedExercises===expected,'History');doneBtn.click();fresh();
      assert(generatedBlocks.every(b=>b.workTime===null && b.reps===null && b.restExercise===null && !b.skipped),'Default reset');
    });
    await test('Mobile routine and settings fit viewport', async () => {
      fresh(50,5);await nextFrame();assert(document.documentElement.scrollWidth<=innerWidth,'Routine horizontal overflow');
      openBlockSettings(1);assert(blockSettingsModal.querySelector('section').getBoundingClientRect().right<=innerWidth,'Sheet horizontal overflow');closeBlockSettings();
    });
    assert(!testErrors.length,testErrors.join('; '));
    const result=document.createElement('pre');result.id='qa-result';result.hidden=true;result.textContent='PASS\n'+passed.join('\n');document.body.prepend(result);
  }catch(e){pauseTimer();const result=document.createElement('pre');result.id='qa-result';result.textContent='FAIL '+e.stack+'\nPassed: '+passed.join(' | ');document.body.prepend(result)}
},100);
