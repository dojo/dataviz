import compose, { ComposeFactory } from 'dojo-compose/compose';
import { Handle } from 'dojo-core/interfaces';
import WeakMap from 'dojo-shim/WeakMap';
import { h, VNode } from 'maquette/maquette';
import { Observable } from 'rxjs/Rx';

import { DivisorOperator, InputObservable, ValueSelector } from '../../data/interfaces';
import columnar, { Column } from '../../data/columnar';

import { Domain, DomainOption, Invalidatable, Plot, Point, Values } from '../interfaces';
import createInputSeries, {
	InputSeries,
	InputSeriesOptions,
	InputSeriesState
} from './createInputSeriesMixin';

export { Column };

function normalizeDomain(domain: DomainOption): Domain {
	return Array.isArray(domain) ? domain : [domain < 0 ? domain : 0, domain > 0 ? domain : 0];
}

export interface ColumnPoint<T> extends Point<Column<T>> {
	displayHeight: number;
	displayWidth: number;
	offsetLeft: number;
}

export interface ColumnPointPlot<T> extends Plot<ColumnPoint<T>> {}

export interface ColumnPlotState<T> extends InputSeriesState<T> {
	/**
	 * Controls the maximum height of each column.
	 */
	columnHeight?: number;

	/**
	 * Controls the space between each column.
	 */
	columnSpacing?: number;

	/**
	 * Controls the width of each column.
	 */
	columnWidth?: number;

	/**
	 * Controls the range for which values are plotted with the full columnHeight. The height is distributed across the
	 * negative and positive values commensurate with the range. Any input values that exceed the minimum or maximum
	 * will still be plotted proportionally (but exceeding the height limits).
	 *
	 * If a single number is provided, if that number is greater than zero it implies a domain of [0, number]. If it's
	 * less than zero it implies a domain of [number, 0]. If zero it implies there are no minimum or maximum values,
	 * same for a domain of [0, 0].
	 */
	domain?: DomainOption;
}

export interface ColumnPlotOptions<T, S extends ColumnPlotState<T>> extends InputSeriesOptions<T, S> {
	/**
	 * Controls the maximum height of each column.
	 */
	columnHeight?: number;

	/**
	 * Controls the space between each column.
	 */
	columnSpacing?: number;

	/**
	 * Controls the width of each column.
	 */
	columnWidth?: number;

	/**
	 * Operates on the input series observable to compute the divisor, which is used to determine the height of the
	 * columns.
	 *
	 * If not provided, and a `divisorOperator()` implementation has been mixed in, that implementation is used.
	 * Otherwise the divisor will be set to `1`.
	 */
	divisorOperator?: DivisorOperator<T>;

	/**
	 * Controls the range for which values are plotted with the full columnHeight. The height is distributed across the
	 * negative and positive values commensurate with the range. Any input values that exceed the minimum or maximum
	 * will still be plotted proportionally (but exceeding the height limits).
	 *
	 * If a single number is provided, if that number is greater than zero it implies a domain of [0, number]. If it's
	 * less than zero it implies a domain of [number, 0]. If zero it implies there are no minimum or maximum values,
	 * same for a domain of [0, 0].
	 */
	domain?: DomainOption;

	/**
	 * Select the value from the input. Columns height is determined by this value.
	 *
	 * If not provided, and a `valueSelector()` implementation has been mixed in, that implementation is used. Otherwise
	 * values will be hardcoded to `0`.
	 */
	valueSelector?: ValueSelector<T>;
}

export interface ColumnPlotMixin<T> {
	/**
	 * Controls the maximum height of each column.
	 */
	columnHeight: number;

	/**
	 * Controls the space between each column.
	 */
	columnSpacing: number;

	/**
	 * Controls the width of each column.
	 */
	columnWidth: number;

	/**
	 * Operates on the input series observable to compute the divisor, which is used to determine the height of the
	 * columns.
	 *
	 * Can be overriden by specifying a `divisorOperator()` option. If neither is available a static divisor of `1`
	 * will be used.
	 */
	divisorOperator?: DivisorOperator<T>;

	/**
	 * Controls the range for which values are plotted with the full columnHeight. The height is distributed across the
	 * negative and positive values commensurate with the range. Any input values that exceed the minimum or maximum
	 * will still be plotted proportionally (but exceeding the height limits).
	 */
	domain: Domain;

	/**
	 * Select the value from the input. Columns height is determined by this value.
	 *
	 * Can be overriden by specifying a `valueSelector()` option. If neither is available all values will be hardcoded
	 * to `0`.
	 */
	valueSelector?: ValueSelector<T>;

	/**
	 * Plot "points" for each column.
	 */
	plot(): ColumnPointPlot<T>;

	/**
	 * Create VNodes for each column given its points.
	 */
	renderPlotPoints(points: ColumnPoint<T>[], plotHeight: number, extraHeight: number): VNode[][];
}

/**
 * Renders columns. To be mixed into dojo-widgets/createWidget.
 */
export type ColumnPlot<T, S extends ColumnPlotState<T>> =
	InputSeries<T, S> & Invalidatable & ColumnPlotMixin<T>;

export interface ColumnPlotFactory<T> extends ComposeFactory<
	ColumnPlot<T, ColumnPlotState<T>>,
	ColumnPlotOptions<T, ColumnPlotState<T>>
> {
	<T, S extends ColumnPlotState<T>>(options?: ColumnPlotOptions<T, S>): ColumnPlot<T, S>;
}

const columnSeries = new WeakMap<ColumnPlot<any, ColumnPlotState<any>>, Column<any>[]>();
const shadowColumnHeights = new WeakMap<ColumnPlot<any, ColumnPlotState<any>>, number>();
const shadowColumnSpacings = new WeakMap<ColumnPlot<any, ColumnPlotState<any>>, number>();
const shadowColumnWidths = new WeakMap<ColumnPlot<any, ColumnPlotState<any>>, number>();
const shadowDomains = new WeakMap<ColumnPlot<any, ColumnPlotState<any>>, Domain>();

const createColumnPlot: ColumnPlotFactory<any> = compose({
	get columnHeight(this: ColumnPlot<any, ColumnPlotState<any>>) {
		const { columnHeight = shadowColumnHeights.get(this) } = this.state || {};
		return columnHeight;
	},

	set columnHeight(columnHeight) {
		if (this.state) {
			this.setState({ columnHeight });
		}
		else {
			shadowColumnHeights.set(this, columnHeight);
		}
		this.invalidate();
	},

	get columnSpacing(this: ColumnPlot<any, ColumnPlotState<any>>) {
		const { columnSpacing = shadowColumnSpacings.get(this) } = this.state || {};
		return columnSpacing;
	},

	set columnSpacing(columnSpacing) {
		if (this.state) {
			this.setState({ columnSpacing });
		}
		else {
			shadowColumnSpacings.set(this, columnSpacing);
		}
		this.invalidate();
	},

	get columnWidth(this: ColumnPlot<any, ColumnPlotState<any>>) {
		const { columnWidth = shadowColumnWidths.get(this) } = this.state || {};
		return columnWidth;
	},

	set columnWidth(columnWidth) {
		if (this.state) {
			this.setState({ columnWidth });
		}
		else {
			shadowColumnWidths.set(this, columnWidth);
		}
		this.invalidate();
	},

	get domain(this: ColumnPlot<any, ColumnPlotState<any>>) {
		const { domain = shadowDomains.get(this) } = this.state || {};
		return normalizeDomain(domain);
	},

	set domain(domain) {
		if (this.state) {
			this.setState({ domain });
		}
		else {
			shadowDomains.set(this, domain);
		}
		this.invalidate();
	},

	plot<T>(this: ColumnPlot<T, ColumnPlotState<T>>): ColumnPointPlot<T> {
		const series = columnSeries.get(this);
		const { columnHeight, columnSpacing, columnWidth: displayWidth, domain: [domainMin, domainMax] } = this;

		let mostNegativeRelValue = 0;
		let mostNegativeValue = 0;
		let mostPositiveRelValue = 0;
		let mostPositiveValue = 0;
		for (const { relativeValue, value } of series) {
			if (relativeValue < mostNegativeRelValue) {
				mostNegativeRelValue = relativeValue;
			}
			else if (relativeValue > mostPositiveRelValue) {
				mostPositiveRelValue = relativeValue;
			}

			if (value < mostNegativeValue) {
				mostNegativeValue = value;
			}
			else if (value > mostPositiveValue) {
				mostPositiveValue = value;
			}
		}

		// Maximum height of positive columns. Initially assume there are no negative columns, this will be refined
		// later. The height of negative columns is determined by taking columnHeight and subtracting positiveHeight.
		let positiveHeight = columnHeight;

		// The height of each column ("display height") is determined by the column's relative value and the available
		// positive or negative height. The relative value needs to be corrected for the available height if there are
		// both negative and positive columns.
		let negativeDisplayHeightCorrection = 1;
		let positiveDisplayHeightCorrection = 1;
		if (mostNegativeRelValue < 0 && mostPositiveRelValue > 0) {
			negativeDisplayHeightCorrection /= -mostNegativeRelValue;
			positiveDisplayHeightCorrection /= mostPositiveRelValue;
		}

		// Relative column values need to be further adjusted if a domain minimum and/or maximum is specified. Only
		// negative columns who's value equals the domain minimum, or positive columns who's value equals the domain
		// maximum, must be rendered with the full available height.
		//
		// This is also where enough information is available to compute the correct positiveHeight.
		if (domainMin !== 0 || domainMax !== 0) {
			if (domainMin < 0) {
				if (domainMax === 0) {
					// There shouldn't be any positive columns.
					negativeDisplayHeightCorrection *= mostNegativeValue / domainMin;
					positiveHeight = 0;
				}
				else if (domainMax > 0) {
					// There may be both positive and negative columns.
					negativeDisplayHeightCorrection *= mostNegativeValue / domainMin;
					positiveDisplayHeightCorrection *= mostPositiveValue / domainMax;
					positiveHeight *= domainMax / (domainMax - domainMin);
				}
			}
			else if (domainMin === 0 && domainMax > 0) {
				// There should only be positive columns.
				positiveDisplayHeightCorrection *= mostPositiveValue / domainMax;
			}
			// FIXME: Should this raise an error if domainMin > 0 or domainMax < 0? These are not valid domains for column
			// charts.
		}
		// Without a domain, adjust the positiveHeight only if there are negative columns.
		else if (mostNegativeRelValue < 0) {
			if (mostPositiveRelValue === 0) {
				// There are definitely no positive columns.
				positiveHeight = 0;
			}
			else {
				// There are both positive and negative columns.
				positiveHeight *= mostPositiveRelValue / (mostPositiveRelValue - mostNegativeRelValue);
			}
		}

		// There should be space for a line dividing negative and positive columns, so start 1px lower.
		const negativeOffset = positiveHeight + 1;

		let verticalValues = Values.None;
		let x2 = 0;

		const points = series.map((column, index) => {
			const isNegative = column.relativeValue < 0;
			verticalValues |= isNegative ? Values.Negative : Values.Positive;

			const availableHeight = isNegative ? positiveHeight - columnHeight : positiveHeight;
			const correction = isNegative ? negativeDisplayHeightCorrection : positiveDisplayHeightCorrection;
			const displayHeight = availableHeight * column.relativeValue * correction;

			const x1 = (displayWidth + columnSpacing) * index;
			x2 = x1 + displayWidth + columnSpacing;

			return {
				datum: column,
				displayHeight,
				displayWidth,
				offsetLeft: columnSpacing / 2,
				x1,
				x2,
				y1: isNegative ? negativeOffset : positiveHeight - displayHeight,
				y2: isNegative ? negativeOffset + displayHeight + 1 : positiveHeight
			};
		});

		let height = columnHeight;
		if (verticalValues & Values.Negative) {
			// Chart height includes the line between negative and positive columns.
			height += 1;
		}

		return {
			height,
			horizontalValues: Values.Positive,
			points,
			verticalValues,
			width: x2,
			zero: { x: 0, y: positiveHeight }
		};
	},

	renderPlotPoints<T>(points: ColumnPoint<T>[], plotHeight: number, extraHeight: number) {
		const outerNodes: VNode[] = [];
		const innerNodes: VNode[] = [];
		const columnNodes: VNode[] = [];

		const fullHeight = String(plotHeight + extraHeight);
		const fullY = String(-extraHeight);
		for (const { datum: { input: key }, displayHeight, displayWidth, offsetLeft, x1, x2, y1 } of points) {
			const innerWidth = String(displayWidth);
			const innerX = String(x1 + offsetLeft);

			outerNodes.push(h('rect', {
				key,
				'fill-opacity': '0',
				height: fullHeight,
				width: String(x2 - x1),
				x: String(x1),
				y: fullY
			}));

			innerNodes.push(h('rect', {
				key,
				'fill-opacity': '0',
				height: fullHeight,
				width: innerWidth,
				x: innerX,
				y: fullY
			}));

			columnNodes.push(h('rect', {
				key,
				height: String(displayHeight),
				width: innerWidth,
				x: innerX,
				y: String(y1)
			}));
		}

		return [outerNodes, innerNodes, columnNodes];
	}
}).mixin({
	mixin: createInputSeries,

	initialize<T>(
		instance: ColumnPlot<T, ColumnPlotState<T>>,
		{
			columnHeight = 0,
			columnSpacing = 0,
			columnWidth = 0,
			domain = [0, 0] as Domain,
			divisorOperator,
			valueSelector
		}: ColumnPlotOptions<T, ColumnPlotState<T>> = {}
	) {
		shadowColumnHeights.set(instance, columnHeight);
		shadowColumnSpacings.set(instance, columnSpacing);
		shadowColumnWidths.set(instance, columnWidth);
		shadowDomains.set(instance, normalizeDomain(domain));

		if (!divisorOperator) {
			// Allow a divisorOperator implementation to be mixed in.
			divisorOperator = (observable: InputObservable<T>, valueSelector: ValueSelector<T>) => {
				if (instance.divisorOperator) {
					return instance.divisorOperator(observable, valueSelector);
				}

				// Default to 1, don't throw at runtime.
				return Observable.of(1);
			};
		}

		if (!valueSelector) {
			// Allow a valueSelector implementation to be mixed in.
			valueSelector = (input: T) => {
				if (instance.valueSelector) {
					return instance.valueSelector(input);
				}

				// Default to 0, don't throw at runtime.
				return 0;
			};
		}

		// Initialize with an empty series since InputSeries only provides a series once it's available.
		columnSeries.set(instance, []);

		let handle: Handle = null;
		const subscribe = (inputSeries: Observable<T[]>) => {
			if (handle) {
				handle.destroy();
			}

			const subscription = columnar(inputSeries, valueSelector, divisorOperator)
				.subscribe((series) => {
					columnSeries.set(instance, series);
					instance.invalidate();
				});

			handle = instance.own({
				destroy() {
					subscription.unsubscribe();
				}
			});
		};

		// InputSeries may emit 'inputserieschange' before this initializer can listen for it.
		// Access the series directly.
		if (instance.inputSeries) {
			subscribe(instance.inputSeries);
		}
		// Update the series if it changes.
		instance.own(instance.on('inputserieschange', ({ observable }) => subscribe(observable)));
	}
});

export default createColumnPlot;
