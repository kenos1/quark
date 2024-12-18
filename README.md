# quark

A small assembly-inspired JavaScript DSL

## syntax

```bash
# comments start with a #

# Methods are called like this
methodname arg1 arg2 arg3...

# numbers
set anInteger 123
set aDecimal 3.1415

# strings
set aString "bleh"

# basic math
add 123 456 addResult
#   lhs rhs result var
# addResult = 579

# Hello World
print "Hello world!"
```

see examples directory for more

## how to integrate in js

```ts
import * as quark from "jsr:@kenos/quark";

const context = quark.Quark();

context.execute(your quark code here)
```

## todo

- quark -> js compilation
- macros (both in language and in js)