import type { Tape } from "./Tape";
import * as TapeFns from "./Tape";
import * as R from "ramda";
import { Map } from "immutable";

/** A head for a Turing Machine */
export interface Head<Sym> {
	readonly tape: Tape<Sym>;
	readonly position: number;
}

/** Directions the head can move */
export type Direction = "Left" | "Right" | "Stay";

/** Map between directions and functions taking the current position and returning the new one */
const directionMap = Map<Direction, (a: number) => number>([
	["Left", R.add(-1)],
	["Right", R.add(1)],
	["Stay", R.identity]
]);

/**
 * Checks if a direction is a direction the head can move
 */
const isValidDirection = (direction: Direction): boolean => directionMap.has(direction);

/**
 * Create a new head
 *
 * @param tape	The tape to read
 * @param position	The head's position on the tape
 *
 * @returns	The newly created head
 */
const create = <Sym>(tape: Tape<Sym>, position: number): Head<Sym> => ({
	tape,
	position
});

/**
 * Gets the tape the head is using
 *
 * @param head	The head to get the tape of
 *
 * @returns	The head's tape
 */
const getTape = <Sym>(head: Head<Sym>): Tape<Sym> => head.tape;

/**
 * Gets the head's position on the tape
 *
 * @param head	The head to get the position of
 *
 * @returns	The head's position
 */
const getPosition = <Sym>(head: Head<Sym>): number => head.position;

/**
 * Reads the symbol in the cell the head is currently on
 *
 * @param head	The head to use to read
 *
 * @returns	The read symbol
 */
const read = <Sym>(head: Head<Sym>): Sym => TapeFns.readCell(getPosition(head), getTape(head));

/**
 * Writes a symbol to the cell the head is currently on
 *
 * @param sym	The symbol to write
 * @param head	The head to use to write
 *
 * @returns	A new head with the new tape state
 */
const write = <Sym>(sym: Sym, head: Head<Sym>): Head<Sym> =>
	create(TapeFns.writeCell(getPosition(head), sym, getTape(head)), head.position);

/**
 * Moves a head one cell along the tape
 *
 * @param direction	The direction to move
 * @param head	The head to move
 *
 * @returns	A head on the new position on the tape
 */
const move = <Sym>(direction: Direction, head: Head<Sym>): Head<Sym> =>
	R.compose<Head<Sym>, number, number, Head<Sym>>(
		// Create the new head
		newPos => create(getTape(head), newPos),
		// Consult the map to get the function for getting the new position
		directionMap.get(direction) as (a: number) => number,
		// Get the head's current position
		getPosition
	)(head);

export { isValidDirection, create, getTape, getPosition, read, write, move };
