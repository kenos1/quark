import { StockIOMethods } from "./std/io.ts";
import { StockMathMethods } from "./std/math.ts";
import { StockMemoryMethods } from "./std/memory.ts";

export type QuarkMethod = {
  documentation: {
    summary: string;
    args: { name: string; description: string; type?: string }[];
  };
  handler: (context: Quark, args: unknown[]) => void;
};

export enum ConversionType {
  Void,
  Value,
}

export const StockMethods = {
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
} satisfies Record<string, QuarkMethod>;

const parserRegexes = {
  lines: /\n/gm,
  tokens: /(".+")|(\d+\.\d+)|(\d+)|([a-zA-Z]+)/gm,
  number: /(\d+\.\d+)|(\d+)/,
  string: /".+"/,
  variable: /[a-zA-Z]+/,
};

export class Quark {
  vars: Map<string, unknown> = new Map();
  heap: unknown[] = [];
  logs: string = "";
  counter: number = 1;

  constructor(public methods: Record<string, QuarkMethod> = StockMethods) {}

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

  execute(code: string) {
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

  getVal(value: unknown): unknown {
    return value instanceof VariableReference
      ? this.vars.get(value.variableName)
      : value;
  }

  writeVar(varName: unknown, value: unknown) {
    if (!(varName instanceof VariableReference)) {
      throw new Error(`${varName} is not a valid variable name`);
    }
    this.vars.set(varName.variableName, this.getVal(value));
  }

  generateDocstring(name: string, method: QuarkMethod) {
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