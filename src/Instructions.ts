import type { Direction } from "./Head";
import { isValidDirection } from "./Head";
import { Map, Set } from "immutable";
import * as R from "ramda";

/** Instruction set for a Turing Machine */
export type Instructions<Sym, State> = Map<Sym, Map<State, Outputs<Sym, State>>>;

/** Instruction inputs */
export interface Inputs<Sym, State> {
	readonly sym: Sym;
	readonly state: State;
}

/** Instruction outputs */
export interface Outputs<Sym, State> {
	readonly newSym: Sym;
	readonly direction: Direction;
	readonly newState: State;
}

/** List of instructions */
export type InstructionList<Sym, State> = ReadonlyArray<[Inputs<Sym, State>, Outputs<Sym, State>]>;

/**
 * Creates an empty instruction set
 *
 * @returns	An empty instruction set
 */
const empty = <Sym, State>(): Instructions<Sym, State> => Map() as Instructions<Sym, State>;

/**
 * Creates an instruction set from a list
 *
 * @param instructionList	List of tuples of inputs and outputs to use
 *
 * @returns	An instruction set with the desired instructions
 */
const fromList = <Sym, State>(instructionList: InstructionList<Sym, State>): Instructions<Sym, State> =>
	/* eslint-disable prettier/prettier */
	R.reduce(
		(instructions, [inputs, outputs]) => add(inputs, outputs, instructions),
		empty(),
		instructionList
	);
	/* eslint-enable prettier/prettier */

/**
 * Gets the instruction set as a list
 *
 * @param instructions	The instruction set to get as a list
 *
 * @returns	The list of instructions
 */
const toList = <Sym, State>(instructions: Instructions<Sym, State>): InstructionList<Sym, State> =>
	R.compose<Instructions<Sym, State>, Inputs<Sym, State>[], [Inputs<Sym, State>, Outputs<Sym, State>][]>(
		// Map them to a tuple of the inputs and their corresponding outputs
		R.map(input => [input, run(input, instructions)!]), // eslint-disable-line @typescript-eslint/no-non-null-assertion
		// Get the inputs
		getInputs
	)(instructions);

/**
 * Adds an instruction to the set, replacing the existing one if necessary
 *
 * @param inputs	The instruction inputs
 * @param outputs	The outputs corresponding to the inputs
 * @param instructions	The instruction set to add the instruction to
 *
 * @returns	The instruction set with the new instruction added
 */
const add = <Sym, State>(
	{ sym, state }: Inputs<Sym, State>,
	{ newSym, direction, newState }: Outputs<Sym, State>,
	instructions: Instructions<Sym, State>
): Instructions<Sym, State> =>
	instructions.set(sym, (instructions.get(sym) ?? Map()).set(state, { newSym, direction, newState }));

/**
 * Removes an instruction from the instruction set
 *
 * @param inputs	The inputs to remove from the set
 *
 * @returns	The instruction set without the removed instructions
 */
const remove = <Sym, State>(
	{ sym, state }: Inputs<Sym, State>,
	instructions: Instructions<Sym, State>
): Instructions<Sym, State> => {
	// TODO Make this functional

	const a = instructions.get(sym)?.remove(state);

	let res: Instructions<Sym, State>;
	// If the symbol was not found in the instruction set
	if (a === undefined) {
		res = instructions;
	}
	// If the state was not found under the symbol in the instruction set
	else if (a.isEmpty()) {
		res = instructions.remove(sym);
	}
	// If both the symbol and state was found
	else {
		res = instructions.set(sym, a);
	}

	return res;
};

/**
 * Runs an instruction, getting the output corresponding to the input
 *
 * @param inputs	The inputs to use
 * @param instructions	The instruction set to use
 *
 * @returns	The outputs
 */
const run = <Sym, State>(
	{ sym, state }: Inputs<Sym, State>,
	instructions: Instructions<Sym, State>
): Outputs<Sym, State> | null => instructions.get(sym)?.get(state) ?? null;

/**
 * Gets the possible inputs of an instruction set
 *
 * @param instructions	The instruction set to get the possible inputs of
 *
 * @returns	The instruction set's inputs
 */
const getInputs = <Sym, State>(instructions: Instructions<Sym, State>): Inputs<Sym, State>[] =>
	/* eslint-disable prettier/prettier */
	// Get all possible input states for each possible input symbol
	R.chain<Sym, Inputs<Sym, State>>(
		// Make an input object out of the pair
		sym => R.map<State, Inputs<Sym, State>>(
			state => ({ sym, state })
		)([...instructions.get(sym)!.keys()]) // eslint-disable-line  @typescript-eslint/no-non-null-assertion
	)([...instructions.keys()]);
	/* eslint-enable prettier/prettier */

/**
 * Gets the possible outputs of an instruction set
 *
 * @param instructions	The instruction set to get the possible outputs of
 *
 * @returns	The instruction set's outputs
 */
const getOutputs = <Sym, State>(instructions: Instructions<Sym, State>): Outputs<Sym, State>[] =>
	R.compose<Instructions<Sym, State>, Inputs<Sym, State>[], Outputs<Sym, State>[], Outputs<Sym, State>[]>(
		// Take only the unique ones
		R.uniqWith<Outputs<Sym, State>, Outputs<Sym, State>>(R.equals),
		// Get all the possible outputs of the instruction set
		R.map(inputs => run(inputs, instructions) as Outputs<Sym, State>),
		// Get the instruction set's possible inputs
		instructions => [...getInputs(instructions)]
	)(instructions);

/**
 * Validates the instruction set against an alphabet and a set of possible states
 *
 * @param alphabet	The alphabet to validate against
 * @param possibleStates	The set of states to validate against
 * @param instructions	The instruction set to validate
 *
 * @returns	The instruction set, if it is valid
 *
 * @throws	If the instruction set is invalid
 */
const validate = <Sym, State>(
	alphabet: Set<Sym>,
	possibleStates: Set<State>,
	instructions: Instructions<Sym, State>
): Instructions<Sym, State> => {
	// Get the inputs and outputs of the instruction set
	const inputs = getInputs(instructions);
	const outputs = getOutputs(instructions);

	// Validate the inputs
	R.forEach(({ sym, state }) => {
		if (!alphabet.has(sym)) {
			throw new Error("The instruction set contains an input symbol not in the alphabet");
		}
		if (!possibleStates.has(state)) {
			throw new Error("The instruction set contains a state not in the set of possible states");
		}
	})(inputs);

	// Validate the outputs
	R.forEach(({ newSym, direction, newState }) => {
		if (!alphabet.has(newSym)) {
			throw new Error("The instruction set contains an output symbol not in the alphabet");
		}
		if (!possibleStates.has(newState)) {
			throw new Error(
				"The instruction set contains an output state not in the set of possible states"
			);
		}
		if (!isValidDirection(direction)) {
			throw new Error("The instruction set contains an invalid direction in an output");
		}
	})(outputs);

	return instructions;
};

export { empty, fromList, add, remove, run, validate, getInputs, getOutputs, toList };
