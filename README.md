Severely over-engineered implementation of a Turing Machine in TypeScript. Done mostly as an excercise in TypeScript, Jest, and functional programming. The whole thing is immutable

Building: `npm run build:dev`
Testing: `npm run test:dev`

Example code:
```
import type { CellList } from "./src/Tape";
import * as TuringMachineFns from "./src/TuringMachine";
import * as TapeFns from "./src/Tape";
import * as HeadFns from "./src/Head";
import * as InstructionFns from "./src/Instructions";
import { Set } from "immutable";

type Sym = 0 | 1; // Type for the set of symbols which can appear on the tape
type State = "A" | "B" | "Halt"; // Type for the set of states which the turing machine can be in

const alphabet = Set<Sym>([0, 1]); // The symbols which can appear on the tape
const emptySymbol: Sym = 0; // The symbol representing an empty cell
const cellList: CellList<Sym> = [[0, 1], [1, 0], [2, 0], [3, 0], [10, 1]]; // Tuples of cell position and symbol for the tape
const tape = TapeFns.fromList(emptySymbol, cellList); // The tape to operate on
const initialPos = 0; // Initial position of the machine's head
const head = HeadFns.create(tape, initialPos); // The machine's read/write head
const possibleStates = Set<State>(["A", "B", "Halt"]); // Possible states the turing machine can be in
const haltStates = Set<State>(["Halt"]); // States in which the machine is considered halted
const initialState: State = "A"; // The machine's initial state
const instructions = InstructionFns.fromList([
	[
		{ sym: 0, state: "A" }, { newSym: 1, direction: "Right", newState: "A" }
	],
	[
		{ sym: 1, state: "A" }, { newSym: 1, direction: "Stay", newState: "Halt" }
	]
]); // Instructions for the machine

// The machine itself
const machine = TuringMachineFns.create(
	alphabet,
	head,
	possibleStates,
	haltStates,
	initialState,
	instructions
);

// The machine, advanced one step
const machine2 = TuringMachineFns.step(machine);
```

See also the tests
