"use strict";

export { setGLEvents, setMenuEvents };

const { mat4, mat3, vec3, vec4 } = glMatrix;

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
  cInput.value = "0.0";

  const exampleSelect = document.querySelector("#exampleSelect");
  exampleSelect.value = "mandel";

  const parameterRadio = document.querySelector('#parameterRadio');
  parameterRadio.checked = true;

  exampleSelect.addEventListener("change", (e) => {
    switch (e.target.value) {
      case "mandel":
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
  })

  return {
    fInput: fInput,
    critInput: critInput,
    cInput: cInput,
    parameterRadio: parameterRadio,
    compileButton: compileButton,
  };
}

function setGLEvents(gl, state, buttons) {
  // Set Mouse Events
  gl.canvas.addEventListener("mousedown", (e) => {
    state.mouse.isDown = true;
  });

  gl.canvas.addEventListener("wheel", (e) => {
    handleScroll(e, gl, state);
  });

  window.addEventListener("mousemove", (e) => {
    handleMousemove(e, gl, state);
  });

  window.addEventListener("mouseup", (e) => {
    state.mouse.isDown = false;
  });

  // Set Button Events
  buttons.reset.addEventListener("click", (e) => {
    mat4.identity(state.parameterSpace.localMatrix);
    mat4.identity(state.parameterSpace.invLocalMatrix);
    mat4.identity(state.parameterSpace.mobiusMatrix);
  });
}

function handleMousemove(event, gl, state) {
  const mousePosition = getClipSpaceMousePosition(event, gl.canvas);

  state.mouse.x = mousePosition.x;
  state.mouse.y = mousePosition.y;

  state.mouse.dx = state.mouse.x - state.mouse.lastX;
  state.mouse.dy = state.mouse.y - state.mouse.lastY;

  if (state.mouse.isDown) {
    vec3.copy(state.parameterSpace.rotationAxis, [
      -state.mouse.dy,
      state.mouse.dx,
      0,
    ]);

    vec3.transformMat4(
      state.parameterSpace.rotationAxis,
      state.parameterSpace.rotationAxis,
      state.parameterSpace.invLocalMatrix
    );

    mat4.rotate(
      state.parameterSpace.localMatrix,
      state.parameterSpace.localMatrix,
      vec3.length(state.parameterSpace.rotationAxis) * 1.5,
      state.parameterSpace.rotationAxis
    );

    mat4.invert(
      state.parameterSpace.invLocalMatrix,
      state.parameterSpace.localMatrix
    );
  }

  state.mouse.lastX = state.mouse.x;
  state.mouse.lastY = state.mouse.y;
}

function handleScroll(event, gl, state) {
  event.preventDefault();

  const mousePosition = getClipSpaceMousePosition(event, gl.canvas);

  // Point in the center of the view
  const northPole = vec4.fromValues(0, 0, 1, 0);
  const southPole = vec4.fromValues(0, 0, -1, 0);

  // Reverse the rotation to see where was this point originally
  vec4.transformMat4(northPole, northPole, state.parameterSpace.invLocalMatrix);
  vec4.transformMat4(southPole, southPole, state.parameterSpace.invLocalMatrix);

  // Get the projective equivalent
  mutateToProjective(northPole);
  mutateToProjective(southPole);

  const scale = 1.0 + event.deltaY * 0.001;

  updateMobius(state.parameterSpace.mobiusMatrix, northPole, southPole, scale);
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
