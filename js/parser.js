export { toGLSL };

function toGLSL(expr) {
  return math.parse(expr).toString({ handler: inputParser });
}

function inputParser(node, options) {
  switch (node.type) {
    case "OperatorNode":
      switch (node.fn) {
        case "add":
          return (
            "_pAdd(" +
            node.args[0].toString(options) +
            ", " +
            node.args[1].toString(options) +
            ")"
          );
        case "subtract":
          return (
            "_pSub(" +
            node.args[0].toString(options) +
            ", " +
            node.args[1].toString(options) +
            ")"
          );
        case "unaryMinus":
          return "_pOpp(" + node.args[0].toString(options) + ")";
        case "multiply":
          return (
            "_pMul(" +
            node.args[0].toString(options) +
            ", " +
            node.args[1].toString(options) +
            ")"
          );
        case "divide":
          return (
            "_pDiv(" +
            node.args[0].toString(options) +
            ", " +
            node.args[1].toString(options) +
            ")"
          );
        case "pow":
          const pow = Number(node.args[1]);
          if (Number.isInteger(pow)) {
            let string = "";

            for (let i = 1; i < pow; i++) {
              string += "_pMul(" + node.args[0].toString(options) + ", ";
            }

            string += node.args[0].toString(options) + ")".repeat(pow - 1);
            return string;
          } else {
            return (
              "pow(" +
              node.args[0].toString(options) +
              ", " +
              node.args[1].toString(options) +
              ")"
            );
          }
      }
    case "SymbolNode":
      if (node.name === "i" || node.name === "I") {
        return "vec4(0.0, 1.0, 1.0, 0.0)";
      }
      break;

    case "ConstantNode":
      return "vec4(" + node.value + ", 0.0, 1.0, 0.0)";
  }
}
