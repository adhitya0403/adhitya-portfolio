import * as THREE from "three";
import { OrbitControls } from "./utils/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import gsap from "gsap";
import { projects } from "./data/projects.js";
import { techStack } from "./data/techStack.js";
import { achievements } from "./data/achievements.js";
import { contactData } from "./data/contact.js";
import { aboutData } from "./data/about.js";
import { controlsHint } from "./data/controlsHint.js";
import { CAMERA_START, CAMERA_FINAL, TARGET_FINAL } from "./utils/variables.js";

// dom target elements
const canvas = document.querySelector("canvas");

const modals = {
  work: document.querySelector(".modal.work"),
  about: document.querySelector(".modal.about"),
  contact: document.querySelector(".modal.contact"),
};

const panels = {
  projects: {
    element: document.querySelector(".project-panel"),
    display: "grid",
  },
  tech: {
    element: document.querySelector(".tech-panel"),
    display: "grid",
  },
  achievements: {
    element: document.querySelector(".achievements-panel"),
    display: "flex",
  },
};

//tabs
const tabs = document.querySelectorAll(".modal-tabs .tab");

//links
const links = document.querySelectorAll("[data-contact]");

//about
const about = document.querySelector(".about-content");

//bgm
const bgm = document.getElementById("bgm");
bgm.volume = 0.12;

//loading and enter screen
const loader = document.querySelector(".loader");
const enterScreen = document.querySelector(".enter-screen");
const enterBtn = document.querySelector(".enter-button");

//hint
const hint = document.querySelectorAll(".controls-hint");

//sound
const soundToggle = document.querySelector(".sound-toggle");

// dom manipulation
about.innerHTML = `
  <div class="about-header">
    <img
      src="${aboutData.avatar.src}"
      alt="${aboutData.avatar.alt}"
      class="about-avatar"
    />

    <h2>
     ${aboutData.intro.replace(". ", ".<br />")}
    </h2>
  </div>

  <div class="about-body">
    ${aboutData.paras.map((text) => `<p>${text}</p>`).join("")}
  </div>
`;

panels.projects.element.innerHTML = projects
  .map(
    (project) =>
      `
<div class="project elevated-card">
  <img src="${project.image}" alt="${project.title}" />

  <div class="project-overview">
    <h1>${project.title}</h1>
    <p>${project.description}</p>
  </div>

  <div class="project-links">
    <a
      class="project-link ${!project.github ? "disabled" : ""}"
      ${
        project.github
          ? `href="${project.github}" target="_blank" rel="noopener"`
          : ""
      }
    >
      <img src="/icons/github.svg" alt="" aria-hidden="true" />
      GitHub
    </a>

    <a
      class="project-link ${!project.live ? "disabled" : ""}"
      ${
        project.live
          ? `href="${project.live}" target="_blank" rel="noopener"`
          : ""
      }
    >
      Live
      <img src="/icons/internet.png" alt="" aria-hidden="true" />
    </a>
  </div>
</div>
`,
  )
  .join("");

panels.tech.element.innerHTML = techStack
  .map(
    (tech) =>
      `<div class="tech-item elevated-card">
      <img src="${tech.icon}" alt="${tech.name}" />
      <span>${tech.name}</span>
    </div>`,
  )
  .join("");

panels.achievements.element.innerHTML = achievements
  .map(
    (item) => `
      <div class="achievement elevated-card">
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
    `,
  )
  .join("");

const resetAll = () => {
  Object.values(panels).forEach((p) => (p.element.style.display = "none"));
  tabs.forEach((t) => t.classList.remove("active"));
};

const showPanelAndTab = (panel, tab) => {
  panel.element.style.display = panel.display;
  tab.classList.add("active");
};

tabs.forEach((tab) => {
  tab.addEventListener("click", (e) => {
    const panelName = tab.dataset.panel;
    resetAll();
    const currentPanel = panels[panelName];

    showPanelAndTab(currentPanel, tab);
  });
});

links.forEach((icon) => {
  icon.addEventListener("click", () => {
    const key = icon.dataset.contact;
    const url = contactData[key];

    if (!url) return;

    window.open(url, "_blank");
  });
});

// shake effect for enter button
const enterShake = gsap.timeline({
  repeat: -1,
  repeatDelay: 2.5,
});

enterShake
  .to(enterBtn, {
    rotation: -3,
    duration: 0.05,
    ease: "power2.inOut",
  })
  .to(enterBtn, {
    rotation: 3,
    duration: 0.05,
    ease: "power2.inOut",
  })
  .to(enterBtn, {
    rotation: -3,
    duration: 0.05,
    ease: "power2.inOut",
  })
  .to(enterBtn, {
    rotation: 3,
    duration: 0.05,
    ease: "power2.inOut",
  })
  .to(enterBtn, {
    x: 0,
    rotation: 0,
    duration: 0.1,
    ease: "power3.out",
  });

enterShake.play();

// variables declaration
const zAxisFans = [];
const xAxisFans = [];
let chair = null;
const targets = [];
const animateObjects = [];
let currentTargets = [];
let isModalOpen = false;
let lastHovered = null;
let listener = null;
let keyClickSound = null;


const ANIMATION_TYPES = {
  SCALE_ONLY: "scale_only",
  SCALE_ROTATE: "scale_rotate",
  MOVE_ONLY: "move_only",
};

//audio purpose
let isMuted = false;

//audio
const popSound = new Audio("/sounds/bubble.mp3");
popSound.volume = 0.75;

// helper functions
const showModal = (modal) => {
  isModalOpen = true;
  controls.enabled = false;

  resetAll();
  showPanelAndTab(panels.projects, tabs[0]);

  modal.style.display = "flex";

  const card = modal.querySelector(".work-card, .about-card, .contact-card");

  gsap.set(card, {
    scale: 0.7,
    transformOrigin: "center center",
  });

  popSound.currentTime = 0;
  popSound.play();

  gsap.to(card, {
    scale: 1,
    duration: 0.45,
    ease: "back.out(1.4)",
  });
};

const hideModal = (modal) => {
  const card = modal.querySelector(".work-card, .about-card, .contact-card");

  const scrollable = modal.querySelector(".work-content, .about-content");
  if (scrollable) scrollable.scrollTop = 0;

  popSound.volume = 0.25;
  popSound.currentTime = 0;
  popSound.play();

  gsap.to(card, {
    scale: 0,
    duration: 0.35,
    ease: "back.in(1.2)",
    onComplete: () => {
      modal.style.display = "none";
      isModalOpen = false;
      controls.enabled = true;
      popSound.volume = 0.4;
    },
  });
};

Object.values(modals).forEach((modal) => {
  modal.addEventListener("pointerdown", () => {
    hideModal(modal);
  });
});

document
  .querySelectorAll(".work-card, .about-card, .contact-card")
  .forEach((card) => {
    card.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
  });

function getCameraPreset() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const shortest = Math.min(screen.width, screen.height);
  const isPortrait = h > w;

  if (shortest < 768) {
    if (isPortrait) {
      return { pos: [34, 8, 33], maxDist: 45 };
    }
    return { pos: [15, 6, 14], maxDist: 20 };
  }

  if (shortest < 1024) {
    return { pos: [26, 8, 25], maxDist: 35 };
  }

  return { pos: [19, 8.5, 18], maxDist: 25 };
}

function animateByState(mesh) {
  if (mesh.userData.state === "pressed") return;

  const base = mesh.userData.base;
  const type = mesh.userData.animationType;

  if (!base || !type) return;

  // hard stop previous tweens
  gsap.killTweensOf(mesh.rotation);
  gsap.killTweensOf(mesh.position);

  if (mesh.userData.state === "hovered") {
    // SCALE ONLY
    if (type === ANIMATION_TYPES.SCALE_ONLY) {
      gsap.to(mesh.scale, {
        x: base.scale.x * 1.2,
        y: base.scale.y * 1.2,
        z: base.scale.z * 1.2,
        duration: 0.22,
        ease: "power3.out",
        overwrite: "auto",
      });
    }

    // SCALE + ROTATE
    if (type === ANIMATION_TYPES.SCALE_ROTATE) {
      gsap.to(mesh.scale, {
        x: base.scale.x * 1.2,
        y: base.scale.y * 1.2,
        z: base.scale.z * 1.2,
        duration: 0.22,
        ease: "power3.out",
        overwrite: "auto",
      });

      gsap.to(mesh.rotation, {
        x: base.rotation.x - THREE.MathUtils.degToRad(8),
        duration: 0.28,
        ease: "power3.out",
      });
    }

    // MOVE ONLY
    if (type === ANIMATION_TYPES.MOVE_ONLY) {
      const offset = mesh.userData.moveOffset;

      gsap.to(mesh.position, {
        x: base.position.x + offset.x,
        y: base.position.y + offset.y,
        z: base.position.z + offset.z,
        duration: 0.75,
        ease: "power4.out",
      });
    }
  }

  // IDLE
  if (mesh.userData.state === "idle") {
    if (
      type === ANIMATION_TYPES.SCALE_ONLY ||
      type === ANIMATION_TYPES.SCALE_ROTATE
    ) {
      gsap.to(mesh.scale, {
        x: base.scale.x,
        y: base.scale.y,
        z: base.scale.z,
        duration: 0.18,
        ease: "power3.out",
        overwrite: "auto",
      });
    }

    if (type === ANIMATION_TYPES.SCALE_ROTATE) {
      gsap.to(mesh.rotation, {
        x: base.rotation.x,
        duration: 0.25,
        ease: "power3.out",
      });
    }

    if (type === ANIMATION_TYPES.MOVE_ONLY) {
      gsap.to(mesh.position, {
        x: base.position.x,
        y: base.position.y,
        z: base.position.z,
        duration: 0.3,
        ease: "power3.out",
      });
    }
  }
}

function pressKey(mesh) {
  mesh.userData.state = "pressed";

  const base = mesh.userData.base;

  // kill only Y-scale tweens
  gsap.killTweensOf(mesh.scale);

  gsap.to(mesh.scale, {
    y: base.scale.y * 0.5, // press depth
    duration: 0.08,
    ease: "power2.in",
    yoyo: true,
    repeat: 1,
    overwrite: "auto",
    onComplete: () => {
      mesh.userData.state = "idle";
      animateByState(mesh);
    },
  });
}

function playKeySound() {
  if (!keyClickSound.buffer) return;

  keyClickSound.stop();
  keyClickSound.play();
}

function prepareTargetsForBuild() {
  animateObjects.forEach((mesh) => {
    const base = mesh.userData.build;
    if (!base) return;

    mesh.scale.copy(mesh.userData.build.scale).multiplyScalar(0.001);
  });
}

function playOpeningIntro() {
  controls.enabled = false;

  const preset = getCameraPreset();
  const [finalX, finalY, finalZ] = preset.pos;

  camera.position.set(CAMERA_START.x, CAMERA_START.y, CAMERA_START.z);

  controls.target.set(TARGET_FINAL.x, TARGET_FINAL.y, TARGET_FINAL.z);

  controls.maxDistance = preset.maxDist;
  controls.update();

  const CAMERA_DURATION = 4.5;
  const BUILD_START_DELAY = 0.2;

  gsap.to(camera.position, {
    x: finalX,
    y: finalY,
    z: finalZ,
    duration: CAMERA_DURATION,
    ease: "power3.out",
    onUpdate: () => {
      camera.lookAt(TARGET_FINAL.x, TARGET_FINAL.y, TARGET_FINAL.z);
    },
  });

  animateObjects.forEach((mesh, i) => {
    const base = mesh.userData.build;
    if (!base) return;

    const delay = BUILD_START_DELAY + i * 0.01;

    gsap.to(mesh.scale, {
      x: base.scale.x * 1.08,
      y: base.scale.y * 1.08,
      z: base.scale.z * 1.08,
      duration: 0.05,
      delay,
      ease: "power4.out",
    });

    gsap.to(mesh.scale, {
      x: base.scale.x,
      y: base.scale.y,
      z: base.scale.z,
      duration: 0.12,
      delay: delay + 0.05,
      ease: "power4.out",
    });

    gsap.to(mesh.position, {
      y: base.position.y,
      duration: 0.12,
      delay,
      ease: "power4.out",
    });
  });

  gsap.delayedCall(CAMERA_DURATION + 0.25, () => {
    controls.enabled = true;
  });
}

function applyCameraPresets() {
  const preset = getCameraPreset();

  camera.position.set(...preset.pos);
  controls.maxDistance = preset.maxDist;
  controls.target.set(1.3, 4, 1.3);
  controls.update();
}

//get hints
const getControlsHint = () => {
  const shortest = Math.min(screen.width, screen.height);

  // phones and tablets
  if (shortest < 1024) {
    return "mobile";
  }

  return "desktop";
};

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("#E2EEF7");

// Camera
const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  400,
);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

// raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// rotatation limits
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;

// zooming limits
controls.minDistance = 3;

// pan controls
controls.panSpeed = 0.4;

//speeds
controls.rotateSpeed = 0.4;
controls.zoomSpeed = 0.8;

// loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const cubeTextureLoader = new THREE.CubeTextureLoader();

const cubeMap = cubeTextureLoader
  .setPath("/hdri/")
  .load(["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]);

const textureLoader = new THREE.TextureLoader();

function loadBakedTexture(path) {
  const tex = textureLoader.load(path);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// textures
const textureSets = [
  { match: "first", texture: loadBakedTexture("/textures/first_set.webp") },
  { match: "second", texture: loadBakedTexture("/textures/second_set.webp") },
  { match: "third", texture: loadBakedTexture("/textures/third_set.webp") },
  { match: "fourth", texture: loadBakedTexture("/textures/fourth_set.webp") },
  { match: "fifth", texture: loadBakedTexture("/textures/fifth_set.webp") },
  { match: "sixth", texture: loadBakedTexture("/textures/sixth_set.webp") },

  { match: "cpu", texture: loadBakedTexture("/textures/cpu.webp") },
  { match: "mon", texture: loadBakedTexture("/textures/monitors.webp") },
  { match: "calendar", texture: loadBakedTexture("/textures/cal.webp") },
  { match: "trash", texture: loadBakedTexture("/textures/trash_can.webp") },
  { match: "drawer", texture: loadBakedTexture("/textures/drawer.webp") },
];

const glassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 1,
  transparent: true,
  opacity: 1,

  ior: 1.45,
  roughness: 0.05,

  envMap: cubeMap,
  envMapIntensity: 1.5,

  thickness: 0.05,
  depthWrite: false,
});

// Load Model and traverse
gltfLoader.load("/models/Room_Portfolio.glb", (gltf) => {
  scene.add(gltf.scene);

  gltf.scene.traverse((mesh) => {
    if (!mesh.isMesh) return;

    if (mesh.name == "glass") {
      mesh.material = glassMaterial;
    }

    if (mesh.name.includes("Fan")) {
      if (mesh.name.includes("Fan_4")) {
        xAxisFans.push(mesh);
      } else {
        zAxisFans.push(mesh);
      }
    }

    if (mesh.name.includes("click") || mesh.name.includes("target")) {
      targets.push(mesh);
    }

    if (mesh.name.includes("chair")) {
      chair = mesh;
      mesh.userData.baseRotationY = mesh.rotation.y;
    }

    // base tranform defaults
    mesh.userData.base = {
      scale: mesh.scale.clone(),
      rotation: mesh.rotation.clone(),
      position: mesh.position.clone(),
    };

    mesh.userData.state = "idle";

    // animation behavior by name
    if (mesh.name.includes("hover_1") || mesh.name.includes("click")) {
      mesh.userData.animationType = ANIMATION_TYPES.SCALE_ONLY;
    } else if (mesh.name.includes("hover_3")) {
      mesh.userData.animationType = ANIMATION_TYPES.MOVE_ONLY;
      mesh.userData.moveOffset = new THREE.Vector3(0.4, 0, 0);
    } else if (mesh.name.includes("hover")) {
      mesh.userData.animationType = ANIMATION_TYPES.SCALE_ROTATE;
    }

    if (
      mesh.name.includes("hover_1") ||
      (mesh.name.includes("click") && !mesh.name.toLowerCase().includes("key"))
    ) {
      animateObjects.push(mesh);
      // store build base
      mesh.userData.build = {
        position: mesh.position.clone(),
        scale: mesh.scale.clone(),
      };
    }

    let bakedTexture = null;

    for (const set of textureSets) {
      if (mesh.name.toLowerCase().includes(set.match)) {
        bakedTexture = set.texture;
        break;
      }
    }

    if (!bakedTexture) return;

    mesh.material = new THREE.MeshBasicMaterial({
      map: bakedTexture,
    });

    mesh.material.needsUpdate = true;
  });

  loader.style.display = "none";
  enterScreen.style.display = "flex";

  applyCameraPresets();
  prepareTargetsForBuild();
});

enterBtn.addEventListener("pointerenter", () => {
  enterShake.pause();
  gsap.to(enterBtn, {
    scale: 1.12,
    duration: 0.25,
    ease: "power3.out",
  });
});

enterBtn.addEventListener("pointerleave", () => {
  gsap.to(enterBtn, {
    scale: 1,
    duration: 0.2,
    ease: "power2.out",
  });
  enterShake.play();
});

enterBtn.addEventListener("click", () => {
  enterShake.kill();

  // button feedback
  gsap.to(enterBtn, {
    scale: 0.95,
    duration: 0.08,
    yoyo: true,
    repeat: 1,
    ease: "power2.out",
  });

  if (!listener) {
    listener = new THREE.AudioListener();
    camera.add(listener);

    keyClickSound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load("/sounds/keyStroke.wav", (buffer) => {
      keyClickSound.setBuffer(buffer);
      keyClickSound.setVolume(0.35);
    });
  }

  // ---- START BGM (HTML audio) ----
  bgm.pause();
  bgm.currentTime = 0;
  bgm.volume = 0.05;
  bgm.muted = false;

  bgm
    .play()
    .then(() => {
      gsap.to(bgm, {
        volume: 0.25,
        duration: 2.5,
        ease: "power1.out",
      });
    })
    .catch((err) => {
      console.log("BGM blocked:", err);
    });

  // ---- UI POP SOUND ----
  popSound.pause();
  popSound.currentTime = 0;
  popSound.volume = 0.25;
  popSound.play().catch(() => {});

  // UI state
  enterScreen.style.display = "none";
  soundToggle.style.display = "block";

  playOpeningIntro();
});

const mode = getControlsHint();
hint.forEach((hint) => {
  hint.innerHTML = `<p>${controlsHint[mode]}</p>`;
});

// event listeners
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  applyCameraPresets();
});


window.addEventListener("pointerup", () => {
  if (isModalOpen) return;
  if (currentTargets.length === 0) return;

  const target = currentTargets[0].object;

  if (target.name.toLowerCase().includes("key")) {
    pressKey(target);
    playKeySound();
    return;
  }

  if (target.name.includes("work")) {
    showModal(modals.work);
  } else if (target.name.includes("about")) {
    showModal(modals.about);
  } else if (target.name.includes("contact")) {
    showModal(modals.contact);
  }
});

document.querySelectorAll(".modal-exit").forEach((btn) => {
  btn.addEventListener("pointerup", (e) => {
    e.stopPropagation();
    const modal = btn.closest(".modal");
    hideModal(modal);
  });
});

window.addEventListener("pointermove", (event) => {
  if (isModalOpen) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// controls.addEventListener("end", () => {
//   console.log("hello WTH")
//   controls.target.x = THREE.MathUtils.clamp(
//     controls.target.x,
//     PAN_LIMITS.minX,
//     PAN_LIMITS.maxX
//   );
//   controls.target.y = THREE.MathUtils.clamp(
//     controls.target.y,
//     PAN_LIMITS.minY,
//     PAN_LIMITS.maxY
//   );
//   controls.target.z = THREE.MathUtils.clamp(
//     controls.target.z,
//     PAN_LIMITS.minZ,
//     PAN_LIMITS.maxZ
//   );
// });



soundToggle.addEventListener("pointerdown", () => {
  isMuted = !isMuted;

  soundToggle.classList.toggle("muted", isMuted);

  if (!isMuted) {
    popSound.volume = 0.25;
    popSound.currentTime = 0;
    popSound.play();
  }

  // background music
  bgm.muted = isMuted;

  // sound effects
  popSound.muted = isMuted;
  keyClickSound.setVolume(isMuted ? 0 : 0.35);

  gsap.killTweensOf(soundToggle);

  gsap.to(soundToggle, {
    scale: 0.85,
    duration: 0.08,
    ease: "power2.out",
    onComplete: () => {
      gsap.to(soundToggle, {
        scale: 1,
        duration: 0.18,
        ease: "back.out(2)",
      });
    },
  });
});

// clock for rotations
const clock = new THREE.Clock();

// Loop
function animate() {
  //time
  const time = clock.getElapsedTime();

  controls.update();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);

  // Animate Fans
  zAxisFans.forEach((fan) => {
    fan.rotation.z += 0.1;
  });

  xAxisFans.forEach((fan) => {
    fan.rotation.x += 0.1;
  });

  if (chair) {
    const amplitude = Math.PI / 12;
    const speed = 0.8;

    chair.rotation.y =
      chair.userData.baseRotationY + Math.sin(time * speed) * amplitude;
  }

  // raycasting
  if (!isModalOpen) {
    raycaster.setFromCamera(mouse, camera);
    currentTargets = raycaster.intersectObjects(targets, false);
  } else {
    currentTargets = [];
  }

  if (currentTargets.length > 0) {
    const hitObject = currentTargets[0].object;

    if (
      hitObject.name.includes("pointer") ||
      hitObject.name.includes("click")
    ) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "default";
    }
  } else {
    document.body.style.cursor = "default";
  }

  const hovered = currentTargets.length > 0 ? currentTargets[0].object : null;

  //hover animations
  if (hovered !== lastHovered) {
    if (lastHovered) {
      lastHovered.userData.state = "idle";
      animateByState(lastHovered);
    }

    if (hovered) {
      hovered.userData.state = "hovered";
      animateByState(hovered);
    }

    lastHovered = hovered;
  }
}

animate();
