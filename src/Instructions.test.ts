import type { InstructionList, Inputs, Outputs } from "./Instructions";
import type { Direction } from "./Head";
import { Set } from "immutable";
import * as R from "ramda";
import * as InstructionsFns from "./Instructions";

describe("Instructions", () => {
	type Sym = "A" | "B";
	type State = 1 | 2;

	const alphabet = Set<Sym>(["A", "B"]);
	const possibleStates = Set<State>([1, 2]);
	const inputs: Inputs<Sym, State> = { sym: "A", state: 1 };
	const outputs: Outputs<Sym, State> = { newSym: "B", direction: "Right", newState: 2 };
	const instructionList: InstructionList<Sym, State> = [[inputs, outputs]];

	describe("empty", () => {
		it("should create an empty instruction set", () => {
			const instructions = InstructionsFns.empty<string, string>();

			expect(InstructionsFns.toList(instructions)).toHaveLength(0);
		});
	});

	describe("fromList and toList", () => {
		it("should result in the same (by value) instruction list when used in succession", () => {
			const instructions = InstructionsFns.fromList(instructionList);

			expect(R.equals(InstructionsFns.toList(instructions), instructionList)).toStrictEqual(true);
		});
	});

	describe("add", () => {
		it("should immutably add an instruction to the set", () => {
			const instructions = InstructionsFns.empty<string, number>();
			const instructions2 = InstructionsFns.add(inputs, outputs, instructions);

			expect(R.equals(InstructionsFns.toList(instructions2), instructionList)).toStrictEqual(true);
			expect(InstructionsFns.toList(instructions)).toHaveLength(0);
		});

		it("should not re-add the same instruction", () => {
			const instructions = InstructionsFns.add(
				inputs,
				outputs,
				InstructionsFns.fromList(instructionList)
			);

			expect(R.equals(InstructionsFns.toList(instructions), instructionList)).toStrictEqual(true);
		});

		it("should immutably replace the outputs when given an input with different output", () => {
			const outputs2: Outputs<string, number> = { newSym: "C", direction: "Left", newState: 3 };
			const instructionList2: InstructionList<string, number> = [[inputs, outputs2]];

			const instructions = InstructionsFns.fromList(instructionList);
			const instructions2 = InstructionsFns.add(inputs, outputs2, instructions);

			expect(R.equals(InstructionsFns.toList(instructions2), instructionList2)).toStrictEqual(true);
			expect(R.equals(InstructionsFns.toList(instructions), instructionList)).toStrictEqual(true);
		});
	});

	describe("remove", () => {
		it("should immutably remove the given instruction from the instruction set", () => {
			const instructions = InstructionsFns.fromList(instructionList);
			const instructions2 = InstructionsFns.remove(inputs, instructions);

			expect(InstructionsFns.toList(instructions2)).toHaveLength(0);
			expect(R.equals(InstructionsFns.toList(instructions), instructionList)).toStrictEqual(true);
		});

		it("should not do anything if the instruction was not in the set", () => {
			const instructions = InstructionsFns.remove(inputs, InstructionsFns.empty());

			expect(InstructionsFns.toList(instructions)).toHaveLength(0);
		});
	});

	describe("run", () => {
		it("should work as a map between inputs and outputs", () => {
			const instructions = InstructionsFns.fromList(instructionList);

			expect(InstructionsFns.run(inputs, instructions)).toStrictEqual(outputs);
		});
	});

	describe("validate", () => {
		it("should not complain about a valid instruction set", () => {
			const instructions = InstructionsFns.fromList(instructionList);

			expect(() => InstructionsFns.validate(alphabet, possibleStates, instructions)).not.toThrow();
		});

		it("should complain about an invalid symbol in the inputs", () => {
			const instructions = InstructionsFns.fromList([
				[R.assoc("sym", (Symbol() as unknown) as Sym, inputs), outputs]
			]);

			expect(() => InstructionsFns.validate(alphabet, possibleStates, instructions)).toThrow();
		});

		it("should complain about an invalid state in the inputs", () => {
			const instructions = InstructionsFns.fromList([
				[R.assoc("state", (Symbol() as unknown) as Sym, inputs), outputs]
			]);

			expect(() => InstructionsFns.validate(alphabet, possibleStates, instructions)).toThrow();
		});

		it("should complain about an invalid symbol in the outputs", () => {
			const instructions = InstructionsFns.fromList([
				[inputs, R.assoc("newSym", (Symbol() as unknown) as Sym, outputs)]
			]);

			expect(() => InstructionsFns.validate(alphabet, possibleStates, instructions)).toThrow();
		});

		it("should complain about an invalid state in the outputs", () => {
			const instructions = InstructionsFns.fromList([
				[inputs, R.assoc("newState", (Symbol() as unknown) as Sym, outputs)]
			]);

			expect(() => InstructionsFns.validate(alphabet, possibleStates, instructions)).toThrow();
		});

		it("should complain about a bad direction in the outputs", () => {
			const instructions = InstructionsFns.fromList([
				[inputs, R.assoc("direction", (Symbol() as unknown) as Direction, outputs)]
			]);

			expect(() => InstructionsFns.validate(alphabet, possibleStates, instructions)).toThrow();
		});
	});

	describe("getInputs", () => {
		it("should get the instruction set's known inputs", () => {
			const instructions = InstructionsFns.fromList(instructionList);

			expect(R.equals(InstructionsFns.getInputs(instructions), [inputs])).toStrictEqual(true);
		});
	});

	describe("getOutputs", () => {
		it("should get the instruction set's known outputs", () => {
			const instructions = InstructionsFns.fromList(instructionList);

			expect(R.equals(InstructionsFns.getOutputs(instructions), [outputs])).toStrictEqual(true);
		});
	});
});
