import { ComposeFactory } from 'dojo-compose/compose';
import createDestroyable from 'dojo-compose/mixins/createDestroyable';
import { assign } from 'dojo-core/lang';
import { from } from 'dojo-shim/array';
import Map from 'dojo-shim/Map';
import WeakMap from 'dojo-shim/WeakMap';
import { h, VNode, VNodeProperties } from 'maquette/maquette';

import { Datum } from '../data/interfaces';
import createColumnChart, {
	Column,
	ColumnChart,
	ColumnChartOptions,
	ColumnChartState,
	ColumnPoint
} from './createColumnChart';
import { Point } from './interfaces';

export interface GroupedColumn<G, T> extends Datum<G> {
	columns: Column<T>[];
}

export interface GroupedColumnPoint<G, T> extends Point<GroupedColumn<G, T>> {
	columnPoints: ColumnPoint<T>[];
}

export type GroupedColumnChartState<T, D> = ColumnChartState<T, D> & {
	/**
	 * Controls the space between each group.
	 */
	groupSpacing?: number;
}

export type GroupSelector<G, T> = (input: T) => G;

export type GroupedColumnChartOptions<G, T, D, S extends GroupedColumnChartState<T, D>> = ColumnChartOptions<T, D, S> & {
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

export type GroupedColumnChart<G, T, D extends Datum<G>, S extends GroupedColumnChartState<T, D>> = ColumnChart<T, D, S> & GroupedColumnChartMixin<G, T>;

export interface GroupedColumnChartFactory<G, T> extends ComposeFactory<
	GroupedColumnChart<G, T, GroupedColumn<G, T>, GroupedColumnChartState<T, GroupedColumn<G, T>>>,
	GroupedColumnChartOptions<G, T, GroupedColumn<G, T>, GroupedColumnChartState<T, GroupedColumn<G, T>>>
> {
	<G, T, D extends GroupedColumn<G, T>, S extends GroupedColumnChartState<T, D>>(options?: GroupedColumnChartOptions<G, T, D, S>): GroupedColumnChart<G, T, D, S>;
}

export interface GenericGroupedColumnChartFactory<G, T> extends ComposeFactory<
	GroupedColumnChart<G, T, Datum<any>, GroupedColumnChartState<T, Datum<any>>>,
	GroupedColumnChartOptions<G, T, Datum<any>, GroupedColumnChartState<T, Datum<any>>>
> {
	<G, T, D extends Datum<any>, S extends GroupedColumnChartState<T, D>>(options?: GroupedColumnChartOptions<G, T, D, S>): GroupedColumnChart<G, T, D, S>;
}

const groupSelectors = new WeakMap<GroupedColumnChart<any, any, any, GroupedColumnChartState<any, any>>, GroupSelector<any, any>>();
const shadowGroupSpacings = new WeakMap<GroupedColumnChart<any, any, any, GroupedColumnChartState<any, any>>, number>();

// Cast to a generic factory so subclasses can modify the datum type.
// The factory should be casted to GroupedColumnChartFactory when creating a grouped column chart.
const createGroupedColumnChart: GenericGroupedColumnChartFactory<any, any> = createColumnChart
	.mixin({
		mixin: {
			get groupSpacing() {
				const chart: GroupedColumnChart<any, any, any, GroupedColumnChartState<any, any>> = this;
				const { groupSpacing = shadowGroupSpacings.get(chart) } = chart.state || {};
				return groupSpacing;
			},

			set groupSpacing(groupSpacing) {
				const chart: GroupedColumnChart<any, any, any, GroupedColumnChartState<any, any>> = this;
				if (chart.state) {
					chart.setState({ groupSpacing });
				}
				else {
					shadowGroupSpacings.set(chart, groupSpacing);
				}
				chart.invalidate();
			}
		},

		aspectAdvice: {
			after: {
				plot<G, T>(columnPoints: ColumnPoint<T>[]): GroupedColumnPoint<G, T>[] {
					const chart: GroupedColumnChart<G, T, GroupedColumn<G, T>, GroupedColumnChartState<T, GroupedColumn<G, T>>> = this;
					const { columnHeight, columnSpacing, groupSpacing } = chart;

					const groupSelector = groupSelectors.get(chart);
					interface Record {
						columnPoints: ColumnPoint<T>[];
						columns: Column<T>[];
						value: number;
						y1: number;
					}
					const groups = new Map<G, Record>();

					for (const point of columnPoints) {
						const { input } = point.datum;

						// Note that the ordering of the groups is determined by the original sort order, as is the
						// ordering of nodes within the group.
						const group = groupSelector(input);
						if (!groups.has(group)) {
							groups.set(group, { columnPoints: [], columns: [], value: 0, y1: columnHeight });
						}

						// The point will be modified below. Be friendly and copy it first.
						const shallowCopy = assign({}, point);

						const record = groups.get(group);
						record.columnPoints.push(shallowCopy);
						record.columns.push(point.datum);
						record.value = Math.max(record.value, point.datum.value);
						record.y1 = Math.min(record.y1, point.y1);
					}

					let offset = 0;
					// Workaround for bad from() typing <https://github.com/dojo/shim/issues/3>
					return from<GroupedColumnPoint<G, T>>(<any> groups, (entry: any, index: number) => {
						const [group, { columnPoints, columns, value, y1 }] = <[G, Record]> entry;

						const x1 = offset;

						let prev = { x2: x1 + groupSpacing / 2 - columnSpacing / 2 };
						for (const point of columnPoints) {
							const dx = point.x2 - point.x1;
							point.x1 = prev.x2;
							point.x2 = point.x1 + dx;

							prev = point;
						}

						const x2 = prev.x2 + groupSpacing / 2;
						offset = x2;

						return {
							columnPoints,
							datum: {
								input: group,
								columns,
								value
							},
							x1,
							x2,
							y1,
							y2: columnHeight
						};
					});
				}
			},

			around: {
				renderPlot<G, T>(renderColumns: (points: ColumnPoint<T>[]) => VNode[]) {
					return (groupPoints: GroupedColumnPoint<G, T>[]) => {
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
		// Add createDestroyable to ensure instance.own() is available at runtime.
		// See <https://github.com/dojo/compose/issues/42>.
		mixin: createDestroyable,

		initialize<G, T, D extends GroupedColumn<G, T>>(
			instance: GroupedColumnChart<G, T, D, GroupedColumnChartState<T, D>>,
			{
				groupSelector,
				groupSpacing = 0
			}: GroupedColumnChartOptions<G, T, D, GroupedColumnChartState<T, D>> = {}
		) {
			if (!groupSelector) {
				groupSelector = (input: T) => instance.groupSelector(input);
			}

			groupSelectors.set(instance, groupSelector);
			shadowGroupSpacings.set(instance, groupSpacing);
			instance.own({
				destroy() {
					groupSelectors.delete(instance);
					shadowGroupSpacings.delete(instance);
				}
			});
		}
	});

export default createGroupedColumnChart;
