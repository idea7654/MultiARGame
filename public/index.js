// import * as THREE from "https://unpkg.com/three/build/three.module.js";
// import { ColladaLoader } from "https://threejs.org/examples/jsm/loaders/ColladaLoader.js";
// import { GLTFLoader } from "https://threejs.org/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "https://unpkg.com/three@0.126.1/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js";
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
const socket = io.connect("https://b1c844c0bfd8.ngrok.io");
//--- Animation ---
let clips = null;
let mixer = null;
let EnemyMixer = null;
let then = 0;
//-----------------
let roomID = null;
let distance = null;
let commandFlag = false;
let hp = 100;
let enemyHP = 100;
let targetModel = null;

document.getElementById("makeRoom").addEventListener("click", makeRoom);
document.getElementById("enterRoom").addEventListener("click", enterRoom);
function makeRoom() {
  socket.emit("CreateRoom");
}
function enterRoom() {
  const inviteCode = document.getElementById("inviteCode").value;
  socket.emit("enterRoom", inviteCode);
}

socket.on("CreateRoom", (data) => {
  document.getElementById("GetCode").style.visibility = "visible";
  console.log(data);
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
      myAttack();
    } else if (data.player1.command == "defense") {
      myDefense();
    } else {
      myCounter();
    }
    setTimeout(() => {
      if (data.player2.command == "attack") {
        enemyAttack();
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
        enemyDefense();
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
        enemyCounter();
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
      enemyAttack();
    } else if (data.player1.command == "defense") {
      enemyDefense();
    } else {
      enemyCounter();
    }
    setTimeout(() => {
      if (data.player2.command == "attack") {
        myAttack();
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
        myDefense();
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
        myCounter();
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

async function myAttack() {
  //const playerModel = await model.children[0];
  const playerModel = await targetModel.children[0];
  const interval = await setInterval(() => {
    if (playerModel.position.z < 0.4) {
      playerModel.position.z += 0.05;
    } else {
      const clip = THREE.AnimationClip.findByName(
        clips,
        "knight_attack_2_heavy_weapon"
      );
      const action = mixer.clipAction(clip);
      action.play();
    }
  }, 10);

  await setTimeout(() => {
    clearInterval(interval);

    const newInterval = setInterval(() => {
      if (playerModel.position.z >= -0.5) {
        playerModel.position.z -= 0.05;
        const clip = THREE.AnimationClip.findByName(clips, "knight_idle");
        mixer.stopAllAction();
        const action = mixer.clipAction(clip);
        action.play();
      } else {
        clearInterval(newInterval);
      }
    }, 10);
  }, 2000);
}

function myDefense() {
  const clip = THREE.AnimationClip.findByName(clips, "knight_shield_block");
  mixer.stopAllAction();
  const action = mixer.clipAction(clip);
  action.play();
}

function myCounter() {
  const clip = THREE.AnimationClip.findByName(clips, "knight_shield_block");
  mixer.stopAllAction();
  const action = mixer.clipAction(clip);
  action.play();
}

async function enemyAttack() {
  // const enemyModel = await model.children[1];
  const enemyModel = await targetModel.children[1];
  const interval = await setInterval(() => {
    if (enemyModel.position.z > -0.4) {
      enemyModel.position.z -= 0.05;
    } else {
      const clip = THREE.AnimationClip.findByName(
        clips,
        "knight_attack_2_heavy_weapon"
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
        const clip = THREE.AnimationClip.findByName(clips, "knight_idle");
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
  const clip = THREE.AnimationClip.findByName(clips, "knight_shield_block");
  EnemyMixer.stopAllAction();
  const action = EnemyMixer.clipAction(clip);
  action.play();
}

function enemyDefense() {
  const clip = THREE.AnimationClip.findByName(clips, "knight_shield_block");
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
    const copy = SkeletonUtils.clone(gltf.scene);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    gltf.scene.position.set(-c.x, size.y / 2 - c.y, -c.z);
    gltf.scene.scale.set(0.1, 0.1, 0.1);
    model = new THREE.Object3D();
    gltf.scene.position.set(0, 0, -0.5);
    //gltf.scene.rotateY(Math.PI);
    model.add(gltf.scene);
    copy.scale.set(0.1, 0.1, 0.1);
    copy.position.set(0, 0, 0.5);
    copy.rotateY(Math.PI);
    model.add(copy);

    mixer = new THREE.AnimationMixer(gltf.scene);
    clips = gltf.animations;

    EnemyMixer = new THREE.AnimationMixer(copy);

    const clip = THREE.AnimationClip.findByName(clips, "knight_idle");
    const action = mixer.clipAction(clip);
    action.play();

    const EnemyClip = THREE.AnimationClip.findByName(
      clips,
      "knight_walk_in_place"
    );
    const EnemyAction = EnemyMixer.clipAction(EnemyClip);
    EnemyAction.play();

    document.getElementById("setup").style.visibility = "visible";
    document.getElementById("setup").addEventListener("click", setUp);
  });

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

function setUp() {
  targetModel = model;
  document.getElementById("setup").style.visibility = "hidden";
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
      gps: fakeGps,
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
  if (mixer && EnemyMixer) {
    mixer.update(deltaTime);
    EnemyMixer.update(deltaTime);
  }

  // if (distance && model) {
  //   model.scale.set(distance / 10, distance / 10, distance / 10);
  // }
  if (distance && targetModel) {
    targetModel.scale.set(distance / 10, distance / 10, distance / 10);
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
    const dlat = -(otherPlayer.gps.lat - fakeGps.lat);
    const dlon = -(otherPlayer.gps.lon - fakeGps.lon);
    const x = dlat * 11100;
    const z = dlon * 11100;
    distance = Math.sqrt(x * x + z * z);
    // model.position.set(0, -1, z / 2).applyMatrix4(controller.matrixWorld);
    // model.quaternion.setFromRotationMatrix(controller.matrixWorld);
    // model.rotateY((-45 * Math.PI) / 180);
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
