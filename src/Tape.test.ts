import { CellList, Tape } from "./Tape";
import { Map, Set } from "immutable";
import * as TapeFns from "./Tape";
import * as R from "ramda";

describe("TapeFns", () => {
	type Sym = 0 | 1 | 2 | 3 | 4 | 5;
	const alphabetList: Sym[] = [0, 1, 2, 3, 4, 5];
	const alphabet: Set<Sym> = Set(alphabetList);
	const blankSymbol: Sym = 0;
	const cellList: CellList<Sym> = R.times(i => [i, alphabetList[i % alphabetList.length]], 20);
	const cellListWithoutBlanks: CellList<Sym> = R.filter(([, sym]) => sym !== blankSymbol, cellList);
	const cells = Map(cellListWithoutBlanks);

	describe("create", () => {
		it("should create a tape", () => {
			TapeFns.create(blankSymbol, cells);
		});
	});

	describe("fromList and toList", () => {
		// The expected result from the tests
		const expected = R.sortBy(R.head, cellListWithoutBlanks);

		it("should result in the same (by value) cell list when used in succession", () => {
			const tape = TapeFns.fromList(blankSymbol, cellListWithoutBlanks);

			const result = R.sortBy(R.head, TapeFns.toList(tape));

			expect(R.equals(result, expected)).toStrictEqual(true);
		});

		it("should remove all blanks from the cell list", () => {
			const tape = TapeFns.fromList(blankSymbol, cellList);

			const result = R.sortBy(R.head, TapeFns.toList(tape));

			expect(R.equals(result, expected)).toStrictEqual(true);
		});
	});

	describe("createEmpty", () => {
		it("should successfully create an empty tape", () => {
			const tape = TapeFns.createEmpty(blankSymbol);

			expect(TapeFns.toList(tape)).toHaveLength(0);
		});
	});

	describe("getBlankSymbol", () => {
		it("should correctly get the blank symbol from the tape", () => {
			const tape = TapeFns.createEmpty(blankSymbol);

			expect(TapeFns.getBlankSymbol(tape)).toStrictEqual(blankSymbol);
		});
	});

	describe("getCells", () => {
		it("should get the tape's cells", () => {
			const tape = TapeFns.create(blankSymbol, cells);

			expect(TapeFns.getCells(tape)).toStrictEqual(cells);
		});
	});

	describe("getNonblankCellIndices", () => {
		it("should get a list of the indices of the non-blank cells", () => {
			const tape = TapeFns.create(blankSymbol, cells);

			const expected = R.compose<CellList<Sym>, ReadonlyArray<number>, ReadonlyArray<number>>(
				R.sortBy(R.identity),
				R.map<[number, Sym], number>(R.head)
			)(cellListWithoutBlanks);
			const result = R.compose<Tape<Sym>, ReadonlyArray<number>, ReadonlyArray<number>>(
				R.sortBy(R.identity),
				TapeFns.getNonblankCellIndices
			)(tape);

			expect(R.equals(result, expected)).toStrictEqual(true);
		});
	});

	describe("readCell", () => {
		it("should successfully read the symbols off the tape", () => {
			const tape = TapeFns.create(blankSymbol, cells);

			R.forEach<[number, Sym]>(([cellNumber, sym]) => {
				expect(TapeFns.readCell(cellNumber, tape)).toStrictEqual(sym);
			})(cellList as [number, Sym][]);
		});

		it("should read the blank symbol off cells which have not been set", () => {
			const tape = TapeFns.create(blankSymbol, cells);

			R.forEach<number>(cellNumber => {
				expect(TapeFns.readCell(cellNumber, tape)).toStrictEqual(TapeFns.getBlankSymbol(tape));
			})([-1, cellList.length, Infinity]);
		});
	});

	describe("writeCell", () => {
		it("should immutably change the symbol in the desired cell", () => {
			const oldSym = 1;
			const newSym = 2;
			const cellNumber = 0;
			const list = R.clone(cellList) as [number, Sym][];
			const i = R.findIndex(([n]) => n === cellNumber, list);
			list[i] = [cellNumber, oldSym];

			const tape = TapeFns.fromList(blankSymbol, list);
			const tape2 = TapeFns.writeCell(cellNumber, newSym, tape);

			expect(TapeFns.readCell(cellNumber, tape)).toStrictEqual(oldSym);
			expect(TapeFns.readCell(cellNumber, tape2)).toStrictEqual(newSym);
		});
	});

	describe("validate", () => {
		it("should not complain about a valid tape", () => {
			const tape = TapeFns.fromList(blankSymbol, cellList);

			expect(() => TapeFns.validate(alphabet, tape)).not.toThrow();
		});

		it("should complain about a bad blank character", () => {
			const tape = TapeFns.fromList((Symbol() as unknown) as Sym, cellList);

			expect(() => TapeFns.validate(alphabet, tape)).toThrow();
		});

		it("should complain about symbols on the tape not in the alphabet", () => {
			const tape = TapeFns.fromList(blankSymbol, cellList);
			const badAlphabet = (Set([Symbol()]) as unknown) as Set<Sym>;

			expect(() => TapeFns.validate(badAlphabet, tape)).toThrow();
		});
	});
});
