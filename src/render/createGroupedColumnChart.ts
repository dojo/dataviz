import { ComposeFactory } from 'dojo-compose/compose';
import { EventedListenerOrArray, TargettedEventObject } from 'dojo-compose/mixins/createEvented';
import { Handle } from 'dojo-core/interfaces';
import { assign } from 'dojo-core/lang';
import { from, findIndex } from 'dojo-shim/array';
import Map from 'dojo-shim/Map';
import WeakMap from 'dojo-shim/WeakMap';
import { h, VNode } from 'maquette/maquette';

import { Datum } from '../data/interfaces';
import createColumnChart, {
	Column,
	ColumnChart,
	ColumnChartOptions,
	ColumnChartState,
	ColumnPoint,
	ColumnPointPlot,
	SelectColumnEvent
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

export interface GroupedColumnOverrides<G, T>{
	on(type: 'selectcolumn', listener: EventedListenerOrArray<SelectColumnInGroupEvent<G, T>>): Handle;
	on(type: string, listener: EventedListenerOrArray<TargettedEventObject>): Handle;
}

export interface SelectColumnInGroupEvent<G, T> extends SelectColumnEvent<T> {
	group: G;
	groupPoint: GroupedColumnPoint<G, T>;
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
const pointsByNode = new WeakMap<VNode, GroupedColumnPoint<any, any>>();

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
			},

			emitPlotEvent<G, T>(
				this: GroupedColumnChart<any, any, any, any>,
				prefix: string,
				plotNode: VNode,
				evt: TargettedEventObject
			) {
				const groupPoint: GroupedColumnPoint<G, T> = pointsByNode.get(plotNode);
				if (!groupPoint) {
					return;
				}

				const index = findIndex(plotNode.children, ({ domNode }) => domNode === evt.target);
				if (index === -1) {
					return;
				}

				const target = groupPoint.columnPoints[index];
				if (!target) {
					return;
				}

				const { datum: { input: group } } = groupPoint;
				const { datum: { input } } = target;
				if (prefix === 'select') {
					this.emit({ type: 'selectcolumn', group, groupPoint, input, target });
				}
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

					for (const point of columnPoints) {
						const { input, relativeValue, value } = point.datum;

						// Note that the ordering of the groups is determined by the original sort order, as is the
						// ordering of nodes within the group.
						const group = groupSelector(input);
						if (!groups.has(group)) {
							groups.set(group, { columnPoints: [], columns: [], totalValue: 0, value: 0, y1: columnHeight });
						}

						// The point will be modified below. Be friendly and copy it first.
						const shallowCopy = assign({}, point);

						const record = groups.get(group);
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
				renderPlotPoints<G, T>(renderColumns: (points: ColumnPoint<T>[], plotHeight: number, extraHeight: number) => VNode[][]) {
					return function(
						this: GroupedColumnChart<G, T, GroupedColumn<G, T>, any>,
						groupPoints: GroupedColumnPoint<G, T>[],
						plotHeight: number,
						extraHeight: number
					) {
						const { groupSpacing } = this;

						const outerGroupNodes: VNode[] = [];
						const innerGroupNodes: VNode[] = [];
						const outerColumnNodes: VNode[] = [];
						const innerColumnNodes: VNode[] = [];
						const groupNodes: VNode[] = [];

						const fullHeight = String(plotHeight + extraHeight);
						const fullY = String(-extraHeight);
						for (const point of groupPoints) {
							const { columnPoints, datum: { input: key }, x1, x2 } = point;

							outerGroupNodes.push(h('rect', {
								key,
								'fill-opacity': '0',
								height: fullHeight,
								width: String(x2 - x1),
								x: String(x1),
								y: fullY
							}));

							innerGroupNodes.push(h('rect', {
								key,
								'fill-opacity': '0',
								height: fullHeight,
								width: String(x2 - x1 - groupSpacing),
								x: String(x1 + groupSpacing / 2),
								y: fullY
							}));

							const [outer, inner, nodes] = renderColumns.call(this, columnPoints, plotHeight, extraHeight);
							outerColumnNodes.push(...outer);
							innerColumnNodes.push(...inner);

							const groupNode = h('g', { key }, nodes);
							groupNodes.push(groupNode);
							pointsByNode.set(groupNode, point);
						}

						return [outerGroupNodes, innerGroupNodes, outerColumnNodes, innerColumnNodes, groupNodes];
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
				groupSelector = (input: T) => instance.groupSelector(input);
			}

			groupSelectors.set(instance, groupSelector);
			shadowGroupSpacings.set(instance, groupSpacing);
		}
	});

export default createGroupedColumnChart;
