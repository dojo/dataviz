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
	ColumnPoint,
	ColumnPointPlot
} from './createColumnChart';
import { Plot, Point } from './interfaces';

export interface StackedColumn<G, T> extends Datum<G> {
	columns: Column<T>[];
}

export interface StackedColumnPoint<G, T> extends Point<StackedColumn<G, T>> {
	columnPoints: ColumnPoint<T>[];
}

export interface StackedColumnPointPlot<G, T> extends Plot<StackedColumnPoint<G, T>> {}

export type StackedColumnChartState<T, D> = ColumnChartState<T, D> & {
	/**
	 * Controls the vertical space between each column in the stack.
	 */
	stackSpacing?: number;
}

export type StackSelector<G, T> = (input: T) => G;

export type StackedColumnChartOptions<G, T, D, S extends StackedColumnChartState<T, D>> = ColumnChartOptions<T, D, S> & {
	/**
	 * Select the stack identifier from the input.
	 *
	 * May be omitted if a `stackSelector()` implementation has been mixed in.
	 */
	stackSelector?: StackSelector<G, T>;

	/**
	 * Controls the space between each stack.
	 */
	stackSpacing?: number;
}

export interface StackedColumnChartMixin<G, T> {
	/**
	 * Select the stack identifier from the input.
	 *
	 * May be omitted if a `stackSelector()` option has been provided.
	 */
	stackSelector?: StackSelector<G, T>;

	/**
	 * Controls the vertical space between each column in the stack.
	 */
	stackSpacing: number;
}

export type StackedColumnChart<G, T, D extends Datum<G>, S extends StackedColumnChartState<T, D>> = ColumnChart<T, D, S> & StackedColumnChartMixin<G, T>;

export interface StackedColumnChartFactory<G, T> extends ComposeFactory<
	StackedColumnChart<G, T, StackedColumn<G, T>, StackedColumnChartState<T, StackedColumn<G, T>>>,
	StackedColumnChartOptions<G, T, StackedColumn<G, T>, StackedColumnChartState<T, StackedColumn<G, T>>>
> {
	<G, T, D extends StackedColumn<G, T>, S extends StackedColumnChartState<T, D>>(options?: StackedColumnChartOptions<G, T, D, S>): StackedColumnChart<G, T, D, S>;
}

export interface GenericStackedColumnChartFactory<G, T> extends ComposeFactory<
	StackedColumnChart<G, T, Datum<any>, StackedColumnChartState<T, Datum<any>>>,
	StackedColumnChartOptions<G, T, Datum<any>, StackedColumnChartState<T, Datum<any>>>
> {
	<G, T, D extends Datum<any>, S extends StackedColumnChartState<T, D>>(options?: StackedColumnChartOptions<G, T, D, S>): StackedColumnChart<G, T, D, S>;
}

const stackSelectors = new WeakMap<StackedColumnChart<any, any, any, StackedColumnChartState<any, any>>, StackSelector<any, any>>();
const shadowStackSpacings = new WeakMap<StackedColumnChart<any, any, any, StackedColumnChartState<any, any>>, number>();

// Cast to a generic factory so subclasses can modify the datum type.
// The factory should be casted to StackedColumnChartFactory when creating a stacked column chart.
const createStackedColumnChart: GenericStackedColumnChartFactory<any, any> = createColumnChart
	.mixin({
		mixin: {
			get stackSpacing() {
				const chart: StackedColumnChart<any, any, any, StackedColumnChartState<any, any>> = this;
				const { stackSpacing = shadowStackSpacings.get(chart) } = chart.state || {};
				return stackSpacing;
			},

			set stackSpacing(stackSpacing) {
				const chart: StackedColumnChart<any, any, any, StackedColumnChartState<any, any>> = this;
				if (chart.state) {
					chart.setState({ stackSpacing });
				}
				else {
					shadowStackSpacings.set(chart, stackSpacing);
				}
				chart.invalidate();
			}
		},

		aspectAdvice: {
			after: {
				plot<G, T>({
					height,
					points: columnPoints,
					width
				}: ColumnPointPlot<T>): StackedColumnPointPlot<G, T> {
					const chart: StackedColumnChart<G, T, StackedColumn<G, T>, StackedColumnChartState<T, StackedColumn<G, T>>> = this;
					const { columnHeight, columnSpacing, columnWidth, domainMax, stackSpacing } = chart;
					let maxValue = 0;
					let maxRelativeValue = 0;

					const stackSelector = stackSelectors.get(chart);
					interface Record {
						columnPoints: ColumnPoint<T>[];
						columns: Column<T>[];
						relativeValue: number;
						value: number;
					}
					const stacks = new Map<G, Record>();

					for (const point of columnPoints) {
						const { input, relativeValue, value } = point.datum;

						// Note that the ordering of the stacks is determined by the original sort order, as is the
						// ordering of nodes within the stack.
						const stack = stackSelector(input);
						if (!stacks.has(stack)) {
							stacks.set(stack, { columnPoints: [], columns: [], relativeValue: 0, value: 0 });
						}

						// The point will be modified below. Be friendly and copy it first.
						const shallowCopy = assign({}, point);

						const record = stacks.get(stack);
						record.columnPoints.push(shallowCopy);
						record.columns.push(point.datum);
						record.relativeValue += relativeValue;
						record.value += value;

						if (record.value > maxValue) {
							maxValue = record.value;
						}
						if (record.relativeValue > maxRelativeValue) {
							maxRelativeValue = record.relativeValue;
						}
					}

					// Recompute the domain correction, so that only the stack who's total value equals the domain
					// maximum is rendered with the full column height.
					let domainCorrection = 1;
					if (domainMax > 0) {
						domainCorrection = maxValue / domainMax;
					}

					let chartWidth = 0;
					// Workaround for bad from() typing <https://github.com/dojo/shim/issues/3>
					const points = from<StackedColumnPoint<G, T>>(<any> stacks, (entry: any, index: number) => {
						const [stack, { columnPoints, columns, relativeValue, value }] = <[G, Record]> entry;

						let correctedRelativeValue = relativeValue * domainCorrection;
						// If the columns are scaled as a percentage of their total value then the maxRelativeValue will
						// never exceed 1. If it does then rescale the stacks so the largest stack is the full column
						// height (meaning it has a relative value of 1).
						if (maxRelativeValue > 1) {
							correctedRelativeValue /= maxRelativeValue;
						}

						const stackHeight = columnHeight * correctedRelativeValue;
						const y1 = columnHeight - stackHeight;

						// Spend half the spacing ahead of each stack, and half after.
						const x1 = chartWidth;
						// Assume each column's displayWidth is indeed the columnWidth
						const x2 = x1 + columnWidth + columnSpacing;
						chartWidth = x2;

						let prev = { displayHeight: 0, y1: columnHeight };
						for (const point of columnPoints) {
							point.x1 = x1;
							point.x2 = x2;

							// Ensure each column within the stack has the correct size relative to the other columns.
							point.displayHeight = stackHeight * point.datum.relativeValue / relativeValue;
							// Place above the previous column.
							point.y2 = prev.y1;
							point.y1 = point.y2 - point.displayHeight;

							// Column spacing eats into the height of the lower column.
							prev.y1 += stackSpacing;
							prev.displayHeight -= stackSpacing;

							prev = point;
						}

						return {
							columnPoints,
							datum: {
								input: stack,
								columns,
								value
							},
							x1,
							x2,
							y1,
							y2: columnHeight
						};
					});

					return {
						height,
						points,
						width
					};
				}
			},

			around: {
				renderPlotPoints<G, T>(renderColumns: (points: ColumnPoint<T>[]) => VNode[]) {
					return (stackPoints: StackedColumnPoint<G, T>[]) => {
						return stackPoints.map(({ columnPoints, datum }) => {
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

		initialize<G, T, D extends StackedColumn<G, T>>(
			instance: StackedColumnChart<G, T, D, StackedColumnChartState<T, D>>,
			{
				stackSelector,
				stackSpacing = 0
			}: StackedColumnChartOptions<G, T, D, StackedColumnChartState<T, D>> = {}
		) {
			if (!stackSelector) {
				stackSelector = (input: T) => instance.stackSelector(input);
			}

			stackSelectors.set(instance, stackSelector);
			shadowStackSpacings.set(instance, stackSpacing);
			instance.own({
				destroy() {
					stackSelectors.delete(instance);
					shadowStackSpacings.delete(instance);
				}
			});
		}
	});

export default createStackedColumnChart;
