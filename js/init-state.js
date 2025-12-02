"use strict";

export { initState };

import { initProgram } from "./init-program.js";
import { initBuffers } from "./init-buffers.js";
import { initColorPalette } from "./init-palette.js";

const { mat4, mat3, vec3, quat } = glMatrix;

function initState(gl) {
  const state = {
    // UI state
    mouse: {
      x: 0.0,
      y: 0.0,
      dx: 0.0,
      dy: 0.0,
      lastX: 0.0,
      lastY: 0.0,
      lastClick: "none",
    },

    // State variables for views
    dynamicalView: {
      localMatrix: mat4.create(),
      invLocalMatrix: mat4.create(),
      modelMatrix: mat4.create(),
      rotationAxis: vec3.create(),
      mobiusMatrix: mat4.create(),
    },

    parameterView: {
      localMatrix: mat4.create(),
      invLocalMatrix: mat4.create(),
      modelMatrix: mat4.create(),
      rotationAxis: vec3.create(),
      mobiusMatrix: mat4.create(),
    },

    world: {
      deltaTime: 0,
      viewMatrix: mat4.create(),
      projMatrix: mat4.create(),
      largeIsParameter: false,
    },

    // These two objects will be initialized when the function
    // state.updateProgram is called for the first time
    programInfo: {},
    settings: {},

    // Set the input for the shaders
    buffers: initBuffers(gl, 128, 64),
    colorPalette: initColorPalette(gl),

    // Function that changes the shader program when given menu input data
    updateProgram: (gl, m) => {
      updateProgram(state, gl, m);
    },
  };

  mat4.translate(
    state.dynamicalView.modelMatrix,
    state.dynamicalView.modelMatrix,
    [0, 0, -3]
  );

  mat4.translate(
    state.parameterView.modelMatrix,
    state.parameterView.modelMatrix,
    [0, 0, -10]
  );

  // Shift small sphere to lower left corner
  // while still facing the camera.
  const q = quat.create();
  quat.fromEuler(q, -11.5, 24, 0);

  const t = vec3.fromValues(0, 0, 0);
  const m = mat4.create();
  mat4.fromRotationTranslation(m, q, t);

  mat4.mul(state.parameterView.modelMatrix, m, state.parameterView.modelMatrix);

  return state;
}

function updateProgram(state, gl, menuItems) {
  // maxIter has to be printed without decimals and be > 0
  const maxIterNumber = Math.max(
    Number.parseInt(menuItems.maxIterInput.value),
    1
  );

  state.settings = {
    fExpr: menuItems.fInput.value,
    critExpr: menuItems.critInput.value,
    cExpr: menuItems.cInput.value,
    maxIterExpr: maxIterNumber,
  };

  // Then, update the programs using those settings
  const shaderPrograms = initProgram(gl, state);
  state.programInfo.dynamicalView = setProgramInfo(
    gl,
    shaderPrograms.dynamicalView
  );
  state.programInfo.parameterView = setProgramInfo(
    gl,
    shaderPrograms.parameterView
  );
}

function setProgramInfo(gl, shaderProgram) {
  return {
    program: shaderProgram,
    attribLocations: {
      aPosition: gl.getAttribLocation(shaderProgram, "aPosition"),
    },
    uLocations: {
      mousePosition: gl.getUniformLocation(shaderProgram, "uMousePosition"),
      mobiusMatrix: gl.getUniformLocation(shaderProgram, "uMobiusMatrix"),
      localMatrix: gl.getUniformLocation(shaderProgram, "uLocalMatrix"),
      modelMatrix: gl.getUniformLocation(shaderProgram, "uModelMatrix"),
      viewMatrix: gl.getUniformLocation(shaderProgram, "uViewMatrix"),
      projMatrix: gl.getUniformLocation(shaderProgram, "uProjMatrix"),
      colorPalette: gl.getUniformLocation(shaderProgram, "uColorPalette"),
    },
  };
}
