# Thislang

![Thislang logo](https://raw.githubusercontent.com/BlueBlazin/thislang/master/thislang.png)

**WIP**

## About

This-lang is an implementation of a subset of Javascript in that subset of Javascript.

## Features

-   Data types:
    -   Number
    -   String
    -   Array
    -   Object
    -   boolean
    -   null
-   Simple Objects
-   Prototypal Inheritance
-   Function declarations
-   Function expressions (lambdas)
-   Conditionals
-   `let` variables
-   `for` and `while` loops
-   `switch` statements
-   Single and multi line comments
-   The `this` context

## Implementation

This-lang is a stack based Bytecode Virtual Machine (VM). The interpretation happens in four main stages.

1. Tokenization: the source code is broken down into a stream of lexical tokens.
2. Parsing: the token stream is parsed into an Abstract Syntax Tree (AST).
3. Compilation: The AST gets walked and compiled to bytecode.
4. Execution: The bytecode is executed by the VM.
