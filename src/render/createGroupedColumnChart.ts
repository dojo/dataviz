import { ComposeFactory } from 'dojo-compose/compose';
import { from } from 'dojo-shim/array';
import Map from 'dojo-shim/Map';
import WeakMap from 'dojo-shim/WeakMap';
import { h, VNode } from 'maquette/maquette';

import createColumnChart, {
	COLUMN_OBJECT,
	ColumnChart,
	ColumnChartOptions,
	ColumnChartState
} from './createColumnChart';

export type GroupedColumnChartState<T> = ColumnChartState<T>;

export type GroupSelector<T> = (input: T) => any;

export type GroupedColumnChartOptions<T, S extends GroupedColumnChartState<T>> = ColumnChartOptions<T, S> & {
	/**
	 * Select the group identifier from the input.
	 *
	 * May be omitted if a `groupSelector()` implementation has been mixed in.
	 */
	groupSelector?: GroupSelector<T>;
}

export interface GroupedColumnChartMixin<T> {
	/**
	 * Select the group identifier from the input.
	 *
	 * May be omitted if a `groupSelector()` option has been provided.
	 */
	groupSelector?: GroupSelector<T>;
}

export type GroupedColumnChart<T, S extends GroupedColumnChartState<T>> = ColumnChart<T, S> & GroupedColumnChartMixin<T>;

export interface GroupedColumnChartFactory<T> extends ComposeFactory<
	GroupedColumnChart<T, GroupedColumnChartState<T>>,
	GroupedColumnChartOptions<T, GroupedColumnChartState<T>>
> {
	<T, S extends GroupedColumnChartState<T>>(options?: GroupedColumnChartOptions<T, S>): GroupedColumnChart<T, S>;
}

const groupSelectors = new WeakMap<GroupedColumnChart<any, GroupedColumnChartState<any>>, GroupSelector<any>>();

const createGroupedColumnChart: GroupedColumnChartFactory<any> = createColumnChart
	.mixin({
		aspectAdvice: {
			after: {
				prepareColumnNodes(nodes: VNode[]): VNode[] {
					const chart: GroupedColumnChart<any, GroupedColumnChartState<any>> = this;
					const groupSelector = groupSelectors.get(chart);
					const groups = new Map<any, VNode[]>();

					for (const node of nodes) {
						const { input } = node.properties[COLUMN_OBJECT];

						// Note that the ordering of the groups is determined by the original sort order, as is the
						// ordering of nodes within the group.
						const group = groupSelector(input);
						if (!groups.has(group)) {
							groups.set(group, []);
						}
						groups.get(group).push(node);
					}

					// Workaround for bad from() typing <https://github.com/dojo/shim/issues/3>
					return from(<any> groups, (entry: any) => {
						const [group, nodes] = <[any, VNode[]]> entry;
						return h('g', { key: group }, nodes);
					});
				}
			}
		},

		initialize<T>(
			instance: GroupedColumnChart<T, GroupedColumnChartState<T>>,
			{ groupSelector }: GroupedColumnChartOptions<T, GroupedColumnChartState<T>> = {}
		) {
			if (!groupSelector) {
				groupSelector = (input: T) => instance.groupSelector(input);
			}

			groupSelectors.set(instance, groupSelector);
		}
	});

export default createGroupedColumnChart;
