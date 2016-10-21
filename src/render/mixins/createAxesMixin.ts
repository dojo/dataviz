import compose, { ComposeFactory } from 'dojo-compose/compose';
import { h, VNode } from 'maquette';

import { Datum } from '../../data/interfaces';
import { Domain, Invalidatable, Point, Plot, Values } from '../interfaces';

/* TODO! FIXME!

Hello! This mixin is not yet feature complete:

	* It assumes datum values are >= 0 for horizontal axes (no negative values), but <= is supported for vertical axes
	* Axes configuration cannot be provided through the widget state. This would also require label selectors to be
	  defined on the prototype since they can't be serialized into the state. Perhaps as topInputLabelSelector, etc
	* Axes configuration can only be provided through the prototype. This is necessary to create widgets with a
	  default configuration
	* It's unclear how a default configuration would be merged with options in state
	* Certain configuration may be default for all enabled axes (e.g. ticks). Would be cool not to have to repeat that
	* Chart dimensions are not adjusted if exceeded by grid lines
	* No support for "mini ticks". These should probably be restricted to range based axes, where the step size
	  must be a multiple of the mini tick interval
	* Consider center (vertical) and middle (horizontal) axes for charts with negative values
	* Our targeted IE versions may not support dominant-baseline. If we know the line-height we may be able to polyfill
	  the currently limited set of allowed values, or maybe we need to support a perpendicularOffset option and remove
	  dominantBaseline
	* We may need perpendicularOffset anyhow (e.g. for the bottom axis it would move the label down, for the left axis
	  it would move it further left)
	* Axes tend to draw duplicate ticks and grid lines for the "zero" position

See issue #9. Good luck!
*/

/**
 * Configuration for a particular axis.
 */
export type AxisConfiguration<D> = HardcodedAxis | InputBasedAxis<D> | RangeBasedAxis;

export interface SharedConfiguration {
	/**
	 * Set to display grid lines behind the chart.
	 *
	 * The lines will eminating from this axis and be aligned with the axis markings.
	 */
	gridLines?: boolean | GridLineConfiguration; // TODO: When supported, use `true` literal type, not boolean (issue #4)

	/**
	 * Set to `false` to disable labels. Alternatively provide configuration for how the labels are positioned.
	 */
	labels?: boolean | LabelConfiguration; // TODO: When supported, use `false` literal type, not boolean (issue #4)

	/**
	 * Set to display ticks for the axis markings.
	 */
	ticks?: TickConfiguration;
};

export interface GridLineConfiguration {
	/**
	 * If set, renders the line with a fixed length. Else the line is rendered to the end of the chart (in the direction
	 * of the axis)
	 */
	length?: number;

	/**
	 * If set, renders a line for the zero point of the chart.
	 */
	zeroth?: boolean;
}

export type Anchor = 'start' | 'middle' | 'end';

export interface LabelConfiguration {
	/**
	 * The side of the plot point the label should be anchored to.
	 *
	 * Follows the direction of the axis. Defaults to 'middle'. Only has an effect for input and range based axes.
	 */
	anchor?: Anchor;

	/**
	 * The dominant baseline of the text, relative to the label's position.
	 *
	 * For bottom axes this defaults to 'text-before-edge', for top axes 'text-after-edge', and for left and right
	 * axes to 'middle'.
	 */
	dominantBaseline?: 'middle' | 'text-after-edge' | 'text-before-edge';

	/**
	 * Pixel offset for the label's position, following the direction of the axis.
	 */
	offset?: number;

	/**
	 * Rotation of the label, relative to its anchor point.
	 */
	rotation?: number;

	/**
	 * How the label text should be anchored, relative to the side of the plot point the label is anchored to.
	 *
	 * Follows the direction of the axis. For bottom and top axes this to 'middle', for left axes to 'end', and for
	 * right axes to 'start'.
	 */
	textAnchor?: Anchor;
}

export interface TickConfiguration {
	/**
	 * The side of the plot point the tick should be anchored to.
	 *
	 * Follows the direction of the axis. Defaults to 'middle'. Only has an effect for input based axes.
	 */
	anchor?: Anchor;

	/**
	 * Renders a tick with the given length.
	 */
	length: number;

	/**
	 * Pixel offset for the tick's position, following the direction of the axis.
	 */
	offset?: number;

	/**
	 * If set, renders a tick for the zero point of the chart.
	 */
	zeroth?: boolean;
}

export interface HardcodedAxis extends SharedConfiguration {
	/**
	 * A hardcoded list of axis markings.
	 *
	 * Each marking should be a floating point number that is >= 0 and <= 1. This is scaled to the end of the chart
	 * (in the direction of the axis). Values that are less than 0 or greater than 1 are ignored.
	 *
	 * By default no label is shown, however you can provide tuples of marking numbers and label strings.
	 */
	hardcoded: number[] | [ number, string ][];
}

export function isHardcoded(cfg: AxisConfiguration<any>): cfg is HardcodedAxis {
	return 'hardcoded' in cfg;
}

export interface InputBasedAxis<D> extends SharedConfiguration {
	/**
	 * Distribute markings based on how the inputs are plotted.
	 */
	inputs: boolean | { // TODO: When supported, use `true` literal type, not boolean (issue #4)
		/**
		 * Selects the label to be shown next to the marking.
		 */
		labelSelector: (datum: D) => string;
	};
}

export function isInputBased<D extends Datum<any>>(cfg: AxisConfiguration<D>): cfg is InputBasedAxis<D> {
	return 'inputs' in cfg;
}

export interface RangeBasedAxis extends SharedConfiguration {
	/**
	 * Distribute markings along a range, with equal steps between each marking.
	 */
	range: {
		/**
		 * The end of the range (inclusive). Defaults to the closest stepSize multiple that is greater than or equal to
		 * the largest datum value.
		 *
		 * Must be greater than or equal to zero. Must be a multiple of stepSize, else is rounded up to the nearest
		 * stepSize multiple.
		 */
		end?: number;

		/**
		 * Whether the axis should be fixed to the end of the chart (in the direction of the axis).
		 *
		 * Defaults to `false`, in which case the axis is scaled proportionally to the size of the chart in order to
		 * show the range.
		 */
		fixed?: boolean;

		/**
		 * Selects the label to be shown next to the marking.
		 *
		 * If not provided the step will be shown as the label.
		 */
		labelSelector?: (step: number) => string;

		/**
		 * The starting point of the range. Defaults to zero.
		 *
		 * Must be less than or equal to zero. Must be a multiple of stepSize, else is rounded down to the nearest
		 * stepSize multiple.
		 */
		start?: number;

		/**
		 * The size of each step.
		 */
		stepSize: number;
	};
}

export function isRangeBased(cfg: AxisConfiguration<any>): cfg is RangeBasedAxis {
	return 'range' in cfg;
}

export interface CreatedAxes {
	bottom?: VNode[];
	extraHeight: number;
	extraWidth: number;
	left?: VNode[];
	right?: VNode[];
	top?: VNode[];
}

export type Side = 'bottom' | 'left' | 'right' | 'top';

export interface AxesMixin<D extends Datum<any>> {
	/**
	 * An axis that will be displayed below the plotted chart.
	 */
	readonly bottomAxis?: AxisConfiguration<D>;

	/**
	 * An axis that will be displayed left of plotted chart.
	 */
	readonly leftAxis?: AxisConfiguration<D>;

	/**
	 * An axis that will be displayed right of the plotted chart.
	 */
	readonly rightAxis?: AxisConfiguration<D>;

	/**
	 * An axis that will be displayed above the plotted chart.
	 */
	readonly topAxis?: AxisConfiguration<D>;

	createAxes(plot: Plot<Point<D>>, domain: Domain): CreatedAxes;

	createAxis(cfg: AxisConfiguration<D>, side: Side, plot: Plot<Point<D>>, domain: Domain): [ VNode[], number ];

	createAxisLabel(
		cfg: LabelConfiguration,
		text: string,
		side: Side,
		index: number,
		p1: number,
		p2: number,
		isNegative: boolean,
		ticks?: TickConfiguration
	): VNode;

	createAxisGridLine(
		length: number,
		side: Side,
		index: number,
		x: number,
		y: number
	): VNode;

	createAxisTick(
		cfg: TickConfiguration,
		side: Side,
		index: number,
		p1: number,
		p2?: number,
		isNegative?: boolean
	): VNode;

	createHardcodedAxis(
		cfg: HardcodedAxis,
		gridLineLength: number,
		side: Side,
		plot: Plot<Point<D>>,
		labels?: LabelConfiguration,
		ticks?: TickConfiguration
	): VNode[];

	createInputBasedAxis(
		cfg: InputBasedAxis<D>,
		gridLineLength: number,
		side: Side,
		plot: Plot<Point<D>>,
		labels?: LabelConfiguration,
		ticks?: TickConfiguration
	): VNode[];

	createRangeBasedAxis(
		cfg: RangeBasedAxis,
		gridLineLength: number,
		side: Side,
		plot: Plot<Point<D>>,
		domain: Domain,
		labels?: LabelConfiguration,
		ticks?: TickConfiguration
	): [ VNode[], number ];
}

export type Axes<D extends Datum<any>> = Invalidatable & AxesMixin<D>;

export interface AxesFactory<D extends Datum<any>> extends ComposeFactory<Axes<D>, any> {
	<D extends Datum<any>>(): Axes<D>;
}

const createAxes: AxesFactory<any> = compose({
	createAxes<D extends Datum<any>>(this: Axes<D>, plot: Plot<Point<D>>, domain: Domain): CreatedAxes {
		const result: CreatedAxes = {
			extraHeight: 0,
			extraWidth: 0
		};

		if (this.bottomAxis) {
			const [ nodes, extra ] = this.createAxis(this.bottomAxis, 'bottom', plot, domain);
			result.bottom = nodes;
			result.extraWidth = Math.max(result.extraWidth, extra);
		}
		if (this.leftAxis) {
			const [ nodes, extra ] = this.createAxis(this.leftAxis, 'left', plot, domain);
			result.left = nodes;
			result.extraHeight = Math.max(result.extraHeight, extra);
		}
		if (this.rightAxis) {
			const [ nodes, extra ] = this.createAxis(this.rightAxis, 'right', plot, domain);
			result.right = nodes;
			result.extraHeight = Math.max(result.extraHeight, extra);
		}
		if (this.topAxis) {
			const [ nodes, extra ] = this.createAxis(this.topAxis, 'top', plot, domain);
			result.top = nodes;
			result.extraWidth = Math.max(result.extraWidth, extra);
		}
		return result;
	},

	createAxis<D extends Datum<any>>(
		this: Axes<D>,
		cfg: AxisConfiguration<D>,
		side: Side,
		plot: Plot<Point<D>>,
		domain: Domain
	): [ VNode[], number ] {
		const { gridLines, ticks } = cfg;
		const { height, width, zero } = plot;

		let labels: LabelConfiguration | undefined;
		if (cfg.labels !== false) {
			labels = cfg.labels || {};
		}

		const isHorizontal = side === 'bottom' || side === 'top';
		const nodes: VNode[] = [];
		let extraSpace = 0;

		let gridLineLength = 0;
		if (gridLines) {
			if (typeof gridLines === 'object' && gridLines.length !== undefined) {
				gridLineLength = gridLines.length;
			}
			else if (isHorizontal) {
				gridLineLength = height;
			}
			else {
				gridLineLength = width;
			}
		}

		if (ticks && ticks.zeroth) {
			if (isHorizontal) {
				nodes.push(this.createAxisTick(ticks, side, 0, 0));
			}
			else {
				nodes.push(this.createAxisTick(ticks, side, 0, zero.y));
			}
		}

		if (typeof gridLines === 'object' && gridLines.zeroth) {
			if (isHorizontal) {
				nodes.push(this.createAxisGridLine(gridLineLength, side, 0, 0, 0));
			}
			else {
				nodes.push(this.createAxisGridLine(gridLineLength, side, 0, 0, zero.y));
			}
		}

		if (isHardcoded(cfg)) {
			nodes.push(...this.createHardcodedAxis(cfg, gridLineLength, side, plot, labels, ticks));
		}
		else if (isInputBased(cfg)) {
			nodes.push(...this.createInputBasedAxis(cfg, gridLineLength, side, plot, labels, ticks));
		}
		else if (isRangeBased(cfg)) {
			let stepNodes: VNode[];
			[ stepNodes, extraSpace ] = this.createRangeBasedAxis(
				cfg, gridLineLength, side, plot, domain, labels, ticks
			);
			nodes.push(...stepNodes);
		}

		const chartSize = isHorizontal ? height : width;
		if (gridLineLength > chartSize) {
			extraSpace = Math.max(extraSpace, gridLineLength - chartSize);
		}

		return [ nodes, extraSpace ];
	},

	createAxisGridLine(length: number, side: Side, index: number, x1: number, y1: number) {
		let x2 = x1;
		let y2 = y1;
		if (side === 'bottom') {
			y2 -= length;
		}
		else if (side === 'left') {
			x2 = length;
		}
		else if (side === 'right') {
			x2 -= length;
		}
		else if (side === 'top') {
			y2 += length;
		}

		return h('line', {
			key: `${side}-axis-line-${index}`,
			stroke: 'black',
			x1: String(x1),
			x2: String(x2),
			y1: String(y1),
			y2: String(y2)
		});
	},

	createAxisLabel(
		{
			anchor = 'middle',
			dominantBaseline,
			offset = 0,
			rotation = 0,
			textAnchor
		}: LabelConfiguration,
		text: string,
		side: Side,
		index: number,
		p1: number,
		p2: number,
		isNegative: boolean,
		ticks: TickConfiguration = { length: 0 }
	) {
		let x = 0;
		let y = 0;
		if (side === 'bottom' || side === 'top') {
			textAnchor = textAnchor || 'middle';
			if (anchor === 'start') {
				x = p1;
			}
			else if (anchor === 'middle') {
				x = p1 + (p2 - p1) / 2;
			}
			else if (anchor === 'end') {
				x = p2;
			}
			x += offset;
		}
		else if (side === 'left' || side === 'right') {
			dominantBaseline = dominantBaseline || 'middle';
			if (anchor === 'start') {
				y = isNegative ? p1 : p2;
			}
			else if (anchor === 'middle') {
				y = p2 - (p2 - p1) / 2;
			}
			else if (anchor === 'end') {
				y = isNegative ? p2 : p1;
			}
			y += offset;
		}

		if (side === 'bottom') {
			dominantBaseline = dominantBaseline || 'text-before-edge';
			y += ticks.length;
		}
		else if (side === 'left') {
			textAnchor = textAnchor || 'end';
			x -= ticks.length;
		}
		else if (side === 'right') {
			textAnchor = textAnchor || 'start';
			x += ticks.length;
		}
		else if (side === 'top') {
			dominantBaseline = dominantBaseline || 'text-after-edge';
			y -= ticks.length;
		}

		return h('text', {
			key: `${side}-axis-label-${index}`,
			transform: `translate(0 0) rotate(${rotation} ${x} ${y})`,
			'text-anchor': textAnchor,
			'dominant-baseline': dominantBaseline,
			x: String(x),
			y: String(y)
		}, text);
	},

	createAxisTick(
		{
			anchor = 'middle',
			length,
			offset = 0
		}: TickConfiguration,
		side: Side,
		index: number,
		p1: number,
		p2: number = p1,
		isNegative: boolean = false
	) {
		let x1 = 0;
		let y1 = 0;
		if (side === 'bottom' || side === 'top') {
			if (anchor === 'start') {
				x1 = p1;
			}
			else if (anchor === 'middle') {
				x1 = p1 + (p2 - p1) / 2;
			}
			else if (anchor === 'end') {
				x1 = p2;
			}
			x1 += offset;
		}
		else if (side === 'left' || side === 'right') {
			if (anchor === 'start') {
				y1 = isNegative ? p1 : p2;
			}
			else if (anchor === 'middle') {
				y1 = p2 - (p2 - p1) / 2;
			}
			else {
				y1 = isNegative ? p2 : p1;
			}
			y1 += offset;
		}

		let x2 = x1;
		let y2 = y1;
		if (side === 'bottom') {
			y2 += length;
		}
		else if (side === 'left') {
			x2 -= length;
		}
		else if (side === 'right') {
			x2 += length;
		}
		else if (side === 'top') {
			y2 -= length;
		}

		return h('line', {
			key: `${side}-axis-tick-${index}`,
			stroke: 'black',
			x1: String(x1),
			x2: String(x2),
			y1: String(y1),
			y2: String(y2)
		});
	},

	createHardcodedAxis(
		this: Axes<any>,
		{ hardcoded }: HardcodedAxis,
		gridLineLength: number,
		side: Side,
		{ height, width }: Plot<any>,
		labels?: LabelConfiguration,
		ticks?: TickConfiguration
	) {
		const isHorizontal = side === 'bottom' || side === 'top';
		const nodes: VNode[] = [];

		let index = 1;
		let prev = isHorizontal ? 0 : height;
		for (const marking of hardcoded) {
			let relative: number;
			let text = '';
			if (Array.isArray(marking)) {
				[ relative, text ] = marking;
			}
			else {
				relative = marking;
			}

			if (relative < 0 || relative > 1) {
				continue;
			}

			const x = isHorizontal ? relative * width : 0;
			const y = isHorizontal ? 0 : height - relative * height;
			// FIXME: Don't repeat zeroth tick (issue #7)
			if (ticks) {
				const p = isHorizontal ? x : y;
				nodes.push(this.createAxisTick(ticks, side, index, p));
			}
			// FIXME: Don't repeat zeroth grid line (issue #7)
			if (gridLineLength) {
				nodes.push(this.createAxisGridLine(gridLineLength, side, index, x, y));
			}

			if (labels && text !== '') {
				const p1 = isHorizontal ? x : y;
				const p2 = prev;
				nodes.push(this.createAxisLabel(labels, text, side, index, p1, p2, false, ticks));
			}

			index++;
			prev = isHorizontal ? x : y;
		}

		return nodes;
	},

	createInputBasedAxis<D extends Datum<any>>(
		this: Axes<D>,
		{ inputs }: InputBasedAxis<D>,
		gridLineLength: number,
		side: Side,
		{ points, zero }: Plot<Point<D>>,
		labels?: LabelConfiguration,
		ticks?: TickConfiguration
	) {
		const labelSelector = typeof inputs === 'boolean' ? null : inputs.labelSelector;

		const isHorizontal = side === 'bottom' || side === 'top';
		const nodes: VNode[] = [];

		let index = 0;
		for (const { datum, x1, x2, y1, y2 } of points) {
			index++;

			const p1 = isHorizontal ? x1 : y1;
			const p2 = isHorizontal ? x2 : y2;
			const isNegative = isHorizontal ? false : y2 > zero.y;

			if (ticks || gridLineLength) {
				// FIXME: Don't repeat zeroth tick (issue #7)
				if (ticks) {
					nodes.push(this.createAxisTick(ticks, side, index, p1, p2, isNegative));
				}
				// FIXME: Don't repeat zeroth grid line (issue #7)
				if (gridLineLength) {
					const x = isHorizontal ? x2 : 0;
					const y = isHorizontal ? 0 : y1;
					nodes.push(this.createAxisGridLine(gridLineLength, side, index, x, y));
				}
			}

			if (labels && labelSelector) {
				const text = labelSelector(datum);
				if (text !== '') {
					nodes.push(this.createAxisLabel(labels, text, side, index, p1, p2, isNegative, ticks));
				}
			}
		}

		return nodes;
	},

	createRangeBasedAxis<D extends Datum<any>>(
		this: Axes<D>,
		{ range }: RangeBasedAxis,
		gridLineLength: number,
		side: Side,
		{
			height,
			horizontalValues,
			points,
			verticalValues,
			width,
			zero
		}: Plot<Point<D>>,
		[ domainMin, domainMax ]: Domain,
		labels?: LabelConfiguration,
		ticks?: TickConfiguration
	): [ VNode[], number ] {
		const {
			fixed = false,
			labelSelector
		} = range;

		const isHorizontal = side === 'bottom' || side === 'top';
		const nodes: VNode[] = [];

		let mostNegativeValue = domainMin;
		let mostPositiveValue = domainMax;
		// [ 0, 0 ] domains should be ignored.
		if (domainMin === 0 && domainMax === 0) {
			for (const { datum: { value } } of points) {
				if (value < mostNegativeValue) {
					mostNegativeValue = value;
				}
				else if (value > mostPositiveValue) {
					mostPositiveValue = value;
				}
			}
		}

		const { stepSize } = range;
		let { end = mostPositiveValue, start = mostNegativeValue } = range;
		// Ensure start and end are multiples of the stepSize.
		if (end % stepSize > 0) {
			end = Math.ceil(mostPositiveValue / stepSize) * stepSize;
		}
		if (start % stepSize > 0) {
			start = Math.floor(mostNegativeValue / stepSize) * stepSize;
		}
		const delta = end - start;

		// Assume the size is inflated by 1 pixel for the line between negative and positive values.
		let inflation = 0;
		if ((isHorizontal ? horizontalValues : verticalValues) & Values.Negative) {
			inflation = 1;
		}
		const chartSize = (isHorizontal ? width : height) - inflation;
		let size = chartSize;
		let extraSpace = 0;
		if (!fixed && (end !== mostPositiveValue || start !== mostNegativeValue)) {
			const deltaValue = mostPositiveValue - mostNegativeValue;
			// Adjust size so the steps are scaled correctly.
			size = chartSize / deltaValue * delta;
			if (size > chartSize) {
				// Percolate the extra size to the chart.
				extraSpace = size - chartSize;
			}
		}

		let index = 1;
		let prev = isHorizontal ? 0 : height;
		for (let step = start; step <= end; step += stepSize) {
			const isNegative = step < 0;
			const x = isHorizontal ? zero.x + step / delta * size : 0;
			const y = isHorizontal ? 0 : zero.y - step / delta * size;
			const p = isHorizontal ? x : y;

			// FIXME: Don't repeat zeroth tick (issue #7)
			if (ticks) {
				nodes.push(this.createAxisTick(ticks, side, index, p));
			}
			// FIXME: Don't repeat zeroth grid line (issue #7)
			if (gridLineLength) {
				nodes.push(this.createAxisGridLine(gridLineLength, side, index, x, y));
			}

			const text = labelSelector ? labelSelector(step) : String(step);
			if (labels && text !== '') {
				const p1 = isNegative ? prev : p;
				const p2 = isNegative ? p : prev;
				nodes.push(this.createAxisLabel(labels, text, side, index, p1, p2, isNegative, ticks));
			}

			index++;
			prev = p;
		}

		return [ nodes, extraSpace ];
	}
});

export default createAxes;
