// import * as THREE from "https://unpkg.com/three/build/three.module.js";
// import { ColladaLoader } from "https://threejs.org/examples/jsm/loaders/ColladaLoader.js";
// import { GLTFLoader } from "https://threejs.org/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "https://unpkg.com/three@0.126.1/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js";
import { ColladaLoader } from "https://unpkg.com/three@0.126.1/examples/jsm/loaders/ColladaLoader.js";
import { SkeletonUtils } from "https://unpkg.com/three@0.126.1/examples/jsm/utils/SkeletonUtils.js";

let renderer = null;
let scene = null;
let camera = null;
let gps = null;
let compassDegree = null;
let watch = null;
let controller = null;
let model = null;
let otherPlayer = null;
let playerVector = null;
let otherObject = null;
const info = document.getElementById("info");
const socket = io.connect("https://55a6f33b81c5.ngrok.io");
//--- Animation ---
//let clips = null;
//let mixer = null;
let knightClips = null;
let myMixer = null;
let EnemyMixer = null;
let then = 0;
let knightAnimations = null;
let wolfClips = null;
let wolfAnimations = null;
let dogClips = null;
let dogAnimations = null;
//-----------------
let roomID = null;
let distance = null;
let commandFlag = false;
let hp = 100;
let enemyHP = 100;
let targetModel = null;
let knight = null;
let selectFlag = false;
let copyKnight = null;
let wolf = null;
let copyWolf = null;
let myCharacters = [];
let div = null;
let stage = null;
let dog = null;
let copyDog = null;

if (window.localStorage.getItem("myCharacters") == null) {
  const knightJson = ["knight"];
  window.localStorage.setItem("myCharacters", JSON.stringify(knightJson));
  myCharacters = JSON.parse(window.localStorage.getItem("myCharacters"));
} else {
  myCharacters = JSON.parse(window.localStorage.getItem("myCharacters"));
  // localStorage.removeItem("myCharacters");
}

document.getElementById("makeRoom").addEventListener("click", makeRoom);
document.getElementById("enterRoom").addEventListener("click", enterRoom);
function makeRoom() {
  socket.emit("CreateRoom");
  if (myCharacters.findIndex((i) => i == "wolf") == -1) {
    myCharacters.push("wolf");
    window.localStorage.removeItem("myCharacters");
    window.localStorage.setItem("myCharacters", JSON.stringify(myCharacters));
  }
}
function enterRoom() {
  const inviteCode = document.getElementById("inviteCode").value;
  socket.emit("enterRoom", inviteCode);
}

socket.on("CreateRoom", (data) => {
  document.getElementById("GetCode").style.visibility = "visible";
  document.getElementById("GetCode").innerHTML = data;
  roomID = data;
});

socket.on("joinError", () => {
  alert("초대번호가 잘못되었습니다");
});

socket.on("showArButton", (data) => {
  document.getElementById("overlay").style.visibility = "visible";
  roomID = data;
});

socket.on("executeTurn", (data) => {
  if (data.player1.id == socket.id) {
    //player1이 나일때
    if (data.player1.command == "attack") {
      myAttack(data.player1.character);
    } else if (data.player1.command == "defense") {
      myDefense(data.player1.character);
    } else {
      myCounter(data.player1.character);
    }
    setTimeout(() => {
      if (data.player2.command == "attack") {
        enemyAttack(data.player2.character);
        if (data.player1.command == "attack") {
          hp -= 10;
          enemyHP -= 10;
        } else if (data.player1.command == "defense") {
          hp -= 5;
        } else {
          enemyHP -= 30;
        }
      }
      if (data.player2.command == "defense") {
        enemyDefense(data.player2.character);
        if (data.player1.command == "attack") {
          enemyHP -= 5;
        } else if (data.player1.command == "defense") {
          hp -= 5;
          enemyHP -= 5;
        } else {
          hp -= 10;
        }
      }
      if (data.player2.command == "counter") {
        enemyCounter(data.player2.character);
        if (data.player1.command == "attack") {
          hp -= 30;
        } else if (data.player1.command == "defense") {
          enemyHP -= 10;
        } else {
          hp -= 15;
          enemyHP -= 15;
        }
      }
    }, 3000);
  } else {
    //player2가 나일때
    if (data.player1.command == "attack") {
      enemyAttack(data.player1.character);
    } else if (data.player1.command == "defense") {
      enemyDefense(data.player1.character);
    } else {
      enemyCounter(data.player1.character);
    }
    setTimeout(() => {
      if (data.player2.command == "attack") {
        myAttack(data.player2.character);
        if (data.player1.command == "attack") {
          hp -= 10;
          enemyHP -= 10;
        } else if (data.player1.command == "defense") {
          enemyHP -= 5;
        } else {
          hp -= 30;
        }
      }
      if (data.player2.command == "defense") {
        myDefense(data.player2.character);
        if (data.player1.command == "attack") {
          hp -= 5;
        } else if (data.player1.command == "defense") {
          hp -= 5;
          enemyHP -= 5;
        } else {
          enemyHP -= 10;
        }
      }
      if (data.player2.command == "counter") {
        myCounter(data.player2.character);
        if (data.player1.command == "attack") {
          enemyHP -= 30;
        } else if (data.player1.command == "defense") {
          hp -= 10;
        } else {
          hp -= 15;
          enemyHP -= 15;
        }
      }
    }, 3000);
  }

  setTimeout(() => {
    commandFlag = false;
    document.getElementById("hpBar").innerHTML = `HP - ${hp}`;
  }, 6000);
  //commandFlag = false;
});
//스테이지 모델로 스테이지 설정
//제한시간
//hp안배
//방 정보
async function myAttack(character) {
  //const playerModel = await model.children[0];
  const playerModel = await targetModel.children[0];
  const interval = await setInterval(() => {
    if (playerModel.position.z < 0.4) {
      playerModel.position.z += 0.05;
    } else {
      // const clip = THREE.AnimationClip.findByName(
      //   knightClips,
      //   knightAnimations.attack
      // );
      const clip = THREE.AnimationClip.findByName(
        eval(`${character}Clips`),
        eval(`${character}Animations`).attack
      );
      const action = myMixer.clipAction(clip);
      action.play();
    }
  }, 10);

  await setTimeout(() => {
    clearInterval(interval);

    const newInterval = setInterval(() => {
      if (playerModel.position.z >= -0.5) {
        playerModel.position.z -= 0.05;
        // const clip = THREE.AnimationClip.findByName(
        //   knightClips,
        //   knightAnimations.idle
        // );
        const clip = THREE.AnimationClip.findByName(
          eval(`${character}Clips`),
          eval(`${character}Animations`).idle
        );
        myMixer.stopAllAction();
        const action = myMixer.clipAction(clip);
        action.play();
      } else {
        clearInterval(newInterval);
      }
    }, 10);
  }, 2000);
}

function myDefense(character) {
  // const clip = THREE.AnimationClip.findByName(
  //   knightClips,
  //   knightAnimations.defense
  // );
  const clip = THREE.AnimationClip.findByName(
    eval(`${character}Clips`),
    eval(`${character}Animations`).defense
  );
  myMixer.stopAllAction();
  const action = myMixer.clipAction(clip);
  action.play();
}

function myCounter(character) {
  // const clip = THREE.AnimationClip.findByName(
  //   knightClips,
  //   knightAnimations.defense
  // );
  const clip = THREE.AnimationClip.findByName(
    eval(`${character}Clips`),
    eval(`${character}Animations`).defense
  );
  myMixer.stopAllAction();
  const action = myMixer.clipAction(clip);
  action.play();
}

async function enemyAttack(character) {
  const enemyModel = await targetModel.children[2];
  const interval = await setInterval(() => {
    if (enemyModel.position.z > -0.4) {
      enemyModel.position.z -= 0.05;
    } else {
      // const clip = THREE.AnimationClip.findByName(
      //   knightClips,
      //   knightAnimations.attack
      // );
      const clip = THREE.AnimationClip.findByName(
        eval(`${character}Clips`),
        eval(`${character}Animations`).attack
      );
      const action = EnemyMixer.clipAction(clip);
      action.play();
    }
  }, 10);

  await setTimeout(() => {
    clearInterval(interval);

    const newInterval = setInterval(() => {
      if (enemyModel.position.z <= 0.5) {
        enemyModel.position.z += 0.05;
        // const clip = THREE.AnimationClip.findByName(
        //   knightClips,
        //   knightAnimations.idle
        // );
        const clip = THREE.AnimationClip.findByName(
          eval(`${character}Clips`),
          eval(`${character}Animations`).idle
        );
        EnemyMixer.stopAllAction();
        const action = EnemyMixer.clipAction(clip);
        action.play();
      } else {
        clearInterval(newInterval);
      }
    }, 10);
  }, 2000);
}

function enemyCounter() {
  // const clip = THREE.AnimationClip.findByName(
  //   knightClips,
  //   knightAnimations.defense
  // );
  const clip = THREE.AnimationClip.findByName(
    eval(`${character}Clips`),
    eval(`${character}Animations`).defense
  );
  EnemyMixer.stopAllAction();
  const action = EnemyMixer.clipAction(clip);
  action.play();
}

function enemyDefense() {
  // const clip = THREE.AnimationClip.findByName(
  //   knightClips,
  //   knightAnimations.defense
  // );
  const clip = THREE.AnimationClip.findByName(
    eval(`${character}Clips`),
    eval(`${character}Animations`).defense
  );
  EnemyMixer.stopAllAction();
  const action = EnemyMixer.clipAction(clip);
  action.play();
}

const initScene = (gl, session) => {
  //-- scene, camera(threeJs의 카메라, 씬 설정)
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  //---

  //--- light(빛 설정, 빛 설정을 하지 않으면 오브젝트가 검정색으로밖에 보이지 않는다)
  const light = new THREE.PointLight(0xffffff, 2, 100); // soft white light
  scene.add(light);
  //---
  // create and configure three.js renderer with XR support
  //XR을 사용하기 위해 threeJs의 renderer를 만들고 설정
  renderer = new THREE.WebGLRenderer({
    antialias: true, //위신호 제거
    alpha: true, //캔버스에 알파(투명도)버퍼가 있는지 여부
    autoClear: true, //프레임을 렌더링하기 전에 출력을 자동적으로 지우는지 여부
    context: gl, //기존 RenderingContext에 렌더러를 연결(gl)
  });

  // const loader = new ColladaLoader();
  // loader.load("model.dae", (collada) => {
  //   const box = new THREE.Box3().setFromObject(collada.scene);
  //   const c = box.getCenter(new THREE.Vector3());
  //   const size = box.getSize(new THREE.Vector3());

  //   collada.scene.position.set(-c.x, size.y / 2 - c.y, -c.z);
  //   collada.scene.scale.set(0.001, 0.001, 0.001);
  //   model = new THREE.Object3D();
  //   model.add(collada.scene);
  // });

  const gltfLoader = new GLTFLoader();
  gltfLoader.load("knight.gltf", (gltf) => {
    knight = gltf.scene;

    knight.scale.set(0.1, 0.1, 0.1);

    knightClips = gltf.animations;
    knightAnimations = {
      idle: "knight_idle",
      defense: "knight_shield_block",
      attack: "knight_attack_2_heavy_weapon",
    };
    copyKnight = SkeletonUtils.clone(gltf.scene);
    copyKnight.rotateY(Math.PI);
    gltfLoader.load("wolf.glb", (glb) => {
      wolf = glb.scene;
      wolf.scale.set(0.3, 0.3, 0.3);
      const box = new THREE.Box3().setFromObject(wolf);
      const c = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      wolf.position.set(-c.x, size.y / 2 - c.y, -c.z);
      wolfClips = glb.animations;
      wolfAnimations = {
        idle: "04_Idle_Armature_0",
        defense: "03_creep_Armature_0",
        attack: "01_Run_Armature_0",
      };

      copyWolf = SkeletonUtils.clone(glb.scene);
      copyWolf.position.set(-c.x, size.y / 2 - c.y, -c.z);
      copyWolf.rotateY(Math.PI);

      gltfLoader.load("out.glb", (dogModel) => {
        dog = dogModel.scene;

        dog.scale.set(0.1, 0.1, 0.1);

        const box = new THREE.Box3().setFromObject(dog);
        const c = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        dog.position.set(-c.x, size.y / 2 - c.y, -c.z);

        dogClips = dogModel.animations;
        dogAnimations = {
          idle: "Idle",
          defense: "Death",
          attack: "Jump",
        };

        copyDog = SkeletonUtils.clone(dogModel.scene);
        copyDog.rotateY(Math.PI);

        div = document.createElement("div");
        div.style.borderStyle = "double";
        div.style.position = "absolute";
        div.style.left = "50%";
        div.style.transform = "translateX(-50%)";
        div.style.top = "40%";
        div.style.width = "10em";
        div.style.backgroundColor = "white";

        for (let i = 0; i < myCharacters.length; i++) {
          let child = document.createElement("div");
          child.style.marginTop = "2em";
          child.style.marginBottom = "2em";
          child.style.borderStyle = "double";
          console.log(myCharacters[i]);
          child.innerHTML = myCharacters[i];
          //child.addEventListener("click", cha_select(myCharacters[i]));
          switch (myCharacters[i]) {
            case "knight":
              child.addEventListener("click", cha_knight);
              break;
            case "wolf":
              child.addEventListener("click", cha_wolf);
              break;
            case "dog":
              child.addEventListener("click", cha_dog);
          }
          div.appendChild(child);
        }
        //document.appendChild(div);
        document.getElementById("overlay").appendChild(div);
      });
    });
  });

  const loader = new ColladaLoader();
  loader.load("model.dae", (collada) => {
    collada.scene.scale.set(0.0035, 0.0035, 0.0035);
    const box = new THREE.Box3().setFromObject(collada.scene);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    collada.scene.position.set(-c.x, size.y / 2 - c.y - 0.12, -c.z);
    stage = collada.scene;
  });

  model = new THREE.Object3D();

  controller = renderer.xr.getController(0);
  renderer.setPixelRatio(window.devicePixelRatio); //장치 픽셀 비율 설정
  renderer.setSize(window.innerWidth, window.innerHeight); //사이즈 설정
  renderer.xr.enabled = true; //renderer로 xr을 사용할지 여부
  renderer.xr.setReferenceSpaceType("local"); //
  renderer.xr.setSession(session);
  document.body.appendChild(renderer.domElement);

  getGPS();
  //---
};

function cha_wolf() {
  if (wolf && !selectFlag) {
    selectCharacter(wolf, "wolf");
    myMixer = new THREE.AnimationMixer(wolf);
    const clip = THREE.AnimationClip.findByName(wolfClips, wolfAnimations.idle);
    const action = myMixer.clipAction(clip);
    action.play();
    selectFlag = true;
  }
}

function cha_knight() {
  if (knight && !selectFlag) {
    // knight.position.set(0, 0, -0.5);
    // model.add(knight);
    // selectFlag = true;
    console.log("클릭됨");
    selectCharacter(knight, "knight");
    myMixer = new THREE.AnimationMixer(knight);
    const clip = THREE.AnimationClip.findByName(
      knightClips,
      knightAnimations.idle
    );
    const action = myMixer.clipAction(clip);
    action.play();
    selectFlag = true;
  }
}

function cha_dog() {
  if (dog && !selectFlag) {
    selectCharacter(dog, "dog");
    myMixer = new THREE.AnimationMixer(dog);
    const clip = THREE.AnimationClip.findByName(dogClips, dogAnimations.idle);
    const action = myMixer.clipAction(clip);
    action.play();
    selectFlag = true;
  }
}

// function cha_select(character) {
//   const evalCha = eval(character);
//   if (evalCha && !selectFlag) {
//     selectCharacter(evalCha, character);
//     console.log(eval(`${character}Clips`), eval(`${character}Animations`));
//     myMixer = new THREE.AnimationMixer();
//     const clip = THREE.AnimationClip.findByName(
//       eval(`${character}Clips`),
//       eval(`${character}Animations`).idle
//     );
//     const action = myMixer.clipAction(clip);
//     action.play();
//     selectFlag = true;
//   }
// }

function selectCharacter(object, name) {
  object.position.set(0, 0, -0.5);
  model.add(object);
  socket.emit("selectCharacter", {
    name,
    roomID,
  });
}

function attack() {
  if (!commandFlag) {
    socket.emit("command", {
      command: "attack",
      roomID: roomID,
    });
    commandFlag = true;
  }
}

function defense() {
  if (!commandFlag) {
    socket.emit("command", {
      command: "defense",
      roomID: roomID,
    });
    commandFlag = true;
  }
}

function counter() {
  if (!commandFlag) {
    socket.emit("command", {
      command: "counter",
      roomID: roomID,
    });
    commandFlag = true;
  }
}

// AR세션을 시작하는 버튼
const xrButton = document.getElementById("xr-button");
// xrSession
let xrSession = null;
// xrReferenceSpace
let xrRefSpace = null;

//렌더링을 위한 캔버스 OpenGL 컨텍스트
let gl = null;

const fakeGps = {
  lat: 36.317939,
  lon: 127.367622,
};

function checkXR() {
  if (!window.isSecureContext) {
    //WebXR은 https환경에서만 사용가능.
    document.getElementById("warning").innerText =
      "WebXR unavailable. Please use secure context";
  }
  if (navigator.xr) {
    //navigator.xr을 지원하는지 여부
    navigator.xr.addEventListener("devicechange", checkSupportedState);
    checkSupportedState();
  } else {
    document.getElementById("warning").innerText =
      "WebXR unavailable for this browser";
  }
}

function checkSupportedState() {
  navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
    //ArCore를 지원하는 디바이스의 크롬 브라우저인지 여부
    if (supported) {
      xrButton.innerHTML = "Enter AR";
      xrButton.addEventListener("click", onButtonClicked);
    } else {
      xrButton.innerHTML = "AR not found";
    }
    xrButton.disabled = !supported;
  });
}

function onButtonClicked() {
  if (!xrSession) {
    navigator.xr
      .requestSession("immersive-ar", {
        //세션요청
        optionalFeatures: ["dom-overlay"], //옵션(ex: dom-overlay, hit-test 등)
        //requiredFeatures: ['unbounded', 'hit-test'], //필수옵션
        domOverlay: {
          root: document.getElementById("overlay"),
        }, //dom-overlay사용시 어떤 요소에 적용할 것인지 명시
      })
      .then(onSessionStarted, onRequestSessionError);
  } else {
    xrSession.end();
  }
}

function onSessionStarted(session) {
  //세션요청을 성공하면 session값이 반환됨
  xrSession = session;
  xrButton.innerHTML = "Exit AR";

  if (session.domOverlayState) {
    info.innerHTML = "오브젝트가 설치될 때까지 움직이지 말아주세요!"; //session의 dom overlay타입 명시. Ar환경에서는
  }

  // create a canvas element and WebGL context for rendering
  //렌더링을 위한 캔버스 요소와 WebGL 컨텍스트를 만듬
  session.addEventListener("end", onSessionEnded);
  let canvas = document.createElement("canvas"); //HTML5 Canvas
  gl = canvas.getContext("webgl", {
    xrCompatible: true,
  });
  session.updateRenderState({
    baseLayer: new XRWebGLLayer(session, gl),
  }); //세션의 레이어 설정

  // here we ask for viewer reference space, since we will be casting a ray
  // from a viewer towards a detected surface. The results of ray and surface intersection
  session.requestReferenceSpace("viewer").then((refSpace) => {
    xrRefSpace = refSpace;
    //xrRefSpace -> viewer ReferenceSpace
    session.requestAnimationFrame(onXRFrame);
    //onXRFrame을 호출
  });

  // three.js의 씬을 초기화
  initScene(gl, session);
}

function onRequestSessionError(ex) {
  info.innerHTML = "Failed to start AR session.";
  console.error(ex.message);
}

function onSessionEnded(event) {
  //세션을 끝냈을때
  xrSession = null;
  xrButton.innerHTML = "Enter AR";
  info.innerHTML = "";
  gl = null;
}

function getGPS() {
  window.addEventListener("deviceorientationabsolute", handleMotion, true);
  function success(position) {
    gps = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
    };

    socket.emit("sendPlayerInfo", {
      roomID: roomID,
      id: socket.id,
      // gps: gps,
      //--- 테스트 코드
      gps: fakeGps,
      //-------------
      //degree: compassDegree,
    });
  }

  function error() {
    //alert("error");
    console.log("error");
  }
  const options = {
    enableHighAccuracy: true,
    maximumAge: 300000,
    timeout: 27000,
  };
  watch = navigator.geolocation.watchPosition(success, error, options);
}

function handleMotion(event) {
  const compass = event.webkitCompassHeading || Math.abs(event.alpha - 360);
  compassDegree = Math.ceil(compass);
}

function updateAnimation(time) {
  //threeJs의 오브젝트들의 애니메이션을 넣는 곳
  time *= 0.001;
  const deltaTime = time - then;
  then = time;
  if (myMixer && EnemyMixer) {
    myMixer.update(deltaTime);
    EnemyMixer.update(deltaTime);
  }

  // if (distance && model) {
  //   model.scale.set(distance / 10, distance / 10, distance / 10);
  // }
  if (distance && targetModel) {
    targetModel.scale.set(distance / 4, distance / 4, distance / 4);
  }
}

function onXRFrame(t, frame) {
  let session = frame.session; //매 프레임의 session
  let xrViewerPose = frame.getViewerPose(xrRefSpace); //xrViewerPose
  if (xrViewerPose) {
    const viewPos = xrViewerPose.views[0].transform.position;
    playerVector = new THREE.Vector3(viewPos.x, viewPos.y, viewPos.z);
  }
  session.requestAnimationFrame(onXRFrame); //onXRFrame을 반복 호출

  updateAnimation(t);
  //WebXr로 생성된 gl 컨텍스트를 threeJs 렌더러에 바인딩
  gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer);
  //threeJs의 씬을 렌더링
  renderer.render(scene, camera);
}

checkXR(); //브라우저가 로딩되면 checkXR을 실행

//socket

socket.on("sendPlayerInfo", async (data) => {
  //players
  if (data.player1.id == socket.id) {
    otherPlayer = await data.player2;
  } else {
    otherPlayer = await data.player1;
  }
  if (otherPlayer && !otherObject && model && targetModel) {
    // const dlat = -(otherPlayer.gps.lat - gps.lat);
    // const dlon = -(otherPlayer.gps.lon - gps.lon);
    //--- 테스트 코드
    const dlat = -(otherPlayer.gps.lat - fakeGps.lat);
    const dlon = -(otherPlayer.gps.lon - fakeGps.lon);
    //----------------
    const x = dlat * 11100;
    const z = dlon * 11100;
    distance = Math.sqrt(x * x + z * z);
    targetModel.position.set(0, -1, z / 2).applyMatrix4(controller.matrixWorld);
    targetModel.quaternion.setFromRotationMatrix(controller.matrixWorld);
    targetModel.rotateY((-45 * Math.PI) / 180);

    otherObject = new THREE.Object3D();
    // otherObject.add(model);
    otherObject.add(targetModel);
    const angle = -((Math.atan2(z, x) * 180) / Math.PI);
    let realAngle = 0;
    if (angle < 0) {
      realAngle = -angle - compassDegree;
    } else {
      realAngle = angle + 180 - compassDegree;
    }
    otherObject.rotateY((-realAngle / 180) * Math.PI);
    otherObject.name = otherPlayer.id;
    scene.add(otherObject);
    info.innerHTML = `확인해보세요! 당신의 compass값은${compassDegree}`;

    document.getElementById("commandList").style.visibility = "visible";
    document.getElementById("hpBar").style.visibility = "visible";
    xrButton.style.visibility = "hidden";

    document.getElementById("attack").addEventListener("click", attack);
    document.getElementById("defence").addEventListener("click", defense);
    document.getElementById("counter").addEventListener("click", counter);
  }

  socket.on("disconnectOtherPlayer", () => {
    //여기서 상대방 접속 끊겼을 때 할ㄹ 처리...
  });
  socket.on("selectCharacter", (data) => {
    if (data.player1.id == socket.id) {
      const copy = findModel(data.player2.character);
      //const copy = SkeletonUtils.clone(OtherModel);
      copy.position.set(0, 0, 0.5);
      copy.scale.set(0.1, 0.1, 0.1);
      ///copy.rotateY(Math.PI);
      model.add(stage);
      model.add(copy);
      EnemyMixer = new THREE.AnimationMixer(copy);
      //document.getElementById("setup").style.visibility = "hidden";
      div.style.visibility = "hidden";
      //const clip = THREE.AnimationClip.findByName(knightClips, "knight_idle");
      const clip = THREE.AnimationClip.findByName(
        eval(`${data.player2.character}Clips`),
        eval(`${data.player2.character}Animations`).idle
      );
      const action = EnemyMixer.clipAction(clip);
      action.play();
      targetModel = model;
    } else {
      const copy = findModel(data.player1.character);
      copy.position.set(0, 0, 0.5);
      copy.scale.set(0.1, 0.1, 0.1);
      // copy.rotateY(Math.PI);
      model.add(stage);
      model.add(copy);
      EnemyMixer = new THREE.AnimationMixer(copy);
      //document.getElementById("setup").style.visibility = "hidden";
      div.style.visibility = "hidden";
      // const clip = THREE.AnimationClip.findByName(knightClips, "knight_idle");
      const clip = THREE.AnimationClip.findByName(
        eval(`${data.player2.character}Clips`),
        eval(`${data.player2.character}Animations`).idle
      );
      const action = EnemyMixer.clipAction(clip);
      action.play();
      targetModel = model;
    }
  });

  function findModel(name) {
    switch (name) {
      case "knight":
        return copyKnight;
        break;
      case "wolf":
        return copyWolf;
        break;
      case "dog":
        return copyDog;
        break;
    }
  }
  // if (otherPlayer && otherObject && model) {
  //   // const dlat = -(otherPlayer.gps.lat - gps.lat);
  //   // const dlon = -(otherPlayer.gps.lon - gps.lon);
  //   const dlat = -(otherPlayer.gps.lat - fakeGps.lat);
  //   const dlon = -(otherPlayer.gps.lon - fakeGps.lon);
  //   const x = dlat * 11100;
  //   const z = dlon * 11100;
  //   model.position.set(0, 0, 0);
  //   model.rotation.set(0, 0, 0);
  //   model.position.set(0, -1.5, z).applyMatrix4(controller.matrixWorld);
  //   model.quaternion.setFromRotationMatrix(controller.matrixWorld);

  //   const angle = (Math.atan2(z, x) * 180) / Math.PI - compassDegree;
  //   info.innerHTML = `확인해보세요! 당신의 compass값은${compassDegree}`;
  //   let realAngle = 0;
  //   if (angle < 0) {
  //     realAngle = angle + 360;
  //   }
  //   if (angle > 360) {
  //     realAngle = angle - 360;
  //   }

  //   const targetObj = scene.getObjectByName(otherPlayer.id, true);
  //   targetObj.rotation.set(0, 0, 0);
  //   targetObj.rotateY((-realAngle / 180) * Math.PI);
  // }
});
