import { StockIOMethods } from "./std/io.ts";
import { StockMathMethods } from "./std/math.ts";
import { StockMemoryMethods } from "./std/memory.ts";

/**
 * A method definition for the DSL
 */
export type QuarkMethod = {
  documentation: {
    summary: string;
    args: { name: string; description: string; type?: string }[];
  };
  handler: (context: Quark, args: unknown[]) => void;
};

/**
 * What type of function is the JS ported method
 * Void means there's no return
 * Value means that there's a return and that result must be written to a variable
 */
export enum ConversionType {
  Void,
  Value,
}

/**
 * The standard methods. Optional.
 */
export const StockMethods: Record<string, QuarkMethod> = {
  ...StockMemoryMethods,
  ...StockMathMethods,
  ...StockIOMethods,
  "goto": {
    documentation: {
      summary: "Jump to a different part of the code if the condition is met",
      args: [
        {
          name: "cond",
          description: "The condition to check",
          type: "0 or 1",
        },
        { name: "line", description: "The line to go to", type: "number" },
      ],
    },
    handler: (ctx, [cond, line]) => {
      if (Number(ctx.getVal(cond)) > 0) {
        ctx.counter = Number(ctx.getVal(line)) - 1;
      }
    },
  },
};

const parserRegexes = {
  lines: /\n/gm,
  tokens: /(".+")|(\d+\.\d+)|(\d+)|([a-zA-Z]+)/gm,
  number: /(\d+\.\d+)|(\d+)/,
  string: /".+"/,
  variable: /[a-zA-Z]+/,
};

/**
 * The quark class. Does parsing and is the context of a method.
 */
export class Quark {
  vars: Map<string, unknown> = new Map();
  heap: unknown[] = [];
  logs: string = "";
  counter: number = 1;

  constructor(public methods: Record<string, QuarkMethod> = StockMethods) {}

  /**
   * Parses quark code
   * @param code The code to parse
   * @returns The parsed lines and errors
   */
  parse(code: string): {
    lines: (QuarkMethodCall | null)[];
    errors: string[];
  } {
    const lines = code.split(parserRegexes.lines);
    const result = [];
    const errors: string[] = [];

    let lineNum = 1;
    for (const line of lines) {
      if (line.startsWith("#") || line.length === 0) {
        result.push(null);
        lineNum++;
        continue;
      }
      const tokenMatches = line.matchAll(parserRegexes.tokens).toArray();

      const methodName = tokenMatches[0];
      const method = this.methods[methodName[0]] as QuarkMethod | undefined;

      if (!method) {
        result.push(null);
        errors.push(`Method ${methodName} in line ${lineNum} is not defined`);
        lineNum++;
        continue;
      }

      if (tokenMatches.length !== method.documentation.args.length + 1) {
        result.push(null);
        errors.push(
          `Method call ${methodName} in line ${lineNum} has invalid argument length (has: ${
            tokenMatches.length - 1
          }, expected: ${method.documentation.args.length})`,
        );
        lineNum++;
        continue;
      }

      const args = tokenMatches.slice(1).map((tokenMatch) => {
        const tokenString = tokenMatch[0];

        switch (true) {
          case parserRegexes.number.test(tokenString):
            return Number(tokenString);
          case parserRegexes.string.test(tokenString):
            return tokenString.slice(1, -1);
          case parserRegexes.variable.test(tokenString):
            return new VariableReference(tokenString);
          default:
            errors.push(
              `Token '${tokenString}' in line ${lineNum} cannot be parsed, transformed to null`,
            );
            return null;
        }
      });
      result.push(new QuarkMethodCall(method, args));

      lineNum++;
    }
    return {
      lines: result,
      errors,
    };
  }

  /**
   * Executes quark code
   * @param code The code to execute
   */
  execute(code: string): void {
    const parsed = this.parse(code);

    if (parsed.errors.length > 0) throw new Error(parsed.errors.join("\n"));

    this.counter = 1;

    while (this.counter <= parsed.lines.length) {
      const line = parsed.lines[this.counter - 1];

      if (line) {
        line.method.handler(this, line.args);
      }

      this.counter++;
    }
  }

  /**
   * Gets a value in the quark context
   * @param value The value to get
   * @returns The value in the quark context
   */
  getVal(value: unknown): unknown {
    return value instanceof VariableReference
      ? this.vars.get(value.variableName)
      : value;
  }

  /**
   * Writes a value into a variable in the quark context
   * @param varName The variable name
   * @param value The value of the variable
   */
  writeVar(varName: unknown, value: unknown): void {
    if (!(varName instanceof VariableReference)) {
      throw new Error(`${varName} is not a valid variable name`);
    }
    this.vars.set(varName.variableName, this.getVal(value));
  }

  /**
   * Generates a docstring of a method
   * @param name The method name
   * @param method The method definition
   * @returns The generated docstring
   */
  generateDocstring(name: string, method: QuarkMethod): string {
    return `${name} ${
      method.documentation.args.map((arg) => arg.name).join(" ")
    }\n\n${method.documentation.summary}\n\n${
      method.documentation.args.length > 0 ? "Parameters:" : ""
    }\n\n${
      method.documentation.args.map((arg) =>
        `${arg.name}: ${arg.description} [${arg.type ?? "any"}]`
      ).join("\n")
    }`;
  }
}

/**
 * Ports a JS function to be usable in quark
 * @param func The JS function
 * @param type The type of JS function
 * @returns The result quark method
 */
export function JSFunctionToQuarkMethod(
  // deno-lint-ignore no-explicit-any
  func: (...args: any[]) => any,
  type: ConversionType,
): QuarkMethod {
  return {
    handler: (() => {
      switch (type) {
        case ConversionType.Void:
          return (_, args) => func(...args);
        case ConversionType.Value:
          return (ctx, args) =>
            ctx.writeVar(args.at(-1) as string, func(...args.slice(0, -1)));
      }
    })(),
    documentation: {
      summary: `Runs the JavaScript function named ${func.name}`,
      args: Array.from(Array(func.length), (_, i) => ({
        name: `argument${i + 1}`,
        description: "",
      })).concat(
        type === ConversionType.Value
          ? [{
            name: `returnname`,
            description: "The variable name for the function's return value",
          }]
          : [],
      ),
    },
  };
}

class QuarkMethodCall {
  constructor(public method: QuarkMethod, public args: unknown[]) {}
}

class VariableReference {
  constructor(public variableName: string) {}
}
