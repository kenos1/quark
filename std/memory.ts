import type { QuarkMethod } from "../quarks.ts";

export const StockMemoryMethods: Record<string, QuarkMethod> = {
  "set": {
    documentation: {
      summary: "Writes a value to a variable",
      args: [
        {
          name: "varname",
          description: "The variable name to write the value to",
          type: "string",
        },
        { name: "value", description: "The value of the variable" },
      ],
    },
    handler: (ctx, [varname, value]) => {
      ctx.writeVar(varname, value);
    },
  },
  "alloc": {
    documentation: {
      summary: "Allocates space in the context's heap",
      args: [
        {
          name: "amount",
          description: "The amount of space to allocate",
          type: "number",
        },
      ],
    },
    handler: (ctx, [amount]) => {
      ctx.heap.concat(Array(amount).fill(null));
    },
  },
  "heapsize": {
    documentation: {
      summary: "Writes the heap's size to a variable",
      args: [
        { name: "varname", description: "The variable to store the value" },
      ],
    },
    handler: (ctx, [varname]) => {
      ctx.writeVar(varname, ctx.heap.length);
    },
  },
  "write": {
    documentation: {
      summary: "Writes a value into the context's heap",
      args: [
        {
          name: "address",
          description: "The address to write to",
          type: "number",
        },
        { name: "value", description: "The value to write" },
      ],
    },
    handler: (ctx, [address, value]) => {
      ctx.heap[ctx.getVal(address) as number] = ctx.getVal(value);
    },
  },
  "read": {
    documentation: {
      summary: "Reads a value from the context's heap",
      args: [
        {
          name: "address",
          description: "The address to read from",
          type: "number",
        },
        { name: "varname", description: "The variable to store the value" },
      ],
    },
    handler: (ctx, [address, varname]) => {
      ctx.writeVar(varname, ctx.heap[address as number]);
    },
  },
};
