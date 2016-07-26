import compose, { ComposeFactory } from 'dojo-compose/compose';
import { Handle } from 'dojo-core/interfaces';
import { h, VNode } from 'maquette/maquette';
import { Observable } from 'rxjs/Rx';

import { DivisorOperator, InputObservable, ValueSelector } from '../../data/interfaces';
import columnar, { Column } from '../../data/columnar';

import { Invalidatable, Point } from '../interfaces';
import createInputSeries, {
	InputSeries,
	InputSeriesOptions,
	InputSeriesState
} from './createInputSeriesMixin';

export interface ColumnPoint<T> extends Point<T> {
	datum: Column<T>;
	displayHeight: number;
	displayWidth: number;
}

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
	 * May be omitted if a `divisorOperator()` implementation has been mixed in.
	 */
	divisorOperator?: DivisorOperator<T>;

	/**
	 * Select the value from the input. Columns height is determined by this value.
	 *
	 * May be omitted if a `valueSelector()` implementation has been mixed in.
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
	columnSpacing?: number;

	/**
	 * Controls the width of each column.
	 */
	columnWidth: number;

	/**
	 * Operates on the input series observable to compute the divisor, which is used to determine the height of the
	 * columns.
	 *
	 * May be omitted if a `divisorOperator()` option has been provided.
	 */
	divisorOperator?: DivisorOperator<T>;

	/**
	 * Select the value from the input. Columns height is determined by this value.
	 *
	 * May be omitted if a `valueSelector()` option has been provided.
	 */
	valueSelector?: ValueSelector<T>;

	/**
	 * Plot "points" for each column.
	 */
	plot(): ColumnPoint<T>[];

	/**
	 * Create VNodes for each column given its points.
	 */
	renderPlot(points: ColumnPoint<T>[]): VNode[];
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

const createColumnPlot: ColumnPlotFactory<any> = compose({
	get columnHeight() {
		const plot: ColumnPlot<any, ColumnPlotState<any>> = this;
		const { columnHeight = shadowColumnHeights.get(plot) } = plot.state || {};
		return columnHeight;
	},

	set columnHeight(columnHeight) {
		const plot: ColumnPlot<any, ColumnPlotState<any>> = this;
		if (plot.state) {
			plot.setState({ columnHeight });
		}
		else {
			shadowColumnHeights.set(plot, columnHeight);
		}
		plot.invalidate();
	},

	get columnSpacing() {
		const plot: ColumnPlot<any, ColumnPlotState<any>> = this;
		const { columnSpacing = shadowColumnSpacings.get(plot) } = plot.state || {};
		return columnSpacing;
	},

	set columnSpacing(columnSpacing) {
		const plot: ColumnPlot<any, ColumnPlotState<any>> = this;
		if (plot.state) {
			plot.setState({ columnSpacing });
		}
		else {
			shadowColumnSpacings.set(plot, columnSpacing);
		}
		plot.invalidate();
	},

	get columnWidth() {
		const plot: ColumnPlot<any, ColumnPlotState<any>> = this;
		const { columnWidth = shadowColumnWidths.get(plot) } = plot.state || {};
		return columnWidth;
	},

	set columnWidth(columnWidth) {
		const plot: ColumnPlot<any, ColumnPlotState<any>> = this;
		if (plot.state) {
			plot.setState({ columnWidth });
		}
		else {
			shadowColumnWidths.set(plot, columnWidth);
		}
		plot.invalidate();
	},

	plot<T>(): ColumnPoint<T>[] {
		const plot: ColumnPlot<T, ColumnPlotState<T>> = this;
		const series = columnSeries.get(plot);
		const { columnHeight, columnSpacing, columnWidth: displayWidth } = plot;
		return series.map((column, index) => {
			const displayHeight = column.relativeValue * columnHeight;
			const x1 = (displayWidth + columnSpacing) * index;
			const x2 = x1 + displayWidth + columnSpacing;
			const y1 = columnHeight - displayHeight;
			return {
				datum: column,
				displayHeight,
				displayWidth,
				x1,
				x2,
				y1,
				y2: columnHeight
			};
		});
	},

	renderPlot<T>(points: ColumnPoint<T>[]) {
		return points.map(({ datum, displayHeight, displayWidth, x1, y1 }) => {
			return h('rect', {
				key: datum.input,
				height: String(displayHeight),
				width: String(displayWidth),
				x: String(x1),
				y: String(y1)
			});
		});
	}
}).mixin({
	mixin: createInputSeries,

	initialize<T>(
		instance: ColumnPlot<T, ColumnPlotState<T>>,
		{
			columnHeight = 0,
			columnSpacing = 0,
			columnWidth = 0,
			divisorOperator,
			valueSelector
		}: ColumnPlotOptions<T, ColumnPlotState<T>> = {}
	) {
		shadowColumnHeights.set(instance, columnHeight);
		shadowColumnSpacings.set(instance, columnSpacing);
		shadowColumnWidths.set(instance, columnWidth);

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

		instance.own({
			destroy() {
				columnSeries.delete(instance);
				shadowColumnHeights.delete(instance);
				shadowColumnWidths.delete(instance);
			}
		});
	}
});

export default createColumnPlot;
