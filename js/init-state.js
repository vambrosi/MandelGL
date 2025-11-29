"use strict";

export { initState };

const { mat4, mat3, vec3 } = glMatrix;

function initState() {
  const state = {
    mouse: {
      x: 0.0,
      y: 0.0,
      dx: 0.0,
      dy: 0.0,
      lastX: 0.0,
      lastY: 0.0,
      lastClick: "none",
    },

    parameterSpace: {
      localMatrix: mat4.create(),
      invLocalMatrix: mat4.create(),
      modelMatrix: mat4.create(),
      rotationAxis: vec3.create(),
      mobiusMatrix: mat4.create(),
    },

    dynamicalSpace: {
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
      largeType: "parameter",
    },
  };

  mat4.translate(
    state.parameterSpace.modelMatrix,
    state.parameterSpace.modelMatrix,
    [0, 0, -3]
  );

  mat4.translate(
    state.dynamicalSpace.modelMatrix,
    state.dynamicalSpace.modelMatrix,
    [-4, -2, -9]
  );

  return state;
}
