export { toGLSL };

function toGLSL(expr, isProj) {
  return math.parse(expr).toString({
    handler: (n, o) => inputParser(n, o, isProj),
  });
}

function inputParser(node, options, isProj) {
  const prefixOp = isProj ? "_p" : "_c";

  switch (node.type) {
    case "OperatorNode":
      switch (node.fn) {
        case "add":
          return (
            `${prefixOp}Add(` +
            `${node.args[0].toString(options)}, ` +
            `${node.args[1].toString(options)})`
          );
        case "subtract":
          return (
            `${prefixOp}Sub(` +
            `${node.args[0].toString(options)}, ` +
            `${node.args[1].toString(options)})`
          );
        case "unaryMinus":
          return `${prefixOp}Opp(${node.args[0].toString(options)})`;
        case "multiply":
          return (
            `${prefixOp}Mul(` +
            `${node.args[0].toString(options)}, ` +
            `${node.args[1].toString(options)})`
          );
        case "divide":
          return (
            `${prefixOp}Div(` +
            `${node.args[0].toString(options)}, ` +
            `${node.args[1].toString(options)})`
          );
        case "pow":
          const pow = Number(node.args[1]);
          if (Number.isInteger(pow)) {
            let string = "";

            for (let i = 1; i < pow; i++) {
              string += `${prefixOp}Mul(${node.args[0].toString(options)}, `;
            }

            string += node.args[0].toString(options) + ")".repeat(pow - 1);
            return string;
          } else {
            return (
              `${prefixOp}Pow(` +
              `${node.args[0].toString(options)}, ` +
              `${node.args[1].toString(options)})`
            );
          }
      }

    case "FunctionNode":
      return `_${node.name}(${node.args[0].toString(options)})`;

    case "SymbolNode":
      if (node.name === "i" || node.name === "I") {
        return isProj ? "vec4(0.0, 1.0, 1.0, 0.0)" : "vec2(0.0, 1.0)";
      } else if (node.name === "c") {
        return isProj ? "c" : "c.xy / (c.w + c.z)";
      }
      break;

    case "ConstantNode":
      const normalizedValue = Number.isInteger(node.value)
        ? `${node.value}.0`
        : `${node.value}`;
      return isProj
        ? `vec4(${normalizedValue}, 0.0, 1.0, 0.0)`
        : `vec2(${normalizedValue}, 0.0)`;
  }
}
