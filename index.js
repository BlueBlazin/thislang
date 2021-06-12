//==================================================
// Constants
//==================================================

// flag for debug logging
let DEBUG = true;

let STACK_MAX = 1024;

//==================================================
//  Bytecode
//==================================================

let Opcodes = {
    POP: 0x00,
    LOG: 0x01,
};

//==================================================
// Helpers
//==================================================

/** Returns an array of specified size filled with specified value */
let initArray = function (size, fillValue) {
    let arr = [];

    for (let i = 0; i < size; i++) {
        arr.push(fillValue);
    }

    return arr;
};

let dbg = function () {
    if (DEBUG) {
        console.log(...arguments);
    }
};

//==================================================
// VM
//==================================================

function Vm(code) {
    // instruction pointer
    this.ip = 0;
    // stack pointer
    this.sp = 0;
    this.code = code;
    this.stack = initArray(STACK_MAX, 0);
}

/** Run VM */
Vm.prototype.run = function () {
    // main interpreter loop
    while (this.ip < this.code.length) {
        switch (this.fetch()) {
            case Opcodes.POP:
                this.opPop();
                break;
            case Opcodes.LOG:
                this.opLog();
                break;
        }
    }
};

//--------------------------------------------------
// VM - instructions
//--------------------------------------------------

/** Pop value from top of stack and discard it */
Vm.prototype.opPop = function () {
    dbg("Op POP");
    if (this.sp > 0) {
        this.pop();
    } else {
        this.panic();
    }
};

/** Pop top value from stack and log it to console */
Vm.prototype.opLog = function () {
    dbg("Op LOG");
    let value = this.pop();
    console.log(value);
};

//--------------------------------------------------
// VM - utils
//--------------------------------------------------

/** Fetch next opcode */
Vm.prototype.fetch = function () {
    return this.code[this.ip++];
};

/** Panic */
Vm.prototype.panic = function () {
    return;
};

/** Push value on top of stack */
Vm.prototype.push = function (value) {
    if (this.sp < STACK_MAX) {
        this.stack[this.sp++] = value;
        dbg("Stack after push:", this.stack.slice(0, this.sp));
    } else {
        this.panic();
    }
};

/** Pop value from top of stack and return it */
Vm.prototype.pop = function () {
    if (this.sp > 0) {
        let value = this.stack[--this.sp];
        dbg("Stack after POP:", this.stack.slice(0, this.sp));
        return value;
    } else {
        this.panic();
    }
};

//==================================================
// Main
//==================================================

(function () {
    let vm = new Vm([Opcodes.LOG]);
    vm.push(42);

    vm.run();
})();
