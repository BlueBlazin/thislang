# Thislang

<p align="center">
  <img src="https://raw.githubusercontent.com/BlueBlazin/thislang/master/thislang-logo.png" width="200" height="200" alt="thislang logo"/>
</p>

## About

This-lang (thislang) is an implementation of a subset of Javascript in that subset of Javascript. Yes, it can run itself!

## Usage

**All output is logged to console**. So to use thislang you'll need to open up the console in your browser. Click the Run button to run the code. If you want, you can also explore the outputs from the tokenizer, parser, and compiler.

https://blueblazin.github.io/thislang/

<p align="center">
  <img src="https://raw.githubusercontent.com/BlueBlazin/thislang/master/screenshot.png" width="750" height="375" alt="webapp screenshot"/>
  <h6 align="center">thislang running thislang running 'hello world'</h6>
</p>

## Features

- Data types:
  - Number
  - String
  - Array
  - Object
  - Function
  - Boolean
  - Null
  - Undefined
- Prototypal Inheritance
- Function declarations
- Function expressions
- Constructors (`new` calls)
- Conditionals
- `let` variables
- `for` and `while` loops
- `switch` statements
- Single and multi line comments
- The `this` context
- Ability to `bind` functions
- Closures
- Throw statements
- Try-catch blocks
- `call` method on function
- break and continue
- spread arguments to function calls (only the last argument)

## Implementation

<p align="center">
  <img src="https://raw.githubusercontent.com/BlueBlazin/thislang/master/mascot.png" width="400" height="533" alt="orangutan mascot"/>
</p>

Thislang is a stack based bytecode Virtual Machine (VM). The interpretation happens in four stages.

1. **Tokenization:** the source code is broken down into a stream of lexical tokens.
2. **Parsing:** the token stream is parsed into an Abstract Syntax Tree (AST).
3. **Compilation:** The AST gets walked and compiled to bytecode.
4. **Execution:** The bytecode is executed by the VM.

The file [implementation.md] details each part of interpreter.

[implementation.md]: https://github.com/BlueBlazin/thislang/blob/master/implementation.md

## Goals

- Self-hosting Javascript implementation ✅
- All features listed above ✅
- Builtins supporting the most common methods (Object.create, array.map, etc.) ✅

## Non-goals

- Speed
- Spec-compliance

## Implemented builtins

1. Object.prototype: `hasOwnProperty`
2. Array.prototype: `push`, `pop`, `map`, `filter`, `shift`, `unshift`, `slice`, `splice`, `join`
3. String.prototype: `padStart`, `padEnd`, `includes`
4. Function.prototype: `bind`, `call`
5. `<function>.prototype`
6. `<array>.length`
7. `<string>.length`
8. console: `log`, `error`
9. Object: `getPrototypeOf`, `is`, `create`, `assign`, `keys`
10. Array: `from`
11. `print`: a debug method that logs the `JSObject` instead of its string representation.

NOTE: the implementations are roughly similar to their JS equivalents.

## Not implemented

1. Arrow functions
2. Object and Array destructuring
3. Class syntax
4. ...and lots more

## Bugs

There's no doubt a large number of issues/bugs with the implementation. If you spot any, please open up an issue 😄

## Background

For a while after first learning Javascript, I struggled with understanding/remembering how `this` worked in JS. A couple years ago I thoguht why not rewrite javascript (or rather a subset of it) to get a better understanding of `this`.

To my own surprise, I actually did it. Of course, you don't need to implement javascript to understand how `this` works but it was a convenient excuse to convince myself to do it.

## Further Improvements

### 1. Removing dead shapes

The shape system of thislang is a (potentially) massive tree data structure. Whenever an object is created with properties, or a property is added to an object, this tree is walked from its root in order of the property names as they appear on the object.

Thislang will create shapes for all properties and share them whenever it can. However, because the structure holding them is a tree, all shapes are retained in memory. Even those shapes whose originating objects no longer exist.

One way to resolve this issue is to implement a small mark-and-sweep garbage collector that will periodically free up shapes which are no longer pointed to by any object. I might implement this in the future.

### 2. Better error reporting

The other main improvement is better error reporting. Currently line numbers aren't printed for runtime errors. So recording that alongside bytecode and outputting it is needed. This is a priority and I intend to implement it in the near future.
