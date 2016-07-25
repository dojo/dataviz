import compose, { ComposeFactory } from 'dojo-compose/compose';
import { Handle } from 'dojo-core/interfaces';
import Symbol from 'dojo-shim/Symbol';
import { h, VNode } from 'maquette/maquette';
import { Observable } from 'rxjs/Rx';

import { DivisorOperator, InputObservable, ValueSelector } from '../../data/interfaces';
import columnar, { Column } from '../../data/columnar';

import { Chartable, Invalidatable } from '../interfaces';
import createDataProviderMixin, {
	DataProvider,
	DataProviderOptions,
	DataProviderState
} from './createDataProviderMixin';

export interface ColumnStructureState<T> extends DataProviderState<T> {
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

export interface ColumnStructureOptions<T, S extends ColumnStructureState<T>> extends DataProviderOptions<T, S> {
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
	 * Operates on the data observable to compute the divisor, which is used to determine the height of the columns.
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

export interface ColumnStructureMixin<T> extends Chartable {
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
	 * Operates on the data observable to compute the divisor, which is used to determine the height of the columns.
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
	 * Create nodes for each column.
	 */
	prepareColumnNodes(): VNode[];
}

/**
 * Renders columns. To be mixed into dojo-widgets/createWidget.
 */
export type ColumnStructure<T, S extends ColumnStructureState<T>> =
	DataProvider<T, S> & Invalidatable & ColumnStructureMixin<T>;

export interface ColumnStructureFactory<T> extends ComposeFactory<
	ColumnStructure<T, ColumnStructureState<T>>,
	ColumnStructureOptions<T, ColumnStructureState<T>>
> {
	<T, S extends ColumnStructureState<T>>(options?: ColumnStructureOptions<T, S>): ColumnStructure<T, S>;
}

export const COLUMN_OBJECT = Symbol('Column object for which the VNode was created');

const columnData = new WeakMap<ColumnStructure<any, ColumnStructureState<any>>, Column<any>[]>();
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

	getChartNodes() {
		const structure: ColumnStructure<any, ColumnStructureState<any>> = this;
		return structure.prepareColumnNodes();
	},

	prepareColumnNodes() {
		const structure: ColumnStructure<any, ColumnStructureState<any>> = this;
		const data = columnData.get(structure);
		const { columnHeight, columnSpacing, columnWidth } = structure;
		return data.map((value, index) => {
			const { input, relativeValue } = value;
			const height = relativeValue * columnHeight;
			const x = (columnWidth + columnSpacing) * index;
			const y = columnHeight - height;
			return h('rect', {
				key: input,
				[COLUMN_OBJECT]: value,
				width: String(columnWidth),
				height: String(height),
				x: String(x),
				y: String(y)
			});
		});
	}
}).mixin({
	mixin: createDataProviderMixin,
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

		// Initialize with an empty structure since the DataProvider only provides data if any is available.
		columnData.set(instance, []);

		let handle: Handle = null;
		const subscribe = (data: Observable<T[]>) => {
			if (handle) {
				handle.destroy();
			}

			const subscription = columnar(data, valueSelector, divisorOperator)
				.subscribe((structure) => {
					columnData.set(instance, structure);
					instance.invalidate();
				});

			handle = instance.own({
				destroy() {
					subscription.unsubscribe();
				}
			});
		};

		// DataProviderMixin may emit 'datachange' before this initializer can listen for it. Access it directly.
		if (instance.data) {
			subscribe(instance.data);
		}
		// Update the data if it changes.
		instance.own(instance.on('datachange', ({ data }) => subscribe(data)));

		instance.own({
			destroy() {
				columnData.delete(instance);
				shadowColumnHeights.delete(instance);
				shadowColumnWidths.delete(instance);
			}
		});
	}
});

export default createColumnStructureMixin;
