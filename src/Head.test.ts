import type { CellList } from "./Tape";
import type { Direction } from "./Head";
import { fromList } from "./Tape";
import * as HeadFns from "./Head";
import * as R from "ramda";

describe("Head", () => {
	type Sym = 0 | 1 | 2 | 3 | 4 | 5;
	const alphabetList: Sym[] = [0, 1, 2, 3, 4, 5];
	const blankSymbol: Sym = 0;
	const cellList: CellList<number> = R.times(i => [i, alphabetList[i % alphabetList.length]], 20);
	const tape = fromList(blankSymbol, cellList);
	const pos = 0;

	describe("isValidDirection", () => {
		// TypeScript will mostly handle this

		it('should say "Left" is a valid direction', () => {
			expect(HeadFns.isValidDirection("Left")).toStrictEqual(true);
		});

		it('should say "Right" is a valid direction', () => {
			expect(HeadFns.isValidDirection("Right")).toStrictEqual(true);
		});

		it('should say "Stay" is a valid direction', () => {
			expect(HeadFns.isValidDirection("Stay")).toStrictEqual(true);
		});

		it('should say "Cake" is an invalid direction', () => {
			expect(HeadFns.isValidDirection("Cake" as Direction)).toStrictEqual(false);
		});
	});

	describe("create", () => {
		it("should create a new head", () => {
			HeadFns.create(tape, pos);
		});
	});

	describe("getTape", () => {
		it("should get the head's tape", () => {
			const head = HeadFns.create(tape, pos);

			expect(HeadFns.getTape(head)).toStrictEqual(tape);
		});
	});

	describe("getPosition", () => {
		it("should get the head's position", () => {
			const head = HeadFns.create(tape, pos);

			expect(HeadFns.getPosition(head)).toStrictEqual(pos);
		});
	});

	describe("move", () => {
		it("should immutably move the head one step left when asked to", () => {
			const head = HeadFns.create(tape, pos);
			const head2 = HeadFns.move("Left", head);

			expect(HeadFns.getPosition(head)).toStrictEqual(pos);
			expect(HeadFns.getPosition(head2)).toStrictEqual(pos - 1);
		});

		it("should immutably move the head one step right when asked to", () => {
			const head = HeadFns.create(tape, pos);
			const head2 = HeadFns.move("Right", head);

			expect(HeadFns.getPosition(head)).toStrictEqual(pos);
			expect(HeadFns.getPosition(head2)).toStrictEqual(pos + 1);
		});

		it("should keep the head in place when asked to", () => {
			const head = HeadFns.create(tape, pos);
			const head2 = HeadFns.move("Stay", head);

			expect(HeadFns.getPosition(head)).toStrictEqual(pos);
			expect(HeadFns.getPosition(head2)).toStrictEqual(pos);
		});
	});

	describe("read", () => {
		it("should read the cell at the current position of the head", () => {
			R.forEach(([cellNumber, sym]) => {
				const head = HeadFns.create(tape, cellNumber);

				expect(HeadFns.read(head)).toStrictEqual(sym);
			})(cellList);
		});
	});

	describe("write", () => {
		it("should immutably write the cell the head is over", () => {
			const head = HeadFns.create(tape, pos);

			const initialSym = HeadFns.read(head);
			const newSym = (Symbol() as unknown) as Sym;

			const head2 = HeadFns.write(newSym, head);

			expect(HeadFns.read(head)).toStrictEqual(initialSym);
			expect(HeadFns.read(head2)).toStrictEqual(newSym);
		});
	});
});
