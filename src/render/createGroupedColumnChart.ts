import { ComposeFactory } from 'dojo-compose/compose';
import createDestroyable from 'dojo-compose/mixins/createDestroyable';
import { from } from 'dojo-shim/array';
import Map from 'dojo-shim/Map';
import WeakMap from 'dojo-shim/WeakMap';
import { h, VNode, VNodeProperties } from 'maquette/maquette';

import createColumnChart, {
	ColumnChart,
	ColumnChartOptions,
	ColumnChartState,
	ColumnPoint
} from './createColumnChart';

export interface GroupedColumnPoint<T> {
	columnPoints: ColumnPoint<T>[];
	group: T;
	translateX?: number;
}

export type GroupedColumnChartState<T> = ColumnChartState<T> & {
	/**
	 * Controls the space between each group.
	 */
	groupSpacing?: number;
}

export type GroupSelector<T> = (input: T) => any;

export type GroupedColumnChartOptions<T, S extends GroupedColumnChartState<T>> = ColumnChartOptions<T, S> & {
	/**
	 * Select the group identifier from the input.
	 *
	 * May be omitted if a `groupSelector()` implementation has been mixed in.
	 */
	groupSelector?: GroupSelector<T>;

	/**
	 * Controls the space between each group.
	 */
	groupSpacing?: number;
}

export interface GroupedColumnChartMixin<T> {
	/**
	 * Select the group identifier from the input.
	 *
	 * May be omitted if a `groupSelector()` option has been provided.
	 */
	groupSelector?: GroupSelector<T>;

	/**
	 * Controls the space between each group.
	 */
	groupSpacing?: number;
}

export type GroupedColumnChart<T, S extends GroupedColumnChartState<T>> = ColumnChart<T, S> & GroupedColumnChartMixin<T>;

export interface GroupedColumnChartFactory<T> extends ComposeFactory<
	GroupedColumnChart<T, GroupedColumnChartState<T>>,
	GroupedColumnChartOptions<T, GroupedColumnChartState<T>>
> {
	<T, S extends GroupedColumnChartState<T>>(options?: GroupedColumnChartOptions<T, S>): GroupedColumnChart<T, S>;
}

const groupSelectors = new WeakMap<GroupedColumnChart<any, GroupedColumnChartState<any>>, GroupSelector<any>>();
const shadowGroupSpacings = new WeakMap<GroupedColumnChart<any, GroupedColumnChartState<any>>, number>();

const createGroupedColumnChart: GroupedColumnChartFactory<any> = createColumnChart
	.mixin({
		mixin: {
			get groupSpacing() {
				const chart: GroupedColumnChart<any, GroupedColumnChartState<any>> = this;
				const { groupSpacing = shadowGroupSpacings.get(chart) } = chart.state || {};
				return groupSpacing;
			},

			set groupSpacing(groupSpacing) {
				const chart: GroupedColumnChart<any, GroupedColumnChartState<any>> = this;
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
				plot(columnPoints: ColumnPoint<any>[]): GroupedColumnPoint<any>[] {
					const chart: GroupedColumnChart<any, GroupedColumnChartState<any>> = this;
					const groupSelector = groupSelectors.get(chart);
					const groups = new Map<any, ColumnPoint<any>[]>();

					for (const point of columnPoints) {
						const { input } = point.column;

						// Note that the ordering of the groups is determined by the original sort order, as is the
						// ordering of nodes within the group.
						const group = groupSelector(input);
						if (!groups.has(group)) {
							groups.set(group, []);
						}
						groups.get(group).push(point);
					}

					const { groupSpacing } = chart;
					let offset = 0;

					// Workaround for bad from() typing <https://github.com/dojo/shim/issues/3>
					return from(<any> groups, (entry: any, index: number) => {
						const [group, columnPoints] = <[any, ColumnPoint<any>[]]> entry;

						let translateX: number;
						if (index > 0) {
							offset += groupSpacing;
							translateX = offset;
						}

						return {
							columnPoints,
							group,
							translateX
						};
					});
				}
			},

			around: {
				renderPlot(renderColumns: (points: ColumnPoint<any>[]) => VNode[]) {
					return (groupPoints: GroupedColumnPoint<any>[]) => {
						return groupPoints.map(({ group, columnPoints, translateX }) => {
							const props: VNodeProperties = {
								key: group
							};
							if (translateX) {
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

		initialize<T>(
			instance: GroupedColumnChart<T, GroupedColumnChartState<T>>,
			{
				groupSelector,
				groupSpacing = 0
			}: GroupedColumnChartOptions<T, GroupedColumnChartState<T>> = {}
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
