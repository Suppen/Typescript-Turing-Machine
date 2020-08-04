import type { Inputs, Outputs } from "./Instructions";
import { Set } from "immutable";
import * as TuringMachineFns from "./TuringMachine";
import * as TapeFns from "./Tape";
import * as HeadFns from "./Head";
import * as InstructionsFns from "./Instructions";

describe("TuringMachine", () => {
	type Sym = 0 | 1;
	type State = "A" | "Halt";

	const initialPos = 0;
	const inputs = { sym: 0, state: "A" } as Inputs<number, string>;
	const outputs = { newSym: 1, direction: "Right", newState: "Halt" } as Outputs<number, string>;
	const alphabet = Set([inputs.sym, outputs.newSym]);
	const blankSymbol = inputs.sym;
	const tape = TapeFns.fromList(blankSymbol, [[initialPos, inputs.sym]]);
	const head = HeadFns.create(tape, initialPos);
	const possibleStates = Set([inputs.state, outputs.newState]);
	const haltStates = Set([outputs.newState]);
	const initialState = inputs.state;
	const instructions = InstructionsFns.fromList([[inputs, outputs]]);

	const createTuringMachine = () =>
		TuringMachineFns.create(alphabet, head, possibleStates, haltStates, initialState, instructions);

	describe("create", () => {
		it("should create a turing machine", () => {
			expect(createTuringMachine).not.toThrow();
		});
	});

	describe("getAlphabet", () => {
		it("should get the machine's alphabet", () => {
			const machine = createTuringMachine();

			expect(TuringMachineFns.getAlphabet(machine)).toStrictEqual(alphabet);
		});
	});

	describe("getBlankSymbol", () => {
		it("should get the machine's blank symbol", () => {
			const machine = createTuringMachine();

			expect(TuringMachineFns.getBlankSymbol(machine)).toStrictEqual(blankSymbol);
		});
	});

	describe("getHaltStates", () => {
		it("should get the machine's halt states", () => {
			const machine = createTuringMachine();

			expect(TuringMachineFns.getHaltStates(machine)).toStrictEqual(haltStates);
		});
	});

	describe("getPossibleStates", () => {
		it("should get the machine's possible states", () => {
			const machine = createTuringMachine();

			expect(TuringMachineFns.getPossibleStates(machine)).toStrictEqual(possibleStates);
		});
	});

	describe("getState", () => {
		it("should get the machine's current state", () => {
			const machine = createTuringMachine();

			expect(TuringMachineFns.getState(machine)).toStrictEqual(initialState);
		});
	});

	describe("getHead", () => {
		it("should get the machine's head", () => {
			const machine = createTuringMachine();

			expect(TuringMachineFns.getHead(machine)).toStrictEqual(head);
		});
	});

	describe("getTape", () => {
		it("should get the machine's tape", () => {
			const machine = createTuringMachine();

			expect(TuringMachineFns.getTape(machine)).toStrictEqual(tape);
		});
	});

	describe("getInstructions", () => {
		it("should get the machine's instruction set", () => {
			const machine = createTuringMachine();

			expect(TuringMachineFns.getInstructions(machine)).toStrictEqual(instructions);
		});
	});

	describe("isHalted", () => {
		const nonHaltStates = possibleStates.subtract(haltStates);

		it("should say a machine with a non-halted state is not halted", () => {
			[...nonHaltStates].forEach(state => {
				const machine = TuringMachineFns.create(
					alphabet,
					head,
					possibleStates,
					haltStates,
					state,
					instructions
				);

				expect(TuringMachineFns.isHalted(machine)).toStrictEqual(false);
			});
		});

		it("should say a machine with a halted state is not halted", () => {
			[...haltStates].forEach(state => {
				const machine = TuringMachineFns.create(
					alphabet,
					head,
					possibleStates,
					haltStates,
					state,
					instructions
				);

				expect(TuringMachineFns.isHalted(machine)).toStrictEqual(true);
			});
		});
	});

	describe("validate", () => {
		it("should not complain about a valid turing machine", () => {
			const machine = createTuringMachine();

			expect(() => TuringMachineFns.validate(machine)).not.toThrow();
		});

		it("should complain about an invalid blank symbol", () => {
			const machine = TuringMachineFns.create(
				alphabet.delete(blankSymbol),
				head,
				possibleStates,
				haltStates,
				initialState,
				instructions
			);

			expect(() => TuringMachineFns.validate(machine)).toThrow();
		});

		it("should complain about an invalid state", () => {
			const machine = TuringMachineFns.create(
				alphabet,
				head,
				possibleStates.delete(initialState),
				haltStates,
				initialState,
				instructions
			);

			expect(() => TuringMachineFns.validate(machine)).toThrow();
		});

		it("should complain about halt states outside the set of possible states", () => {
			const machine = TuringMachineFns.create(
				alphabet,
				head,
				possibleStates,
				haltStates.add((Symbol() as unknown) as State),
				initialState,
				instructions
			);

			expect(() => TuringMachineFns.validate(machine)).toThrow();
		});

		it("should complain about tapes with invalid symbols", () => {
			const machine = TuringMachineFns.create(
				alphabet,
				HeadFns.write((Symbol() as unknown) as Sym, head),
				possibleStates,
				haltStates,
				initialState,
				instructions
			);

			expect(() => TuringMachineFns.validate(machine)).toThrow();
		});

		it("should complain about invalid instruction sets", () => {
			const machine = TuringMachineFns.create(
				alphabet,
				head,
				possibleStates,
				haltStates,
				initialState,
				InstructionsFns.add(
					{ sym: (Symbol() as unknown) as Sym, state: (Symbol() as unknown) as State },
					{
						newSym: (Symbol() as unknown) as Sym,
						direction: "Left",
						newState: (Symbol() as unknown) as State
					},
					instructions
				)
			);

			expect(() => TuringMachineFns.validate(machine)).toThrow();
		});
	});

	describe("step", () => {
		it("should immutably advance the machine to its next state", () => {
			const machine = createTuringMachine();
			const machine2 = TuringMachineFns.step(machine);

			// Check everything which should be the same
			expect(TuringMachineFns.getAlphabet(machine)).toStrictEqual(
				TuringMachineFns.getAlphabet(machine2)
			);
			expect(TuringMachineFns.getPossibleStates(machine)).toStrictEqual(
				TuringMachineFns.getPossibleStates(machine2)
			);
			expect(TuringMachineFns.getHaltStates(machine)).toStrictEqual(
				TuringMachineFns.getHaltStates(machine2)
			);
			expect(TuringMachineFns.getInstructions(machine)).toStrictEqual(
				TuringMachineFns.getInstructions(machine2)
			);
			expect(TuringMachineFns.getBlankSymbol(machine)).toStrictEqual(
				TuringMachineFns.getBlankSymbol(machine2)
			);

			// Check that the new instance has advanced
			expect(TuringMachineFns.getState(machine2)).toStrictEqual(outputs.newState);
			expect(HeadFns.getPosition(TuringMachineFns.getHead(machine2))).toStrictEqual(initialPos + 1);
			const tape2 = HeadFns.getTape(TuringMachineFns.getHead(machine2));
			expect(TapeFns.readCell(initialPos, tape2)).toStrictEqual(outputs.newSym);

			// Check that the old instance has not changed
			expect(TuringMachineFns.getState(machine)).toStrictEqual(inputs.state);
			expect(HeadFns.getPosition(TuringMachineFns.getHead(machine))).toStrictEqual(initialPos);
			const tape = HeadFns.getTape(TuringMachineFns.getHead(machine));
			expect(TapeFns.readCell(initialPos, tape)).toStrictEqual(inputs.sym);
		});

		it("should throw when in a halted state", () => {
			const machine = TuringMachineFns.create(
				alphabet,
				head,
				possibleStates,
				haltStates,
				[...haltStates][0],
				instructions
			);

			expect(() => TuringMachineFns.step(machine)).toThrow();
		});

		it("should throw when given instructions not in its instruction set", () => {
			// Get the first instruction in the set, and rig the machine to trigger it
			const inputs = InstructionsFns.toList(instructions)[0][0];
			const tape = TapeFns.fromList(blankSymbol, [[0, inputs.sym]]);
			const head = HeadFns.create(tape, 0);

			const machine = TuringMachineFns.create(
				alphabet,
				head,
				possibleStates,
				haltStates,
				inputs.state,
				InstructionsFns.remove(inputs, instructions)
			);

			expect(() => TuringMachineFns.step(machine)).toThrow();
		});
	});
});
