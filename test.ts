import {
  ConversionType,
  JSFunctionToQuarkMethod,
  Quark,
  StockMethods,
} from "./quarks.ts";

const file = Deno.readTextFileSync("./operations.quark");

const ctx = new Quark({
  sin: JSFunctionToQuarkMethod(Math.sin, ConversionType.Value),
  ...StockMethods,
});

ctx.execute(file);
