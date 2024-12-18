import type { QuarkMethod } from "../quarks.ts";

export const StockIOMethods: Record<string, QuarkMethod> = {
  "print": {
    documentation: {
      summary: "Prints it's inputs. Execute `flush` to write to output",
      args: [
        { name: "value", description: "Any value" },
      ],
    },
    handler: (ctx, [value]) => {
      ctx.logs += ctx.getVal(value);
    },
  },
  "flush": {
    documentation: {
      summary: "Flushes out the previously called print statements",
      args: [],
    },
    handler: (ctx) => {
      console.log(ctx.logs);
      ctx.logs = "";
    },
  },
  "dump": {
    documentation: {
      summary: "Dumps debug information",
      args: [],
    },
    handler: (ctx) => {
      console.log(ctx);
    },
  },
}