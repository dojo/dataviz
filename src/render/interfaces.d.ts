import { Datum } from '../data/interfaces';

/**
 * Provides the interface for the invalidate() method from dojo-widgets/mixins/createCachedRenderMixin.
 *
 * It's used in mixins that are designed to be used with a class that contains an invalidate() implementation. Using
 * this interface, and leaving invalidate() optional, better expresses the requirement than using an <any> hammer.
 */
export interface Invalidatable {
	invalidate?(): void;
}

/**
 * Describes a plot point.
 *
 * Note that the rendered shape may not be a "point" at all, and may occupy only a subset of the area described by the
 * point positions. If applicable the area should include any spacing up to the next point.
 *
 * All coordinates assume (0, 0) starts in the top-left corner of the coordinate system.
 */
export interface Point<D extends Datum<any>> {
	/**
	 * Datum represented by the point.
	 */
	datum: D;

	/**
	 * Horizontal start position.
	 */
	x1: number;

	/**
	 * Horizontal end position.
	 */
	x2: number;

	/**
	 * Vertical start position.
	 */
	y1: number;

	/**
	 * Vertical end position.
	 */
	y2: number;
}
