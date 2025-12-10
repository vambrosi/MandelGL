"use strict";

export { setEvents };

const { mat4, quat, vec3, vec4 } = glMatrix;

const mouseSpan = document.querySelector("#mouse-location");
const switchTools = document.querySelector("#switchTools");
const toolIcon = switchTools.querySelector("i");

function setEvents(gl, state) {
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

  window.addEventListener("mouseup", (e) => {
    handleMouseup(e, gl, state);
  });

  // Set Menu Events
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

  // Default dynamical system to plot f(z,c) = z^2 + c
  const fInput = document.querySelector("#fInput");
  fInput.value = "z^2 + c";

  // Default critical value to iterate is crit(c) = 0.0;
  const critInput = document.querySelector("#critInput");
  critInput.value = "0.0";

  // Default c for the Parameter plane is i;
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

  const menuItems = {
    fInput: fInput,
    critInput: critInput,
    cInput: cInput,
    maxIterInput: maxIterInput,
  };

  const compileButton = document.querySelector("#compileButton");
  compileButton.addEventListener("click", (e) => {
    state.updateProgram(gl, menuItems);
  });

  // Set Button Events
  const resetLarge = document.querySelector("#resetLarge");
  resetLarge.addEventListener("click", (e) => {
    const view = state.world.largeIsParameter
      ? state.parameterView
      : state.dynamicalView;

    mat4.identity(view.localMatrix);
    mat4.identity(view.invLocalMatrix);
    mat4.identity(view.mobiusMatrix);
  });

  const resetSmall = document.querySelector("#resetSmall");
  resetSmall.addEventListener("click", (e) => {
    const view = state.world.largeIsParameter
      ? state.dynamicalView
      : state.parameterView;

    mat4.identity(view.localMatrix);
    mat4.identity(view.invLocalMatrix);
    mat4.identity(view.mobiusMatrix);
  });

  const switchViews = document.querySelector("#switchViews");
  switchViews.addEventListener("click", (e) => {
    handleSwitchViews(state);
  });

  switchTools.addEventListener("click", (e) => {
    handleToolSwitch(e, state);
  });

  // Compile the first program with the default settings
  state.updateProgram(gl, menuItems);
}

function handleMousedown(_, gl, state) {
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  if (nearLargeSphere(state.mouse, aspect)) {
    state.mouse.lastClick = "large";
    document.body.style.cursor = state.currentTool.cursorPressed;
  } else if (nearSmallSphere(state.mouse, aspect)) {
    state.mouse.lastClick = "small";
    document.body.style.cursor = state.currentTool.cursorPressed;
  } else {
    state.mouse.lastClick = "none";
    document.body.style.cursor = "default";
  }
}

function handleMouseup(_, gl, state) {
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  state.mouse.lastClick = "none";
  mouseSpan.textContent = "";

  if (
    nearLargeSphere(state.mouse, aspect) ||
    nearSmallSphere(state.mouse, aspect)
  ) {
    document.body.style.cursor = state.currentTool.cursorSphere;
  } else {
    document.body.style.cursor = "default";
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
    const smallView = state.world.largeIsParameter
      ? state.dynamicalView
      : state.parameterView;

    rotateLocal(smallView, state.mouse, 3.7, aspect);
  } else if (state.mouse.lastClick == "large") {
    const largeView = state.world.largeIsParameter
      ? state.parameterView
      : state.dynamicalView;

    rotateLocal(largeView, state.mouse, 1.0, aspect);
  } else if (
    nearLargeSphere(state.mouse, aspect) ||
    nearSmallSphere(state.mouse, aspect)
  ) {
    document.body.style.cursor = state.currentTool.cursorSphere;
  } else {
    document.body.style.cursor = "default";
  }

  state.mouse.lastX = state.mouse.x;
  state.mouse.lastY = state.mouse.y;

  updateMouseShadow(state);
}

function handleScroll(event, gl, state) {
  event.preventDefault();

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  let view;
  if (nearLargeSphere(state.mouse, aspect)) {
    view = state.world.largeIsParameter
      ? state.parameterView
      : state.dynamicalView;
  } else if (nearSmallSphere(state.mouse, aspect)) {
    view = state.world.largeIsParameter
      ? state.dynamicalView
      : state.parameterView;
  } else {
    return;
  }

  // Point in the center of the view
  const northPole = vec4.fromValues(0, 0, 1, 0);
  const southPole = vec4.fromValues(0, 0, -1, 0);

  // Reverse the rotation to see where was this point originally
  vec4.transformMat4(northPole, northPole, view.invLocalMatrix);
  vec4.transformMat4(southPole, southPole, view.invLocalMatrix);

  // Get the projective equivalent
  mutateToProjective(northPole);
  mutateToProjective(southPole);

  const scale = 1.0 + event.deltaY * 0.001;

  updateMobius(view.mobiusMatrix, northPole, southPole, scale);
}

function handleSwitchViews(state) {
  let smallView, largeView;
  if (state.world.largeIsParameter) {
    largeView = state.parameterView;
    smallView = state.dynamicalView;
  } else {
    largeView = state.dynamicalView;
    smallView = state.parameterView;
  }

  // Shift large view to the back (to appear smaller) and to the corner
  mat4.translate(largeView.modelMatrix, largeView.modelMatrix, [0, 0, -7]);

  const qLarge = quat.create();
  quat.fromEuler(qLarge, -11.5, 24, 0);

  const tLarge = vec3.fromValues(0, 0, 0);
  const mLarge = mat4.create();
  mat4.fromRotationTranslation(mLarge, qLarge, tLarge);

  mat4.mul(largeView.modelMatrix, mLarge, largeView.modelMatrix);

  // Shift small view out of the corner and to the front (to appear larger)
  const qSmall = quat.create();
  quat.fromEuler(qSmall, 11.5, -24, 0, "xyz");

  const tSmall = vec3.fromValues(0, 0, 0);
  const mSmall = mat4.create();
  mat4.fromRotationTranslation(mSmall, qSmall, tSmall);

  mat4.mul(smallView.modelMatrix, mSmall, smallView.modelMatrix);
  mat4.translate(smallView.modelMatrix, smallView.modelMatrix, [0, 0, 7]);

  // Record change of positions in the state
  state.world.largeIsParameter = !state.world.largeIsParameter;
}

function handleToolSwitch(e, state) {
  [state.currentTool, state.otherTool] = [state.otherTool, state.currentTool];

  toolIcon.textContent = state.otherTool.iconName;
  switchTools.title = state.otherTool.tooltip;
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

function updateMouseShadow(state) {
  const mouseVector = vec3.fromValues(
    state.mouse.x / state.world.projMatrix[0],
    state.mouse.y / state.world.projMatrix[5],
    -1
  );

  updateSphereShadow(
    state.mouse.smallSphereShadow,
    mouseVector,
    state.world.smallCenter
  );
  updateSphereShadow(
    state.mouse.largeSphereShadow,
    mouseVector,
    state.world.largeCenter
  );
}

function updateSphereShadow(sphereShadow, mouseVector, sphereCenter) {
  const a = vec3.dot(sphereCenter, sphereCenter) - 1;
  const b = -2 * vec3.dot(mouseVector, sphereCenter);
  const c = vec3.dot(mouseVector, mouseVector);
  const Delta = b * b - 4 * a * c;

  if (Delta >= 0) {
    const scale = (-b + Math.sqrt(Delta)) / (2 * a);
    vec3.scale(sphereShadow, mouseVector, 1 / scale);

    const position =
      `(${sphereShadow[0].toFixed(2)},` +
      `${sphereShadow[1].toFixed(2)},` +
      `${sphereShadow[2].toFixed(2)})`;
    mouseSpan.textContent = position;
  }
}
