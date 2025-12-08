"use strict";

export { drawScene };

const { mat4, mat3, vec3, vec2 } = glMatrix;

function drawScene(gl, state) {
  // Resize viewport in case canvas changed size
  resizeCanvasToDisplaySize(gl);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear depth and redraw background
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  // Clear the buffers before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Reset the perspective matrix

  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 1.0;
  const zFar = 20.0;

  mat4.perspective(state.world.projMatrix, fieldOfView, aspect, zNear, zFar);

  // Draw large view
  setAttributesAndBuffers(gl, state.buffers, state.programInfo.dynamicalView);
  gl.useProgram(state.programInfo.dynamicalView.program);
  setUniforms(
    gl,
    state.programInfo.dynamicalView.uLocations,
    state.dynamicalView,
    state
  );

  {
    const vertexCount = state.buffers.vertexCount;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Draw dynamical space
  setAttributesAndBuffers(gl, state.buffers, state.programInfo.parameterView);
  gl.useProgram(state.programInfo.parameterView.program);
  setUniforms(
    gl,
    state.programInfo.parameterView.uLocations,
    state.parameterView,
    state
  );

  {
    const vertexCount = state.buffers.vertexCount;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
}

function setAttributesAndBuffers(gl, buffers, programInfo) {
  const numComponents = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positions);
  gl.vertexAttribPointer(
    programInfo.attribLocations.aPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.aPosition);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
}

function setUniforms(gl, locations, spaceState, state) {
  gl.uniformMatrix4fv(locations.localMatrix, false, spaceState.localMatrix);
  gl.uniformMatrix4fv(locations.modelMatrix, false, spaceState.modelMatrix);

  const mouseV = vec3.fromValues(state.mouse.x, state.mouse.y, -2.5);

  gl.uniformMatrix4fv(locations.projMatrix, false, state.world.projMatrix);
  gl.uniform3fv(locations.mousePosition, mouseV);

  gl.uniformMatrix4fv(locations.mobiusMatrix, false, spaceState.mobiusMatrix);
}

function resizeCanvasToDisplaySize(gl) {
  const width = gl.canvas.clientWidth;
  const height = gl.canvas.clientHeight;

  if (gl.canvas.width != width || gl.canvas.height != height) {
    gl.canvas.width = width;
    gl.canvas.height = height;
  }
  return;
}
