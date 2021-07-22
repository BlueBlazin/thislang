# Thislang

![Thislang logo](https://raw.githubusercontent.com/BlueBlazin/thislang/master/thislang-logo.png)

**WIP**

## About

This-lang (thislang) is an implementation of a subset of Javascript in that subset of Javascript.

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
- Objects
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

## Implementation

Thislang is a stack based bytecode Virtual Machine (VM). The interpretation happens in four stages.

1. **Tokenization:** the source code is broken down into a stream of lexical tokens.
2. **Parsing:** the token stream is parsed into an Abstract Syntax Tree (AST).
3. **Compilation:** The AST gets walked and compiled to bytecode.
4. **Execution:** The bytecode is executed by the VM.

## Goals:

- Self-hosting Javascript implementation
- All features listed above
- Builtins supporting the most common methods (Object.create, array.map, etc.)

## Non-goals:

- Speed
- Spec-compliance

## Background

For a while after first learning Javascript, I struggled with understanding/remembering how `this` worked in JS. A couple years ago I thoguht why not rewrite javascript (or rather a subset of it) to get a better understanding of `this`.

To my own surprise, I actually did it. Of course, you don't need to implement javascript to understand how `this` works but it was a convenient excuse to convince myself to do it.
