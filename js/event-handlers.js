"use strict";

export { setGLEvents, setMenuEvents };

const { mat4, mat3, vec3, vec4 } = glMatrix;
const mouseSpan = document.querySelector("#mouse-location");

function setMenuEvents() {
  const menu = document.querySelector(".menu");
  const hamburger = document.querySelector(".hamburger");
  const closeIcon = document.querySelector(".closeIcon");
  const menuIcon = document.querySelector(".menuIcon");

  hamburger.addEventListener("click", (e) => {
    if (menu.classList.contains("showMenu")) {
      menu.classList.remove("showMenu");
      closeIcon.style.display = "none";
      menuIcon.style.display = "block";
    } else {
      menu.classList.add("showMenu");
      closeIcon.style.display = "block";
      menuIcon.style.display = "none";
    }
  });

  const compileButton = document.querySelector("#compileButton");

  // Default dynamical system to plot f(z,c) = z^2 + c
  const fInput = document.querySelector("#fInput");
  fInput.value = "z^2 + c";

  // Default critical value to iterate is crit(c) = 0.0;
  const critInput = document.querySelector("#critInput");
  critInput.value = "0.0";

  // Default c for the Parameter plane is 0.0;
  const cInput = document.querySelector("#cInput");
  cInput.value = "i";

  const exampleSelect = document.querySelector("#exampleSelect");
  exampleSelect.value = "quadratic";

  exampleSelect.addEventListener("change", (e) => {
    switch (e.target.value) {
      case "quadratic":
        fInput.value = "z^2 + c";
        critInput.value = "0.0";
        break;
      case "per2":
        fInput.value = "(z^2-c) / (z^2-1)";
        critInput.value = "0.0";
        break;
      case "per3_0":
        fInput.value = "(z^2-1+c-c^3) / (z^2-c^2)";
        critInput.value = "0.0";
        break;
      case "per4_0":
        fInput.value = "(z-c)*(z-(2c-1)/(c-1))/z^2";
        critInput.value = "(4c^2-2c) / (-1+c+c^2)";
        break;
    }
  });

  const maxIterInput = document.querySelector("#maxIter");
  maxIterInput.value = "100";

  return {
    fInput: fInput,
    critInput: critInput,
    cInput: cInput,
    maxIterInput: maxIterInput,
    compileButton: compileButton,
  };
}

function setGLEvents(gl, state, buttons) {
  // Set Mouse Events
  gl.canvas.addEventListener("mousedown", (e) => {
    handleMousedown(e, gl, state);
  });

  gl.canvas.addEventListener("wheel", (e) => {
    handleScroll(e, gl, state);
  });

  window.addEventListener("mousemove", (e) => {
    handleMousemove(e, gl, state);
  });

  window.addEventListener("mouseup", (_) => {
    state.mouse.lastClick = "none";
    mouseSpan.textContent = "";
  });

  // Set Button Events
  buttons.resetLarge.addEventListener("click", (e) => {
    mat4.identity(state.largeView.localMatrix);
    mat4.identity(state.largeView.invLocalMatrix);
    mat4.identity(state.largeView.mobiusMatrix);
  });

  buttons.resetSmall.addEventListener("click", (e) => {
    mat4.identity(state.smallView.localMatrix);
    mat4.identity(state.smallView.invLocalMatrix);
    mat4.identity(state.smallView.mobiusMatrix);
  });

  buttons.switchViews.addEventListener("click", (e) => {
    state.world.largeIsParameter = !state.world.largeIsParameter;
    const clickEvent = new Event("click");
    myButton.dispatchEvent(clickEvent);
  });
}

function handleMousedown(_, gl, state) {
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  if (nearLargeSphere(state.mouse, aspect)) {
    state.mouse.lastClick = "large";
    mouseSpan.textContent = "L";
  } else if (nearSmallSphere(state.mouse, aspect)) {
    state.mouse.lastClick = "small";
    mouseSpan.textContent = "S";
  } else {
    state.mouse.lastClick = "none";
    mouseSpan.textContent = "";
  }
}

function handleMousemove(event, gl, state) {
  const mousePosition = getClipSpaceMousePosition(event, gl.canvas);
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  state.mouse.x = mousePosition.x;
  state.mouse.y = mousePosition.y;

  state.mouse.dx = state.mouse.x - state.mouse.lastX;
  state.mouse.dy = state.mouse.y - state.mouse.lastY;

  if (state.mouse.lastClick == "small") {
    rotateLocal(state.smallView, state.mouse, 3.7, aspect);
  } else if (state.mouse.lastClick == "large") {
    rotateLocal(state.largeView, state.mouse, 1.0, aspect);
  }

  state.mouse.lastX = state.mouse.x;
  state.mouse.lastY = state.mouse.y;
}

function handleScroll(event, gl, state) {
  event.preventDefault();

  // Point in the center of the view
  const northPole = vec4.fromValues(0, 0, 1, 0);
  const southPole = vec4.fromValues(0, 0, -1, 0);

  // Reverse the rotation to see where was this point originally
  vec4.transformMat4(northPole, northPole, state.largeView.invLocalMatrix);
  vec4.transformMat4(southPole, southPole, state.largeView.invLocalMatrix);

  // Get the projective equivalent
  mutateToProjective(northPole);
  mutateToProjective(southPole);

  const scale = 1.0 + event.deltaY * 0.001;

  updateMobius(state.largeView.mobiusMatrix, northPole, southPole, scale);
}

function updateMobius(mobius, pt1, pt2, scale) {
  //prettier-ignore
  const a =
    pt1[0] * pt2[2] - pt1[1] * pt2[3] -
    scale * (pt1[2] * pt2[0] - pt1[3] * pt2[1]);

  //prettier-ignore
  const b =
    pt1[0] * pt2[3] + pt1[1] * pt2[2] -
    scale * (pt1[2] * pt2[1] + pt1[3] * pt2[0]);

  const c = (1 - scale) * (pt1[2] * pt2[2] - pt1[3] * pt2[3]);
  const d = (1 - scale) * (pt1[2] * pt2[3] + pt1[3] * pt2[2]);

  const e = (scale - 1) * (pt1[0] * pt2[0] - pt1[1] * pt2[1]);
  const f = (scale - 1) * (pt1[0] * pt2[1] + pt1[1] * pt2[0]);

  //prettier-ignore
  const g =
    scale * (pt1[0] * pt2[2] - pt1[1] * pt2[3]) -
    pt1[2] * pt2[0] - pt1[3] * pt2[1];

  //prettier-ignore
  const h =
    scale * (pt1[0] * pt2[3] + pt1[1] * pt2[2]) -
    pt1[2] * pt2[1] + pt1[3] * pt2[0];

  // prettier-ignore
  const new_mobius = mat4.fromValues(
     a,  b,  c,  d,
    -b,  a, -d,  c,
     e,  f,  g,  h,
    -f,  e, -h,  g,
  )

  mat4.mul(mobius, mobius, new_mobius);
}

function mutateToProjective(v) {
  if (vec3.dist(v, [0, 0, -1, 0]) < 1e-5) {
    vec4.copy(v, [1, 0, 0, 0]);
    return;
  }

  vec4.copy(v, [v[0], v[1], 1 + v[2], 0]);
  vec4.normalize(v, v);
}

// ASSUMPTIONS:
//  - canvas has no padding or border
function getClipSpaceMousePosition(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const position = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  // Convert to pixel coordinates
  position.x = (position.x * canvas.width) / canvas.clientWidth;
  position.y = (position.y * canvas.height) / canvas.clientHeight;

  // Convert to clip space
  position.x = (position.x / canvas.width) * 2 - 1;
  position.y = (position.y / canvas.height) * -2 + 1;

  return position;
}

function sqDist(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;

  return dx * dx + dy * dy;
}

function nearSmallSphere(mouseState, aspect) {
  const xc = -0.52;
  const yc = -0.54;
  const r2 = 0.1;
  return sqDist(aspect * mouseState.x, mouseState.y, xc * aspect, yc) < r2;
}

function nearLargeSphere(mouseState, aspect) {
  const r2 = 0.75;
  return sqDist(aspect * mouseState.x, mouseState.y, 0, 0) < r2;
}

function rotateLocal(spaceState, mouseState, scale, aspect) {
  vec3.copy(spaceState.rotationAxis, [
    -mouseState.dy,
    aspect * mouseState.dx,
    0,
  ]);

  vec3.transformMat4(
    spaceState.rotationAxis,
    spaceState.rotationAxis,
    spaceState.invLocalMatrix
  );

  mat4.rotate(
    spaceState.localMatrix,
    spaceState.localMatrix,
    scale * vec3.length(spaceState.rotationAxis),
    spaceState.rotationAxis
  );

  mat4.invert(spaceState.invLocalMatrix, spaceState.localMatrix);
}
