import { Quark, StockMethods } from "./quarks.ts";

let shouldStillRun = true;

const ctx = new Quark({
  ...StockMethods,
  doc: {
    documentation: {
      summary: "Prints out the documentation of the selected function",
      args: [{ name: "name", description: "The function name" }],
    },
    handler: (ctx, [name]) => {
      const method = ctx.methods[ctx.getVal(name) as string];
      if (!method) {
        console.error(`Method ${ctx.getVal(name)} not found!`);
        return;
      }
      console.log(ctx.generateDocstring(ctx.getVal(name) as string, method));
    },
  },
  listmethods: {
    documentation: {
      summary: "Lists all the avaliable methods",
      args: [],
    },
    handler: (ctx) => {
      console.log(
        Object.entries(ctx.methods).map(([name, method]) =>
          `${name} ${
            method.documentation.args.map((arg) =>
              `${arg.name}: ${arg.type ?? "any"}`
            ).join(" ")
          }`
        ).join("\n"),
      );
    },
  },
  exit: {
    documentation: {
      summary: "Exits the cli",
      args: []
    },
    handler: () => {
      console.log("Goodbye!")
      shouldStillRun = false;
    }
  }
});

while (shouldStillRun) {
  try {
    const code = prompt("quark>");
    if (code) ctx.execute(code.replaceAll(";", "\n"));
  } catch (e) {
    console.error(e);
  }
}
