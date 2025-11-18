"use strict";

export { initBuffers };

function initBuffers(gl, meridians, parallels) {
  const positionsBuffer = initPositionBuffer(gl, meridians, parallels);
  const indexBuffer = initIndexBuffer(gl, meridians, parallels);

  return {
    positions: positionsBuffer,
    indices: indexBuffer,
    vertexCount: 6 * meridians * (parallels + 1),
  };
}

function initPositionBuffer(gl, meridians, parallels) {
  // Create and bind a vertex buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const positions = generateSphereVertices(meridians, parallels);

  // Pass vertices to buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer;
}

function initIndexBuffer(gl, meridians, parallels) {
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  const indices = generateSphereIndices(meridians, parallels);

  // Now send the element array to GL

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  return indexBuffer;
}

function generateSphereVertices(meridians, parallels) {
  // For simplicity, the top and bottom parallels are collapsed to the poles,
  // and the first and last meridian are glued together. This is why we add the
  // constants in the array below.
  const positions = new Array(3 * (meridians + 1) * (parallels + 2));

  const meridianSpacing = (2 * Math.PI) / meridians;
  const parallelSpacing = Math.PI / (parallels + 1);

  let idx = -1;
  
  for (let theta = 0; theta < Math.PI + parallelSpacing / 2; theta += parallelSpacing) {
    for (let phi = 0; phi < 2 * Math.PI + meridianSpacing / 2; phi += meridianSpacing) {
      positions[++idx] = Math.sin(theta) * Math.cos(phi);
      positions[++idx] = Math.sin(theta) * Math.sin(phi);
      positions[++idx] = Math.cos(theta);
    }
  }

  return positions;
}

function generateSphereIndices(meridians, parallels) {
  const indices = new Array(6 * meridians * (parallels + 1));

  // How many indices to skip to get to next parallel
  const parallelSkip = meridians + 1;

  let idx = -1;
  let topLeft, topRight, bottomLeft, bottomRight;

  for (let p = 0; p < parallels + 1; p++) {
    for (let m = 0; m < meridians; m++) {
      bottomLeft = m + p * parallelSkip;
      bottomRight = bottomLeft + 1;
      topLeft = bottomLeft + parallelSkip;
      topRight = topLeft + 1;


      // Bottom triangle
      indices[++idx] = bottomLeft;
      indices[++idx] = bottomRight;
      indices[++idx] = topRight;

      // Top triangle
      indices[++idx] = bottomLeft;
      indices[++idx] = topLeft;
      indices[++idx] = topRight;
    }
  }

  return indices;
}
