import compose, { ComposeFactory } from 'dojo-compose/compose';
import { Handle } from 'dojo-core/interfaces';
import { h, VNode } from 'maquette/maquette';
import { Observable } from 'rxjs/Rx';

import { DivisorOperator, InputObservable, ValueSelector } from '../../data/interfaces';
import columnar, { Column } from '../../data/columnar';

import { Invalidatable } from '../interfaces';
import createInputSeries, {
	InputSeries,
	InputSeriesOptions,
	InputSeriesState
} from './createInputSeriesMixin';

export interface ColumnVisualization<T> {
	column: Column<T>;
	height: string;
	width: string;
	x: string;
	y: string;
}

export interface ColumnStructureState<T> extends InputSeriesState<T> {
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

export interface ColumnStructureOptions<T, S extends ColumnStructureState<T>> extends InputSeriesOptions<T, S> {
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

export interface ColumnStructureMixin<T> {
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
	 * Create VNodes for each column given its visualization.
	 */
	createVisualizationNodes(visualizations: ColumnVisualization<T>[]): VNode[];

	/**
	 * Determine the size and position of each column.
	 */
	visualizeData(): ColumnVisualization<T>[];
}

/**
 * Renders columns. To be mixed into dojo-widgets/createWidget.
 */
export type ColumnStructure<T, S extends ColumnStructureState<T>> =
	InputSeries<T, S> & Invalidatable & ColumnStructureMixin<T>;

export interface ColumnStructureFactory<T> extends ComposeFactory<
	ColumnStructure<T, ColumnStructureState<T>>,
	ColumnStructureOptions<T, ColumnStructureState<T>>
> {
	<T, S extends ColumnStructureState<T>>(options?: ColumnStructureOptions<T, S>): ColumnStructure<T, S>;
}

const columnSeries = new WeakMap<ColumnStructure<any, ColumnStructureState<any>>, Column<any>[]>();
const shadowColumnHeights = new WeakMap<ColumnStructure<any, ColumnStructureState<any>>, number>();
const shadowColumnSpacings = new WeakMap<ColumnStructure<any, ColumnStructureState<any>>, number>();
const shadowColumnWidths = new WeakMap<ColumnStructure<any, ColumnStructureState<any>>, number>();

const createColumnStructureMixin: ColumnStructureFactory<any> = compose({
	get columnHeight() {
		const structure: ColumnStructure<any, ColumnStructureState<any>> = this;
		const { columnHeight = shadowColumnHeights.get(structure) } = structure.state || {};
		return columnHeight;
	},

	set columnHeight(columnHeight) {
		const structure: ColumnStructure<any, ColumnStructureState<any>> = this;
		if (structure.state) {
			structure.setState({ columnHeight });
		}
		else {
			shadowColumnHeights.set(structure, columnHeight);
		}
		structure.invalidate();
	},

	get columnSpacing() {
		const structure: ColumnStructure<any, ColumnStructureState<any>> = this;
		const { columnSpacing = shadowColumnSpacings.get(structure) } = structure.state || {};
		return columnSpacing;
	},

	set columnSpacing(columnSpacing) {
		const structure: ColumnStructure<any, ColumnStructureState<any>> = this;
		if (structure.state) {
			structure.setState({ columnSpacing });
		}
		else {
			shadowColumnSpacings.set(structure, columnSpacing);
		}
		structure.invalidate();
	},

	get columnWidth() {
		const structure: ColumnStructure<any, ColumnStructureState<any>> = this;
		const { columnWidth = shadowColumnWidths.get(structure) } = structure.state || {};
		return columnWidth;
	},

	set columnWidth(columnWidth) {
		const structure: ColumnStructure<any, ColumnStructureState<any>> = this;
		if (structure.state) {
			structure.setState({ columnWidth });
		}
		else {
			shadowColumnWidths.set(structure, columnWidth);
		}
		structure.invalidate();
	},

	createVisualizationNodes(visualizations: ColumnVisualization<any>[]) {
		return visualizations.map(({ column, height, width, x, y}) => {
			return h('rect', {
				key: column.input,
				height,
				width,
				x,
				y
			});
		});
	},

	visualizeData(): ColumnVisualization<any>[] {
		const structure: ColumnStructure<any, ColumnStructureState<any>> = this;
		const series = columnSeries.get(structure);
		const { columnHeight, columnSpacing, columnWidth } = structure;
		return series.map((column, index) => {
			const height = column.relativeValue * columnHeight;
			const x = (columnWidth + columnSpacing) * index;
			const y = columnHeight - height;
			return {
				column,
				height: String(height),
				width: String(columnWidth),
				x: String(x),
				y: String(y)
			};
		});
	}
}).mixin({
	mixin: createInputSeries,

	initialize<T>(
		instance: ColumnStructure<T, ColumnStructureState<T>>,
		{
			columnHeight = 0,
			columnSpacing = 0,
			columnWidth = 0,
			divisorOperator,
			valueSelector
		}: ColumnStructureOptions<T, ColumnStructureState<T>> = {}
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

export default createColumnStructureMixin;
