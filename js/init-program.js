"use strict";

export { initProgram };

import { toGLSL } from "./parser.js";

function initProgram(gl, settings) {
  const vsSource = getVSSource();
  const fsSourceParameter = getFSSource(true, settings);

  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShaderParameter = loadShader(
    gl,
    gl.FRAGMENT_SHADER,
    fsSourceParameter
  );

  // Create the shader program
  const programParameter = gl.createProgram();
  gl.attachShader(programParameter, vertexShader);
  gl.attachShader(programParameter, fragmentShaderParameter);
  gl.linkProgram(programParameter);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(programParameter, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize program: ${gl.getProgramInfoLog(programParameter)}`
    );
    return null;
  }

  // Same for dynamical space
  const fsSourceDynamical = getFSSource(false, settings);
  const fragmentShaderDynamical = loadShader(
    gl,
    gl.FRAGMENT_SHADER,
    fsSourceDynamical
  );

  const programDynamical = gl.createProgram();
  gl.attachShader(programDynamical, vertexShader);
  gl.attachShader(programDynamical, fragmentShaderDynamical);
  gl.linkProgram(programDynamical);

  if (!gl.getProgramParameter(programDynamical, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize program: ${gl.getProgramInfoLog(programDynamical)}`
    );
    return null;
  }

  return {
    parameter: programParameter,
    dynamical: programDynamical
  };
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(`Unable to compile shaders:\n${gl.getShaderInfoLog(shader)}`);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function getVSSource() {
  return `
    attribute vec4 aPosition;     

    uniform mat4 uLocalMatrix;
    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjMatrix;

    varying vec4 modelPos;
    varying vec4 localPos;

    void main(void) {
      localPos = aPosition;
      modelPos = uProjMatrix * uViewMatrix * uModelMatrix
                    * uLocalMatrix * aPosition;
      gl_Position = uProjMatrix * uViewMatrix * uModelMatrix
                    * uLocalMatrix * aPosition;
    }`;
}

function getFSSource(isParameter, settings) {
  const fGLSL = toGLSL(settings.fExpr, true);

  let initialValueCode;
  if (isParameter) {
    const critGLSL = toGLSL(settings.critExpr, true);

    initialValueCode = `
      vec4 c = vec4(localPos.xy, 1.0 + localPos.z, 0.0);
      c = uMobiusMatrix * c;
      vec4 z = ${critGLSL};
    `;
  } else {
    const cGLSL = toGLSL(settings.cExpr, false);

    initialValueCode = `
      vec4 z = vec4(localPos.xy, 1.0 + localPos.z, 0.0);
      z = uMobiusMatrix * z;
      vec4 c = vec4(${cGLSL}, 1.0, 0.0);
    `;
  }

  const code = `
    // In and Out variables
    precision highp float;

    uniform sampler2D uColorPalette;
    uniform vec3 uMousePosition;
    uniform mat4 uProjMatrix;
    uniform mat4 uMobiusMatrix;

    varying vec4 modelPos;  
    varying vec4 localPos;

    ${complexGLSL}
    ${projGLSL}    

    // Function supplied by the user
    vec4 _user_defined_function(vec4 z, vec4 c) {
      return ${fGLSL};
    }

    // Iterate function until it escapes
    void main(void) {
      ${initialValueCode}

      const vec4 infinity = vec4(1.0, 0.0, 0.0, 0.0);
      
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      
      for (int iter = 0; iter < ${settings.maxIterExpr}; iter++) {
        if (_pDist(z, infinity) < 1e-3) {
            float d = _pDist(z, infinity);
            float depth = fract((float(iter) - log2(-log(d))) / 64.0);
            gl_FragColor = texture2D(
              uColorPalette, 
              vec2((511.0 * depth + 0.5) / 512.0, 0.5)
            );
            break;
        }
        
        z = _user_defined_function(z,c);
      }

      vec2 testVector = modelPos.xy / modelPos.w - uMousePosition.xy;
      testVector.x *= uProjMatrix[1][1] / uProjMatrix[0][0];
      if (length(testVector) < 0.01) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    }
    `;

  console.log(code);
  return code;
}

const complexGLSL = `
    // Complex Addition, Subtraction, and Additive Inverse
    vec2 _cAdd(vec2 a, vec2 b) {return a + b;}
    vec2 _cSub(vec2 a, vec2 b) {return a - b;}
    vec2 _cOpp(vec2 a) {return -a;}

    // Complex Multiplication
    vec2 _cMul(vec2 a, vec2 b) {
      return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
    }

    // Complex Division
    vec2 _cDiv(vec2 a, vec2 b) {
      return vec2(dot(a, b), a.y * b.x - a.x * b.y) / (b.x * b.x + b.y * b.y);
    }

    // Assumes b is a real number
    vec2 _cPow(vec2 a, vec2 b) {
      float powR = pow(length(a), b.x);
      float theta = atan(a.y, a.x);
      return vec2(powR * cos(b.x * theta), powR * sin(b.x * theta));
    }

    // Transcendental functions on the Complex Plane
    vec2 _sqrt(vec2 a) {
      float sqrtR = sqrt(length(a));
      float theta = atan(a.y, a.x);
      return vec2(sqrtR * cos(theta / 2.0), sqrtR * sin(theta / 2.0));
    } 
`;

const projGLSL = `
    // Complex Addition in Projective Coordinates
    vec4 _pAdd(vec4 a, vec4 b) {
      return normalize(vec4(
        a.x * b.z - a.y * b.w + a.z * b.x - a.w * b.y,
        a.x * b.w + a.y * b.z + a.z * b.y + a.w * b.x,
        a.z * b.z - a.w * b.w,
        a.z * b.w + a.w * b.z
      ));
    }

    // Complex Subtraction in Projective Coordinates
    vec4 _pSub(vec4 a, vec4 b) {
      return normalize(vec4(
        a.x * b.z - a.y * b.w - a.z * b.x + a.w * b.y,
        a.x * b.w + a.y * b.z - a.z * b.y - a.w * b.x,
        a.z * b.z - a.w * b.w,
        a.z * b.w + a.w * b.z
      ));
    }

    // Complex Additive Inverse in Projective Coordinates
    vec4 _pOpp(vec4 a) {return vec4(-a.xy, a.zw);}

    // Complex Multiplication in Projective Coordinates
    vec4 _pMul(vec4 a, vec4 b) {
      return normalize(vec4(
        a.x * b.x - a.y * b.y,
        a.x * b.y + a.y * b.x,
        a.z * b.z - a.w * b.w,
        a.z * b.w + a.w * b.z
      ));
    }

    // Complex Division in Projective Coordinates
    vec4 _pDiv(vec4 a, vec4 b) {
      return normalize(vec4(
        a.x * b.z - a.y * b.w,
        a.x * b.w + a.y * b.z,
        a.z * b.x - a.w * b.y,
        a.z * b.y + a.w * b.x
      ));
    }
    
    // Complex Multiplicative Inverse in Projective Coordinates
    vec4 _pInv(vec4 a) {return vec4(a.zw, a.xy);}

    // Distance in the Complex Projective Line
    // Assumes that both vec4s are normalized
    float _pDist(vec4 a, vec4 b) {
      return length(vec2(
        a.x * b.z - a.y * b.w - a.z * b.x + a.w * b.y,
        a.x * b.w + a.y * b.z + a.z * b.y + a.w * b.x
      ));
    }
`;
