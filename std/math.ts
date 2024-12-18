import { QuarkMethod } from "../quarks.ts";

function generateOperationDocumentation(
  verb: string,
  resultName: string,
): QuarkMethod["documentation"] {
  return {
    summary: `${verb} two numbers and writes it to a variable`,
    args: [
      {
        name: "lhs",
        description: `The left hand side of the ${resultName}`,
        type: "number",
      },
      {
        name: "rhs",
        description: `The right hand side of the ${resultName}`,
        type: "number",
      },
      {
        name: "varname",
        description: "The variable to write the result to",
      },
    ],
  };
}

function generateComparisionDocumentation(
  verb: string,
): QuarkMethod["documentation"] {
  return {
    summary: `Compares if the left hand side is ${verb} the right hand side`,
    args: [
      {
        name: "lhs",
        description: `The left hand side of the comparision`,
        type: "number",
      },
      {
        name: "rhs",
        description: `The right hand side of the comparision`,
        type: "number",
      },
      {
        name: "varname",
        description: "The variable to write the comparision to (either 0 or 1)",
      },
    ],
  };
}

export const StockMathMethods = {
  "add": {
    documentation: generateOperationDocumentation("Adds", "addition"),
    handler: (ctx, [lhs, rhs, varname]) => {
      ctx.writeVar(varname, Number(ctx.getVal(lhs)) + Number(ctx.getVal(rhs)));
    },
  },
  "sub": {
    documentation: generateOperationDocumentation("Subtracts", "result"),
    handler: (ctx, [lhs, rhs, varname]) => {
      ctx.writeVar(varname, Number(ctx.getVal(lhs)) - Number(ctx.getVal(rhs)));
    },
  },
  "mul": {
    documentation: generateOperationDocumentation("Multiplies", "product"),
    handler: (ctx, [lhs, rhs, varname]) => {
      ctx.writeVar(varname, Number(ctx.getVal(lhs)) * Number(ctx.getVal(rhs)));
    },
  },
  "div": {
    documentation: generateOperationDocumentation("Divides", "result"),
    handler: (ctx, [lhs, rhs, varname]) => {
      ctx.writeVar(varname, Number(ctx.getVal(lhs)) / Number(ctx.getVal(rhs)));
    },
  },

  "les": {
    documentation: generateComparisionDocumentation("lesser than"),
    handler: (ctx, [lhs, rhs, varname]) => {
      ctx.writeVar(
        varname,
        Number(ctx.getVal(lhs)) < Number(ctx.getVal(rhs)) ? 1 : 0,
      );
    },
  },
  "gre": {
    documentation: generateComparisionDocumentation("greater than"),
    handler: (ctx, [lhs, rhs, varname]) => {
      ctx.writeVar(
        varname,
        Number(ctx.getVal(lhs)) > Number(ctx.getVal(rhs)) ? 1 : 0,
      );
    },
  },
  "lesoe": {
    documentation: generateComparisionDocumentation("lesser than or equal to"),
    handler: (ctx, [lhs, rhs, varname]) => {
      ctx.writeVar(
        varname,
        Number(ctx.getVal(lhs)) <= Number(ctx.getVal(rhs)) ? 1 : 0,
      );
    },
  },
  "greoe": {
    documentation: generateComparisionDocumentation("greater than or equal to"),
    handler: (ctx, [lhs, rhs, varname]) => {
      ctx.writeVar(
        varname,
        Number(ctx.getVal(lhs)) >= Number(ctx.getVal(rhs)) ? 1 : 0,
      );
    },
  },
  "eq": {
    documentation: generateComparisionDocumentation("equal to"),
    handler: (ctx, [lhs, rhs, varname]) => {
      ctx.writeVar(varname, ctx.getVal(lhs) == ctx.getVal(rhs) ? 1 : 0);
    },
  },
} satisfies Record<string, QuarkMethod>;
