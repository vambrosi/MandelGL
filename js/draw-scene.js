"use strict";

export { drawScene };

const { mat4, mat3, vec3, vec2 } = glMatrix;

function drawScene(gl, programInfo, buffers, state) {
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
  const zFar = 5.0;

  mat4.perspective(state.world.projMatrix, fieldOfView, aspect, zNear, zFar);

  // Set vertex shader attributes and buffers
  setAttributesAndBuffers(gl, buffers, programInfo);

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  setUniforms(gl, programInfo.uLocations, state);

  {
    const vertexCount = buffers.vertexCount;
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

function setUniforms(gl, locations, state) {
  gl.uniformMatrix4fv(
    locations.localMatrix,
    false,
    state.parameterSpace.localMatrix
  );
  gl.uniformMatrix4fv(
    locations.modelMatrix,
    false,
    state.parameterSpace.modelMatrix
  );

  const mouseV = vec3.fromValues(state.mouse.x, state.mouse.y, -2.5);

  gl.uniformMatrix4fv(locations.viewMatrix, false, state.world.viewMatrix);
  gl.uniformMatrix4fv(locations.projMatrix, false, state.world.projMatrix);
  gl.uniform3fv(locations.mousePosition, mouseV);

  gl.uniformMatrix4fv(
    locations.mobiusMatrix,
    false,
    state.parameterSpace.mobiusMatrix
  );
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
