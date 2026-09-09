const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
const LOADER_URL = "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";
const MODEL_URL = new URL("../assets/avatar/characterRIGGED.glb", import.meta.url).href;

const aliases = { "bodyweight squat":"squat", "reverse lunge":"reverseLunge", "push-up":"pushup", squat:"squat", reverselunge:"reverseLunge", pushup:"pushup", idle:"idle" };
const boneNames = {
  hips:["hips","pelvis","root"], spine:["spine","spine1"], chest:["chest","spine2","upperchest"], neck:["neck"], head:["head"], shoulderL:["leftshoulder","shoulderl"], shoulderR:["rightshoulder","shoulderr"],
  upperArmL:["leftupperarm","leftarm","upperarml"], upperArmR:["rightupperarm","rightarm","upperarmr"], forearmL:["leftforearm","leftlowerarm","forearml"], forearmR:["rightforearm","rightlowerarm","forearmr"], handL:["lefthand"], handR:["righthand"],
  thighL:["leftupleg","leftthigh","thighl"], thighR:["rightupleg","rightthigh","thighr"], shinL:["leftleg","leftlowerleg","leftcalf","shinl"], shinR:["rightleg","rightlowerleg","rightcalf","shinr"], footL:["leftfoot"], footR:["rightfoot"]
};

export async function createAvatar3D(container, options = {}){
  const [THREE,{ GLTFLoader }] = await Promise.all([import(THREE_URL),import(LOADER_URL)]);
  const avatar = new RiggedAvatar(THREE,container,GLTFLoader);
  try { await avatar.loadModel(options.modelUrl || MODEL_URL); return avatar; }
  catch(error){ console.warn("Rigged avatar model could not load; using procedural 3D fallback.",error); avatar.dispose(); return new ProceduralFallback(THREE,container); }
}

class RendererBase {
  constructor(THREE,container){
    this.THREE=THREE; this.container=container; this.running=true; this.frame=null; this.speed=1; this.clock=new THREE.Clock();
    this.scene=new THREE.Scene(); this.camera=new THREE.PerspectiveCamera(34,1,.1,30); this.goal=new THREE.Vector3(2.8,1.45,5.1); this.look=new THREE.Vector3(0,.4,0); this.lookGoal=this.look.clone(); this.camera.position.copy(this.goal);
    this.presets={standing:[2.8,1.45,5.1,0,.4,0],floor:[2.75,1,4.75,0,-.05,0],horizontal:[3.15,.85,5.4,0,.05,0]};
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"high-performance"}); this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2)); this.renderer.shadowMap.enabled=true; this.renderer.shadowMap.type=THREE.BasicShadowMap; this.renderer.setClearColor(0x08111f,0);
    this.renderer.domElement.addEventListener("webglcontextlost",e=>{e.preventDefault();container.dispatchEvent(new Event("avatar3derror"));}); container.appendChild(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(0xbfe7ff,0x08111f,2)); const light=new THREE.DirectionalLight(0xffffff,2.3); light.position.set(3,5,4); light.castShadow=true; light.shadow.mapSize.set(512,512); this.scene.add(light);
    const ground=new THREE.Mesh(new THREE.CircleGeometry(1.25,32),new THREE.ShadowMaterial({opacity:.18})); ground.rotation.x=-Math.PI/2; ground.position.y=-.98; ground.receiveShadow=true; this.scene.add(ground);
    this.resize=this.resize.bind(this); this.tick=this.tick.bind(this); this.observer=new ResizeObserver(this.resize); this.observer.observe(container); this.resize();
  }
  setCameraPreset(name){this.cameraPreset=name||"standing";const p=this.presets[this.cameraPreset]||this.presets.standing;this.goal.set(p[0],p[1],p[2]);this.lookGoal.set(p[3],p[4],p[5]);}
  setPlaybackSpeed(speed){this.speed=Math.max(.25,Math.min(speed||1,2));}
  getDiagnostics(){return {animation:this.exercise||"idle",camera:this.cameraPreset||"standing",model:"procedural fallback",mappedBones:"0/17"};}
  setRunning(running){this.running=running;if(running&&this.frame===null)this.tick();if(!running)this.render();}
  resize(){const w=Math.max(1,this.container.clientWidth),h=Math.max(1,this.container.clientHeight);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);this.render();}
  render(){this.camera.position.lerp(this.goal,.1);this.look.lerp(this.lookGoal,.1);this.camera.lookAt(this.look);this.renderer.render(this.scene,this.camera);}
  tick(){this.frame=requestAnimationFrame(this.tick);if(!this.running){cancelAnimationFrame(this.frame);this.frame=null;return;}this.update(this.clock.getElapsedTime()*this.speed);this.render();}
  dispose(){if(this.frame)cancelAnimationFrame(this.frame);this.observer.disconnect();this.scene.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.material?.dispose)n.material.dispose();});this.renderer.dispose();this.renderer.domElement.remove();}
}

class RiggedAvatar extends RendererBase {
  constructor(THREE,container,GLTFLoader){super(THREE,container);this.loader=new GLTFLoader();this.bones={};this.base=new Map();this.pos=new Map();this.q=new THREE.Quaternion();this.e=new THREE.Euler();this.exercise="idle";}
  async loadModel(url){
    const gltf=await this.loader.loadAsync(url);this.model=gltf.scene;this.model.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;const materials=Array.isArray(n.material)?n.material:[n.material];materials.forEach(material=>{if(material?.color)material.color.set(0x2563eb);if(material)material.roughness=.68;});}if(n.isSkinnedMesh&&!this.skinned)this.skinned=n;});if(!this.skinned)throw new Error("GLB has no SkinnedMesh");this.model.scale.setScalar(.14);this.model.position.y=0;this.scene.add(this.model);this.mapBones();if(!this.bones.hips||!this.bones.head||!this.bones.upperArmL||!this.bones.thighL)throw new Error("GLB skeleton is incomplete");this.mixer=new this.THREE.AnimationMixer(this.model);this.actions=new Map(gltf.animations.map(c=>[c.name.toLowerCase(),this.mixer.clipAction(c)]));this.makeKettlebell();this.tick();
  }
  mapBones(){
    const all=[];this.model.traverse(n=>n.isBone&&all.push(n));const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,"");
    Object.entries(boneNames).forEach(([key,names])=>{const bone=all.find(b=>names.some(n=>norm(b.name).includes(n)));if(bone)this.bones[key]=bone;});
    if(!this.bones.hips) this.inferGenericBlenderRig(all);
    all.forEach(bone=>{this.base.set(bone,bone.quaternion.clone());this.pos.set(bone,bone.position.clone());});
    this.semanticBones={hips:this.bones.hips,spine:this.bones.spine,chest:this.bones.chest,neck:this.bones.neck,head:this.bones.head,leftUpperArm:this.bones.upperArmL,leftForeArm:this.bones.forearmL,leftHand:this.bones.handL,rightUpperArm:this.bones.upperArmR,rightForeArm:this.bones.forearmR,rightHand:this.bones.handR,leftThigh:this.bones.thighL,leftShin:this.bones.shinL,leftFoot:this.bones.footL,rightThigh:this.bones.thighR,rightShin:this.bones.shinR,rightFoot:this.bones.footR};
    const debug = ["localhost","127.0.0.1"].includes(location.hostname) || new URLSearchParams(location.search).has("avatarDebug") || new URLSearchParams(location.search).has("debugAvatar");
    if(debug) console.info("MotionFit avatar bones detected:",all.map(bone=>bone.name),this.bones);
  }
  inferGenericBlenderRig(all){
    const byName=name=>all.find(bone=>bone.name===name);
    const chest=byName("Bone"),hips=byName("Bone.001"),neck=byName("Bone.002");
    if(!chest||!hips) return;
    const armL=byName("Bone.004"),armR=byName("Bone.005"),thighL=byName("Bone.011"),thighR=byName("Bone.013");
    Object.assign(this.bones,{ hips,spine:chest,chest,neck,head:neck,upperArmL:armL,upperArmR:armR,forearmL:byName("Bone.008"),forearmR:byName("Bone.006"),handL:byName("Bone.009"),handR:byName("Bone.007"),thighL,thighR,shinL:byName("Bone.012"),shinR:byName("Bone.014"),footL:byName("Bone.015"),footR:byName("Bone.016") });
  }
  makeKettlebell(){const T=this.THREE,m=new T.MeshStandardMaterial({color:0x111827,roughness:.58,metalness:.15});this.kettlebell=new T.Group();const body=new T.Mesh(new T.SphereGeometry(.13,12,8),m),handle=new T.Mesh(new T.TorusGeometry(.08,.022,6,10,Math.PI),m);handle.rotation.x=Math.PI/2;handle.position.y=.11;this.kettlebell.add(body,handle);this.kettlebell.scale.setScalar(12);this.kettlebell.visible=false;(this.bones.chest||this.bones.spine||this.model).add(this.kettlebell);this.kettlebell.position.set(0,-1.2,-1.7);}
  play(name){this.playExercise(name);}
  playExercise(name){const key=String(name||"idle").toLowerCase();const requested=aliases[key];if(!requested){this.exercise="idle";this.model.rotation.x=0;this.render();return false;}this.exercise=requested;this.cameraPreset=this.exercise==="pushup"?"horizontal":"standing";this.setCameraPreset(this.cameraPreset);this.model.rotation.x=this.exercise==="pushup"?-Math.PI/2:0;if(this.kettlebell)this.kettlebell.visible=false;this.actions.forEach(a=>a.stop());const action=this.actions.get(this.exercise.toLowerCase());this.native=Boolean(action);if(action)action.reset().play();this.render();return true;}
  getDiagnostics(){return {animation:this.exercise||"idle",camera:this.cameraPreset||"standing",model:"rigged GLB",mappedBones:`${Object.values(this.semanticBones).filter(Boolean).length}/17`};}
  reset(){this.base.forEach((q,b)=>b.quaternion.copy(q));this.pos.forEach((p,b)=>b.position.copy(p));}
  rotate(name,x=0,y=0,z=0){const b=this.bones[name];if(b)b.quaternion.copy(this.base.get(b)).multiply(this.q.setFromEuler(this.e.set(x,y,z)));}
  move(name,x=0,y=0,z=0){const b=this.bones[name];if(b){b.position.copy(this.pos.get(b));b.position.x+=x;b.position.y+=y;b.position.z+=z;}}
  update(t){if(this.mixer)this.mixer.update(.016*this.speed);if(this.native)return;this.reset();const w=(Math.sin(t*2)+1)/2,s=Math.sin(t*1.4),r=Math.max(s,0),l=Math.max(-s,0);
    if(this.exercise==="squat"||this.exercise==="gobletSquat"){this.move("hips",0,-.9*w,-.55*w);this.rotate("thighL",.9*w);this.rotate("thighR",.9*w);this.rotate("shinL",-.82*w);this.rotate("shinR",-.82*w);this.rotate("spine",-.2*w);if(this.exercise==="gobletSquat"){this.rotate("upperArmL",-.65);this.rotate("upperArmR",-.65);this.rotate("forearmL",-.35);this.rotate("forearmR",-.35);}}
    else if(this.exercise==="reverseLunge"){const alternate=Math.sin(t*.7)>0?1:-1;this.move("hips",0,-.6*w,-.35*w);this.rotate(alternate>0?"thighL":"thighR",.72*w);this.rotate(alternate>0?"shinL":"shinR",-.64*w);this.rotate(alternate>0?"thighR":"thighL",-.34*w);this.rotate(alternate>0?"shinR":"shinL",.32*w);this.rotate("spine",-.1*w);}
    else if(this.exercise==="pushup"||this.exercise==="pikePushup"){this.move("hips",0,-.1*w);this.rotate("upperArmL",.72*w);this.rotate("upperArmR",.72*w);this.rotate("forearmL",-.88*w);this.rotate("forearmR",-.88*w);if(this.exercise==="pikePushup")this.rotate("hips",-.58);}
    else if(this.exercise==="catCow"){this.rotate("spine",Math.sin(t)*.26);this.rotate("chest",Math.sin(t)*.3);this.rotate("neck",-Math.sin(t)*.2);this.rotate("head",-Math.sin(t)*.15);}
    else if(this.exercise==="birdDog"){this.rotate("upperArmR",-.95*r);this.rotate("forearmR",-.35*r);this.rotate("thighL",1*r);this.rotate("shinL",-.22*r);this.rotate("upperArmL",.95*l);this.rotate("forearmL",.35*l);this.rotate("thighR",-1*l);this.rotate("shinR",.22*l);}
    else if(this.exercise==="deadBug"){this.rotate("upperArmL",-.8*r);this.rotate("thighR",-.95*r);this.rotate("upperArmR",-.8*l);this.rotate("thighL",-.95*l);}
    else if(this.exercise==="stretch"){this.rotate("spine",0,0,.32);this.rotate("upperArmL",0,0,1+Math.sin(t)*.06);this.rotate("forearmL",0,0,.25);this.rotate("thighL",-.4);}
    else if(this.exercise==="armCircles"){this.rotate("upperArmL",0,0,Math.sin(t*2)*1.1);this.rotate("upperArmR",0,0,-Math.sin(t*2)*1.1);}
  }
}

class ProceduralFallback extends RendererBase {
  constructor(T,c){super(T,c);this.exercise="idle";this.root=new T.Group();this.scene.add(this.root);const kit=new T.MeshStandardMaterial({color:0x3b82f6,roughness:.6}),skin=new T.MeshStandardMaterial({color:0xf0aa7d,roughness:.7});const torso=new T.Mesh(new T.CapsuleGeometry(.25,.55,4,10),kit),head=new T.Mesh(new T.SphereGeometry(.18,12,8),skin);torso.position.y=.25;head.position.y=.9;this.root.add(torso,head);this.tick();}
  play(name){this.playExercise(name);} playExercise(name){this.exercise=aliases[String(name||"idle").toLowerCase()]||"idle";this.setCameraPreset(this.exercise==="pushup"?"horizontal":"standing");return true;}
  update(t){const y=Math.sin(t*2)*.06;this.root.position.y=y;this.root.rotation.z=["pushup","pikePushup","birdDog","catCow","deadBug"].includes(this.exercise)?Math.PI/2:0;if(this.exercise==="squat"||this.exercise==="gobletSquat")this.root.position.y-=Math.max(0,y)*3;}
}
