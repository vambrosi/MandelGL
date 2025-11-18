"use strict";

import { initState } from "./init-state.js";
import { initProgram } from "./init-program.js";
import { initBuffers } from "./init-buffers.js";
import { initColorPalette } from "./init-palette.js";
import { handleMousemove, handleScroll } from "./event-handlers.js";
import { drawScene } from "./draw-scene.js";
import { toGLSL } from "./parser.js";

// Default dynamical system to plot f(z,c) = z^2 + c
const fInput = document.querySelector("#fInput");
fInput.value = "z^2 + c";

main(fInput.value);

function main(fExpr) {
  const canvas = document.querySelector("#gl-canvas");
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert("Your browser or machine may not support WebGL.");
    return;
  }

  // Set Menu
  const menu = document.querySelector(".menu");
  const hamburger = document.querySelector(".hamburger");
  const closeIcon = document.querySelector(".closeIcon");
  const menuIcon = document.querySelector(".menuIcon");

  hamburger.addEventListener("click", (e) => toggleMenu(e, menu, closeIcon, menuIcon));

  // Set State and Event Handlers
  const state = initState();

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

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // const critInput = document.querySelector("#critInput");
  // critInput.value = "0.0";

  console.log("GLSL function: " + toGLSL(fInput.value));

  const fToIterateSource = `
    vec4 _user_defined_function(vec4 z, vec4 c) {
      return ${toGLSL(fInput.value)};
    }
    `;

  // Compile shaders and set uniforms
  const shaderProgram = initProgram(gl, fToIterateSource);

  const programInfo = {
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

function toggleMenu(e, menu, closeIcon, menuIcon) {
  if (menu.classList.contains("showMenu")) {
    menu.classList.remove("showMenu");
    closeIcon.style.display = "none";
    menuIcon.style.display = "block";
  } else {
    menu.classList.add("showMenu");
    closeIcon.style.display = "block";
    menuIcon.style.display = "none";
  }
}