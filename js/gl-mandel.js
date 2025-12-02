"use strict";

import { initState } from "./init-state.js";
import { setEvents } from "./event-handlers.js";
import { drawScene } from "./draw-scene.js";

main();

function main() {
  const canvas = document.querySelector("#gl-canvas");
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert("Your browser or machine may not support WebGL.");
    return;
  }

  // Set clear color to gray, fully opaque
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  /*
    The state variable below contains all information necessary to draw frames
    on the WebGL canvas. It serves as a message passaging container to relay
    user input to the render loop. All user interactions trigger events created
    in setEvents, and those events make changes on the state variable.
    
    setEvents also sets default settings and calls state.updateProgram for the
    first time. That will create the default shaders for the render loop.
  */

  const state = initState(gl);
  setEvents(gl, state);

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

    drawScene(gl, state);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
