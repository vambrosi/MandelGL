"use strict";

export { initState };

const { mat4, mat3, vec3, quat } = glMatrix;

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

    largeView: {
      localMatrix: mat4.create(),
      invLocalMatrix: mat4.create(),
      modelMatrix: mat4.create(),
      rotationAxis: vec3.create(),
      mobiusMatrix: mat4.create(),
    },

    smallView: {
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
  };

  mat4.translate(
    state.largeView.modelMatrix,
    state.largeView.modelMatrix,
    [0, 0, -3]
  );

  mat4.translate(
    state.smallView.modelMatrix,
    state.smallView.modelMatrix,
    [0, 0, -10]
  );

  // Shift small sphere to lower left corner
  // while still facing the camera.
  const q = quat.create();
  quat.fromEuler(q, -11.5, 24, 0);

  const t = vec3.fromValues(0, 0, 0);
  const m = mat4.create();
  mat4.fromRotationTranslation(m, q, t);

  mat4.mul(
    state.smallView.modelMatrix,
    m,
    state.smallView.modelMatrix,
  );

  return state;
}
