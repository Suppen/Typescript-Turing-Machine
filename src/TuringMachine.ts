import { Set } from "immutable";
import type { Head } from "./Head";
import type { Tape } from "./Tape";
import type { Instructions } from "./Instructions";
import * as HeadFns from "./Head";
import * as TapeFns from "./Tape";
import * as InstructionsFns from "./Instructions";
import * as R from "ramda";

/** A turing machine */
interface TuringMachine<Sym, State> {
	readonly alphabet: Set<Sym>;
	readonly head: Head<Sym>;
	readonly possibleStates: Set<State>;
	readonly haltStates: Set<State>;
	readonly state: State;
	readonly instructions: Instructions<Sym, State>;
}

/**
 * Creates a new turing machine
 *
 * @param alphabet	The alphabet of symbols which can be on the tape
 * @param head	The machine's head
 * @param possibleStates	The machine's possible states
 * @param haltStates	States in which the machine halts
 * @param state		The machine's current state
 * @param instructions	Instructions for the machine
 *
 * @returns	The created turing machine
 */
const create = <Sym, State>(
	alphabet: Set<Sym>,
	head: Head<Sym>,
	possibleStates: Set<State>,
	haltStates: Set<State>,
	state: State,
	instructions: Instructions<Sym, State>
): TuringMachine<Sym, State> => ({
	alphabet,
	head,
	possibleStates,
	haltStates,
	state,
	instructions
});

/**
 * Gets the turing machine's alphabet
 *
 * @param machine	The machine to get the alphabet of
 *
 * @returns	The machine's alphabet
 */
const getAlphabet = <Sym, State>({ alphabet }: TuringMachine<Sym, State>): Set<Sym> => alphabet;

/**
 * Gets the symbol representing a blank cell on the tape
 *
 * @param machine	The machine to get the blank symbol of
 *
 * @returns	The machine's blank symbol
 */
const getBlankSymbol = <Sym, State>(machine: TuringMachine<Sym, State>): Sym =>
	/* eslint-disable prettier/prettier */
	R.compose<TuringMachine<Sym, State>, Head<Sym>, Tape<Sym>, Sym>(
		TapeFns.getBlankSymbol,
		HeadFns.getTape,
		getHead
	)(machine);
	/* eslint-enable prettier/prettier */

/**
 * Gets the turing machine's head
 *
 * @param machine	The turing machine to get the head of
 *
 * @returns	The turing machine's head
 */
const getHead = <Sym, State>(machine: TuringMachine<Sym, State>): Head<Sym> => machine.head;

/**
 * Gets the turing machine's tape
 *
 * @param machine	The turing machine to get the tape of
 *
 * @returns	The turing machine's tape
 */
const getTape = <Sym, State>(machine: TuringMachine<Sym, State>): Tape<Sym> =>
	/* eslint-disable prettier/prettier */
	R.compose<TuringMachine<Sym, State>, Head<Sym>, Tape<Sym>>(
		HeadFns.getTape,
		getHead
	)(machine);
	/* eslint-enable prettier/prettier */

/**
 * Gets a turing machine's possible states
 *
 * @param machine	The turing machine to get the possible states of
 *
 * @returns	A set of the machine's possible states
 */
const getPossibleStates = <Sym, State>(machine: TuringMachine<Sym, State>): Set<State> => machine.possibleStates;

/**
 * Gets a turing machine's halt states
 *
 * @param machine	The turing machine to get the halt states of
 *
 * @returns	A set of the machine's halt states
 */
const getHaltStates = <Sym, State>(machine: TuringMachine<Sym, State>): Set<State> => machine.haltStates;

/**
 * Gets a turing machine's current state
 *
 * @param machine	The machine to get the state of
 *
 * @returns	The machine's current state
 */
const getState = <Sym, State>(machine: TuringMachine<Sym, State>): State => machine.state;

/**
 * Gets the turing machine's instructions
 *
 * @param machine	The turing machine to get the instructions of
 *
 * @returns	The machine's instruction function
 */
const getInstructions = <Sym, State>(machine: TuringMachine<Sym, State>): Instructions<Sym, State> =>
	machine.instructions;

/**
 * Checks whether or not a machine is in a halting state
 *
 * @param machine	The machine to check
 *
 * @returns	True if the machine is in a halting state, false otherwise
 */
const isHalted = <Sym, State>(machine: TuringMachine<Sym, State>): boolean =>
	getHaltStates(machine).has(getState(machine));

/**
 * Validates a turing machine
 *
 * @param machine	The machine to validate
 *
 * @returns	The machine, if it is valid
 *
 * @throws	If the machine is invalid
 */
const validate = <Sym, State>(machine: TuringMachine<Sym, State>): TuringMachine<Sym, State> => {
	// Verify that the blank symbol is in the alphabet
	if (!getAlphabet(machine).has(getBlankSymbol(machine))) {
		throw new Error("The machine's blank symbol is not in its alphabet");
	}

	// Verify that the current state is in the set of states
	if (!getPossibleStates(machine).has(getState(machine))) {
		throw new Error("The machine is not in a possible state");
	}

	// Verify that the halt states are a subset of the possible states
	if (!getHaltStates(machine).isSubset(getPossibleStates(machine))) {
		throw new Error("The machine's halt states are not a subset of the machine's possible states");
	}

	// Verify that the instructions all result in valid states and symbols
	InstructionsFns.validate(getAlphabet(machine), getPossibleStates(machine), getInstructions(machine));

	// Validate the tape
	TapeFns.validate(getAlphabet(machine), getTape(machine));

	return machine;
};

/**
 * Executes one step of a machine's computation
 *
 * @param machine	The machine to execute the step on
 *
 * @returns	The turing machine after the step has been executed
 *
 * @throws	If there is no instruction corresponding to the symbol and state
 */
const step = <Sym, State>(machine: TuringMachine<Sym, State>): TuringMachine<Sym, State> => {
	// Check if the machine is halted
	if (isHalted(machine)) {
		throw new Error("The machine has alredy halted");
	}

	// Read the symbol under the head
	const sym = HeadFns.read(getHead(machine));

	// Get the current state of the machine
	const state = getState(machine);

	// Execute the corresponding instruction
	const result = InstructionsFns.run({ sym, state }, getInstructions(machine));

	// Check that it was valid
	if (result === null) {
		throw new Error("Could not step the turing machine due to an invalid instruction");
	}

	// Parse the result
	const { newSym, direction, newState } = result;

	// Advance the machine
	return create(
		getAlphabet(machine),
		R.compose<TuringMachine<Sym, State>, Head<Sym>, Head<Sym>, Head<Sym>>(
			head => HeadFns.move(direction, head),
			head => HeadFns.write(newSym, head),
			getHead
		)(machine),
		getPossibleStates(machine),
		getHaltStates(machine),
		newState,
		getInstructions(machine)
	);
};

export {
	create,
	getAlphabet,
	getBlankSymbol,
	getHaltStates,
	getHead,
	getTape,
	getPossibleStates,
	getState,
	getInstructions,
	isHalted,
	validate,
	step
};
