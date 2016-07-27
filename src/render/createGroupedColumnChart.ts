import { ComposeFactory } from 'dojo-compose/compose';
import createDestroyable from 'dojo-compose/mixins/createDestroyable';
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
	translateX: number;
}

export type GroupedColumnChartState<T> = ColumnChartState<T> & {
	/**
	 * Controls the space between each group.
	 */
	groupSpacing?: number;
}

export type GroupSelector<G, T> = (input: T) => G;

export type GroupedColumnChartOptions<G, T, S extends GroupedColumnChartState<T>> = ColumnChartOptions<T, S> & {
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

export type GroupedColumnChart<G, T, S extends GroupedColumnChartState<T>> = ColumnChart<T, S> & GroupedColumnChartMixin<G, T>;

export interface GroupedColumnChartFactory<G, T> extends ComposeFactory<
	GroupedColumnChart<G, T, GroupedColumnChartState<T>>,
	GroupedColumnChartOptions<G, T, GroupedColumnChartState<T>>
> {
	<G, T, S extends GroupedColumnChartState<T>>(options?: GroupedColumnChartOptions<G, T, S>): GroupedColumnChart<G, T, S>;
}

const groupSelectors = new WeakMap<GroupedColumnChart<any, any, GroupedColumnChartState<any>>, GroupSelector<any, any>>();
const shadowGroupSpacings = new WeakMap<GroupedColumnChart<any, any, GroupedColumnChartState<any>>, number>();

const createGroupedColumnChart: GroupedColumnChartFactory<any, any> = createColumnChart
	.mixin({
		mixin: {
			get groupSpacing() {
				const chart: GroupedColumnChart<any, any, GroupedColumnChartState<any>> = this;
				const { groupSpacing = shadowGroupSpacings.get(chart) } = chart.state || {};
				return groupSpacing;
			},

			set groupSpacing(groupSpacing) {
				const chart: GroupedColumnChart<any, any, GroupedColumnChartState<any>> = this;
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
					const chart: GroupedColumnChart<G, T, GroupedColumnChartState<T>> = this;
					const groupSelector = groupSelectors.get(chart);
					const groups = new Map<G, ColumnPoint<T>[]>();

					for (const point of columnPoints) {
						const { input } = point.datum;

						// Note that the ordering of the groups is determined by the original sort order, as is the
						// ordering of nodes within the group.
						const group = groupSelector(input);
						if (!groups.has(group)) {
							groups.set(group, []);
						}
						groups.get(group).push(point);
					}

					const { columnSpacing, groupSpacing } = chart;
					let offset = 0;

					// Workaround for bad from() typing <https://github.com/dojo/shim/issues/3>
					return from<GroupedColumnPoint<G, T>>(<any> groups, (entry: any, index: number) => {
						const [group, columnPoints] = <[G, ColumnPoint<T>[]]> entry;

						// Spend half the spacing ahead of each group, and half after.
						const translateX = offset + (index === 0 ? groupSpacing / 2 : groupSpacing);

						const value = Math.max(...columnPoints.map(({ datum: { value } }) => value));
						// The grouped point starts at the first column, taking offset into account
						const x1 = columnPoints[0].x1 + offset;
						// It ends after the last column, minus its spacing, including the new offset and half the
						// group space.
						const x2 = columnPoints[columnPoints.length - 1].x2 - columnSpacing + translateX + groupSpacing / 2;
						const y1 = Math.min(...columnPoints.map(({ y1 }) => y1));
						const y2 = Math.max(...columnPoints.map(({ y2 }) => y2));

						offset = translateX;

						return {
							columnPoints,
							datum: {
								input: group,
								columns: columnPoints.map(({ datum }) => datum),
								value
							},
							translateX,
							x1,
							x2,
							y1,
							y2
						};
					});
				}
			},

			around: {
				renderPlot<G, T>(renderColumns: (points: ColumnPoint<T>[]) => VNode[]) {
					return (groupPoints: GroupedColumnPoint<G, T>[]) => {
						return groupPoints.map(({ columnPoints, datum, translateX }) => {
							const props: VNodeProperties = {
								key: datum.input
							};
							if (translateX !== 0) {
								props['transform'] = `translate(${translateX})`;
							}
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

		initialize<G, T>(
			instance: GroupedColumnChart<G, T, GroupedColumnChartState<T>>,
			{
				groupSelector,
				groupSpacing = 0
			}: GroupedColumnChartOptions<G, T, GroupedColumnChartState<T>> = {}
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
