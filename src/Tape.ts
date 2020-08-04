import { Map, Set } from "immutable";
import * as R from "ramda";

/** The internal cell object of the tape */
type Cells<Sym> = Map<number, Sym>;

/** List representation of tape cells, with tuples of the cell's index and symbol */
export type CellList<Sym> = ReadonlyArray<[number, Sym]>;

/** A tape for a Turing Machine */
export interface Tape<Sym> {
	readonly blankSymbol: Sym;
	readonly cells: Cells<Sym>;
}

/**
 * Creates a tape
 *
 * @param blankSymbol	The symbol representing a blank cell
 * @param cells		The tape's cells
 *
 * @returns	The newly created tape
 */
const create = <Sym>(blankSymbol: Sym, cells: Cells<Sym>): Tape<Sym> => ({
	blankSymbol,
	cells
});

/**
 * Creates a tape from a list of tuples of cell positions and the symbol on that position
 *
 * @param blankSymbol	The symbol representing a blank cell
 * @param list	The list of tuples to make the tape from
 *
 * @returns	The tape with the given cells
 */
const fromList = <Sym>(blankSymbol: Sym, list: CellList<Sym>): Tape<Sym> =>
	R.reduce<[number, Sym], Tape<Sym>>(
		(tape, [cellNumber, sym]) => writeCell(cellNumber, sym, tape),
		createEmpty(blankSymbol)
	)(list);

/**
 * Gets a tape's cells as a cell list. The list will not include any instances of the empty symbol
 *
 * @param tape	The tape to make the list from
 *
 * @returns	The tape's cells as a cell list
 */
const toList = <Sym>(tape: Tape<Sym>): CellList<Sym> =>
	R.compose<Tape<Sym>, ReadonlyArray<number>, CellList<Sym>>(
		R.reduce<number, [number, Sym][]>((cellList, cellNumber) => {
			// XXX Done mutably for efficiency. O(n) vs O(n^2)
			cellList.push([cellNumber, readCell(cellNumber, tape)]);
			return cellList;
		}, []),
		getNonblankCellIndices
	)(tape);
/**
 * Creates an empty tape
 *
 * @param blankSymbol	The symbol to use for blank cells on the tape
 *
 * @returns	An empty tape
 */
const createEmpty = <Sym>(blankSymbol: Sym): Tape<Sym> => create(blankSymbol, Map<number, Sym>());

/**
 * Gets the symbol signalling a blank cell from a tape
 *
 * @param tape	The tape to get the symbol from
 *
 * @returns	The symbol representing a blank cell
 */
const getBlankSymbol = <Sym>(tape: Tape<Sym>): Sym => tape.blankSymbol;

/**
 * Gets the tape's cells. Mostly for internal use
 *
 * @param tape	The tape to get the cells of
 *
 * @returns	The tape's cells
 */
const getCells = <Sym>(tape: Tape<Sym>): Cells<Sym> => tape.cells;

/**
 * Gets the indices of the tape cells which are not blank
 *
 * @param tape	The tape to get the non-blank indices from
 *
 * @returns	A list of the indices of the non-blank cells on the tape
 */
const getNonblankCellIndices = <Sym>(tape: Tape<Sym>): ReadonlyArray<number> => [...getCells(tape).keys()];

/**
 * Writes a symbol to a cell on the tape
 *
 * @param cellNumber	Number of the cell to write to
 * @param sym	The symbol to write
 * @param tape	The tape to write to
 *
 * @returns	A new tape with the wanted cell changed to the wanted symbol
 */
const writeCell = <Sym>(cellNumber: number, sym: Sym, tape: Tape<Sym>): Tape<Sym> =>
	create(
		getBlankSymbol(tape),
		sym === getBlankSymbol(tape)
			? // Delete the cell if the new symbol is the blank symbol
			  getCells(tape).delete(cellNumber)
			: // Otherwise write it
			  getCells(tape).set(cellNumber, sym)
	);

/**
 * Reads a symbol from a cell on the tape
 *
 * @param cellNumber	The cell number to read
 * @param tape	The tape to read from
 *
 * @returns	The read symbol
 */
const readCell = <Sym>(cellNumber: number, tape: Tape<Sym>): Sym => tape.cells.get(cellNumber) ?? tape.blankSymbol;

/**
 * Validates a tape against an alphabet of symbols
 *
 * @param alphabet	The alphabet to validate against
 * @param tape	The tape to validate
 *
 * @returns	The tape, if it is valid
 *
 * @throws	If the tape contains symbols not in the alphabet
 */
const validate = <Sym>(alphabet: Set<Sym>, tape: Tape<Sym>): Tape<Sym> => {
	// Verify that the tape's blank symbol is part of the alphabet
	if (!alphabet.has(getBlankSymbol(tape))) {
		throw new Error("The tape's blank symbol is not part of the alphabet");
	}

	// Get the symbols from the tape
	R.compose<Tape<Sym>, ReadonlyArray<number>, ReadonlyArray<number>>(
		R.forEach(
			R.unless(
				cellNumber => alphabet.has(readCell(cellNumber, tape)),
				() => {
					throw new Error("The symbols on the tape is not a subset of the alphabet");
				}
			)
		),
		getNonblankCellIndices
	)(tape);

	return tape;
};

export {
	create,
	fromList,
	toList,
	createEmpty,
	getBlankSymbol,
	getCells,
	getNonblankCellIndices,
	writeCell,
	readCell,
	validate
};
