"use strict";

import { initState } from "./init-state.js";
import { initProgram } from "./init-program.js";
import { initBuffers } from "./init-buffers.js";
import { initColorPalette } from "./init-palette.js";
import { setGLEvents, setMenuEvents } from "./event-handlers.js";
import { drawScene } from "./draw-scene.js";

// Set Menu button, events, and default settings
const menuItems = setMenuEvents();

// Get references to the other buttons
const buttons = {
  reset: document.querySelector("#reset"),
};

main(menuItems, buttons);

function main(menuItems, buttons) {
  const canvas = document.querySelector("#gl-canvas");
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert("Your browser or machine may not support WebGL.");
    return;
  }

  // Set State and Event Handlers
  const state = initState();
  setGLEvents(gl, state, buttons);

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Get initial functions
  const fExpr = menuItems.fInput.value;
  const critExpr = menuItems.critInput.value;

  // Compile initial shaders and set uniforms
  const shaderProgram = initProgram(gl, fExpr, critExpr);
  let programInfo = setProgramInfo(gl, shaderProgram);

  // Change function after start
  menuItems.compileButton.addEventListener("click", (e) => {
    const fExpr = menuItems.fInput.value;
    const critExpr = menuItems.critInput.value;
    const shaderProgram = initProgram(gl, fExpr, critExpr);

    programInfo = setProgramInfo(gl, shaderProgram);
  });

  // Set the input for the shaders
  const buffers = initBuffers(gl, 128, 64);
  const colorPalette = initColorPalette(gl);

  // Start render loop
  let then = 0;

  const frameRateSpan = document.querySelector("#frame-rate");
  let renderCalls = 0;
  let elapsedTime = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001; // convert to seconds
    state.world.deltaTime = now - then;
    then = now;

    // Compute and show frame rate
    renderCalls += 1;
    elapsedTime += state.world.deltaTime;

    if (renderCalls === 10) {
      frameRateSpan.textContent = (renderCalls / elapsedTime).toFixed(2);
      renderCalls = 0;
      elapsedTime = 0;
    }

    drawScene(gl, programInfo, buffers, state);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
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
