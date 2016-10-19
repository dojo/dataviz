import { ComposeFactory } from 'dojo-compose/compose';
import { assign } from 'dojo-core/lang';
import { from } from 'dojo-shim/array';
import Map from 'dojo-shim/Map';
import WeakMap from 'dojo-shim/WeakMap';
import { h, VNode, VNodeProperties } from 'maquette';

import { Datum } from '../data/interfaces';
import createColumnChart, {
	Column,
	ColumnChart,
	ColumnChartOptions,
	ColumnChartState,
	ColumnPoint,
	ColumnPointPlot
} from './createColumnChart';
import { Plot, Point } from './interfaces';

export interface GroupedColumn<G, T> extends Datum<G> {
	columns: Column<T>[];
	totalValue: number;

	/**
	 * Assuming all columns in the group are positive, the largest value in the group. If all columns are negative
	 * this is the smallest value. If the group contains both positive and negative columns the value is undetermined.
	 */
	value: number;
}

export interface GroupedColumnPoint<G, T> extends Point<GroupedColumn<G, T>> {
	columnPoints: ColumnPoint<T>[];
}

export interface GroupedColumnPointPlot<G, T> extends Plot<GroupedColumnPoint<G, T>> {}

export type GroupedColumnChartState<T> = ColumnChartState<T> & {
	/**
	 * Controls the space between each group.
	 */
	groupSpacing?: number;
}

export type GroupSelector<G, T> = (input: T) => G;

export type GroupedColumnChartOptions<
	G,
	T,
	// Extend Datum<any> so subclasses can use their own datum type without having to extend from GroupedColumn<G, T>.
	D extends Datum<any>,
	// Extend GroupedColumnChartState<T> since subclasses must still support the state properties of GroupedColumnChart.
	S extends GroupedColumnChartState<T>
> = ColumnChartOptions<T, D, S> & {
	/**
	 * Select the group identifier from the input.
	 *
	 * May be omitted if a `groupSelector()` implementation has been mixed in.
	 */
	groupSelector?: GroupSelector<G, T>;

	/**
	 * Controls the space between each group.
	 */
	groupSpacing?: number;
}

export interface GroupedColumnChartMixin<G, T> {
	/**
	 * Select the group identifier from the input.
	 *
	 * May be omitted if a `groupSelector()` option has been provided.
	 */
	groupSelector?: GroupSelector<G, T>;

	/**
	 * Controls the space between each group.
	 */
	groupSpacing?: number;
}

export type GroupedColumnChart<
	G,
	T,
	// Extend Datum<any> so subclasses can use their own datum type without having to extend from GroupedColumn<G, T>.
	D extends Datum<any>,
	// Extend GroupedColumnChartState<T> since subclasses must still support the state properties of GroupedColumnChart.
	S extends GroupedColumnChartState<T>
> = ColumnChart<T, D, S> & GroupedColumnChartMixin<G, T>;

export interface GroupedColumnChartFactory<G, T> extends ComposeFactory<
	GroupedColumnChart<G, T, GroupedColumn<G, T>, GroupedColumnChartState<T>>,
	GroupedColumnChartOptions<G, T, GroupedColumn<G, T>, GroupedColumnChartState<T>>
> {
	<G, T>(
		options?: GroupedColumnChartOptions<G, T, GroupedColumn<G, T>, GroupedColumnChartState<T>>
	): GroupedColumnChart<G, T, GroupedColumn<G, T>, GroupedColumnChartState<T>>;
}

const groupSelectors = new WeakMap<GroupedColumnChart<any, any, any, GroupedColumnChartState<any>>, GroupSelector<any, any>>();
const shadowGroupSpacings = new WeakMap<GroupedColumnChart<any, any, any, GroupedColumnChartState<any>>, number>();

// Cast to a generic factory so subclasses can modify the datum type.
// The factory should be casted to GroupedColumnChartFactory when creating a grouped column chart.
const createGroupedColumnChart: GroupedColumnChartFactory<any, any> = createColumnChart
	.mixin({
		mixin: {
			get groupSpacing(this: GroupedColumnChart<any, any, any, GroupedColumnChartState<any>>) {
				const { groupSpacing = shadowGroupSpacings.get(this) } = this.state || {};
				return groupSpacing;
			},

			set groupSpacing(groupSpacing) {
				if (this.state) {
					this.setState({ groupSpacing });
				}
				else {
					shadowGroupSpacings.set(this, groupSpacing);
				}
				this.invalidate();
			}
		},

		aspectAdvice: {
			after: {
				plot<G, T>(this: GroupedColumnChart<G, T, GroupedColumn<G, T>, any>, {
					height,
					horizontalValues,
					points: columnPoints,
					verticalValues,
					width,
					zero
				}: ColumnPointPlot<T>): GroupedColumnPointPlot<G, T> {
					const { columnHeight, columnSpacing, groupSpacing } = this;

					const groupSelector = groupSelectors.get(this);
					interface Record {
						columnPoints: ColumnPoint<T>[];
						columns: Column<T>[];
						totalValue: number;
						value: number;
						y1: number;
					}
					const groups = new Map<G, Record>();
					const createRecord = (): Record => {
						return { columnPoints: [], columns: [], totalValue: 0, value: 0, y1: columnHeight };
					};

					for (const point of columnPoints) {
						const { input, relativeValue, value } = point.datum;

						// Note that the ordering of the groups is determined by the original sort order, as is the
						// ordering of nodes within the group.
						const group = groupSelector(input);
						const record = groups.get(group) || createRecord();
						if (!groups.has(group)) {
							groups.set(group, record);
						}

						// The point will be modified below. Be friendly and copy it first.
						const shallowCopy = assign({}, point);
						record.columnPoints.push(shallowCopy);
						record.columns.push(point.datum);
						record.totalValue += value;
						if (relativeValue < 0) {
							record.value = Math.min(record.value, value);
						}
						else {
							// Note that the expected value for mixed groups is undefined.
							record.value = Math.max(record.value, value);
						}
						record.y1 = Math.min(record.y1, point.y1);
					}

					let chartWidth = 0;
					const points = from<
						[G, Record],
						GroupedColumnPoint<G, T>
					>(groups.entries(), (entry, index) => {
						const [group, { columnPoints, columns, totalValue, value, y1 }] = entry;

						const x1 = chartWidth;

						let prev = { x2: x1 + groupSpacing / 2 - columnSpacing / 2 };
						for (const point of columnPoints) {
							const dx = point.x2 - point.x1;
							point.x1 = prev.x2;
							point.x2 = point.x1 + dx;

							prev = point;
						}

						const x2 = prev.x2 + groupSpacing / 2;
						chartWidth = x2;

						return {
							columnPoints,
							datum: {
								input: group,
								columns,
								totalValue,
								value
							},
							x1,
							x2,
							y1,
							y2: columnHeight
						};
					});

					return { height, horizontalValues, points, verticalValues, width, zero };
				}
			},

			around: {
				renderPlotPoints<G, T>(renderColumns: (points: ColumnPoint<T>[]) => VNode[]) {
					return function(this: any, groupPoints: GroupedColumnPoint<G, T>[]) {
						return groupPoints.map(({ columnPoints, datum }) => {
							const props: VNodeProperties = {
								key: datum.input
							};
							return h('g', props, renderColumns.call(this, columnPoints));
						});
					};
				}
			}
		}
	})
	.mixin({
		initialize<G, T>(
			instance: GroupedColumnChart<G, T, GroupedColumn<G, T>, GroupedColumnChartState<T>>,
			{
				groupSelector,
				groupSpacing = 0
			}: GroupedColumnChartOptions<G, T, GroupedColumn<G, T>, GroupedColumnChartState<T>> = {}
		) {
			if (!groupSelector) {
				// Ignore instance.groupSelector being undefined, let the runtime throw an exception instead.
				groupSelector = (input: T) => instance.groupSelector!(input);
			}

			groupSelectors.set(instance, groupSelector);
			shadowGroupSpacings.set(instance, groupSpacing);
		}
	});

export default createGroupedColumnChart;
