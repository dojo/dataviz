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

export interface StackedColumn<G, T> extends Datum<G> {
	columns: Column<T>[];
}

export interface StackedColumnPoint<G, T> extends Point<StackedColumn<G, T>> {
	columnPoints: ColumnPoint<T>[];
}

export interface StackedColumnPointPlot<G, T> extends Plot<StackedColumnPoint<G, T>> {}

export type StackedColumnChartState<T> = ColumnChartState<T> & {
	/**
	 * Controls the vertical space between each column in the stack.
	 */
	stackSpacing?: number;
}

export type StackSelector<G, T> = (input: T) => G;

export type StackedColumnChartOptions<
	G,
	T,
	// Extend Datum<any> so subclasses can use their own datum type without having to extend from StackedColumn<G, T>.
	D extends Datum<any>,
	// Extend StackedColumnChartState<T> since subclasses must still support the state properties of StackedColumnChart.
	S extends StackedColumnChartState<T>
> = ColumnChartOptions<T, D, S> & {
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

export type StackedColumnChart<
	G,
	T,
	// Extend Datum<any> so subclasses can use their own datum type without having to extend from StackedColumn<G, T>.
	D extends Datum<any>,
	// Extend StackedColumnChartState<T> since subclasses must still support the state properties of StackedColumnChart.
	S extends StackedColumnChartState<T>
> = ColumnChart<T, D, S> & StackedColumnChartMixin<G, T>;

export interface StackedColumnChartFactory<G, T> extends ComposeFactory<
	StackedColumnChart<G, T, StackedColumn<G, T>, StackedColumnChartState<T>>,
	StackedColumnChartOptions<G, T, StackedColumn<G, T>, StackedColumnChartState<T>>
> {
	<G, T>(
		options?: StackedColumnChartOptions<G, T, StackedColumn<G, T>, StackedColumnChartState<T>>
	): StackedColumnChart<G, T, StackedColumn<G, T>, StackedColumnChartState<T>>;
}

const stackSelectors = new WeakMap<
	StackedColumnChart<any, any, any, StackedColumnChartState<any>>,
	StackSelector<any, any>
>();
const shadowStackSpacings = new WeakMap<StackedColumnChart<any, any, any, StackedColumnChartState<any>>, number>();

// Cast to a generic factory so subclasses can modify the datum type.
// The factory should be casted to StackedColumnChartFactory when creating a stacked column chart.
const createStackedColumnChart: StackedColumnChartFactory<any, any> = createColumnChart
	.mixin({
		mixin: {
			get stackSpacing(this: StackedColumnChart<any, any, any, StackedColumnChartState<any>>) {
				const { stackSpacing = shadowStackSpacings.get(this) } = this.state || {};
				return stackSpacing;
			},

			set stackSpacing(stackSpacing) {
				if (this.state) {
					this.setState({ stackSpacing });
				}
				else {
					shadowStackSpacings.set(this, stackSpacing);
				}
				this.invalidate();
			}
		},

		aspectAdvice: {
			after: {
				plot<G, T>(this: StackedColumnChart<G, T, StackedColumn<G, T>, any>, {
					height,
					horizontalValues,
					points: columnPoints,
					verticalValues,
					width,
					zero
				}: ColumnPointPlot<T>): StackedColumnPointPlot<G, T> {
					const {
						columnHeight,
						columnSpacing,
						columnWidth,
						domain: [ domainMin, domainMax ],
						stackSpacing
					} = this;

					let mostNegativeRelValue = 0;
					let mostNegativeValue = 0;
					let mostPositiveRelValue = 0;
					let mostPositiveValue = 0;

					const stackSelector = stackSelectors.get(this);
					interface Record {
						columnPoints: ColumnPoint<T>[];
						columns: Column<T>[];
						isNegative: boolean;
						relativeValue: number;
						value: number;
					}
					const stacks = new Map<G, [ Record, Record ]>();
					const createSigned = (): [ Record, Record ] => {
						return [
							// Record negative and positive columns separately.
							{ columnPoints: [], columns: [], isNegative: true, relativeValue: 0, value: 0 },
							{ columnPoints: [], columns: [], isNegative: false, relativeValue: 0, value: 0 }
						];
					};

					for (const point of columnPoints) {
						const { datum } = point;
						const { input, relativeValue, value } = datum;

						// Note that the ordering of the stacks is determined by the original sort order, as is the
						// ordering of nodes within the stack.
						const stack = stackSelector(input);
						const signed = stacks.get(stack) || createSigned();
						const record = relativeValue < 0 ? signed[0] : signed[1];
						if (!stacks.has(stack)) {
							stacks.set(stack, signed);
						}

						// The point will be modified below. Be friendly and copy it first.
						const shallowCopy = assign({}, point);
						record.columnPoints.push(shallowCopy);
						record.columns.push(datum);
						record.relativeValue += relativeValue;
						record.value += value;

						if (record.relativeValue < mostNegativeRelValue) {
							mostNegativeRelValue = record.relativeValue;
						}
						else if (record.relativeValue > mostPositiveRelValue) {
							mostPositiveRelValue = record.relativeValue;
						}

						if (record.value < mostNegativeValue) {
							mostNegativeValue = record.value;
						}
						else if (record.value > mostPositiveValue) {
							mostPositiveValue = record.value;
						}
					}

					// Maximum height of positive stacks. Initially assume there are no negative stacks, this will be
					// refined later. The height of negative stacks is determined by taking columnHeight and
					// subtracting positiveHeight.
					let positiveHeight = columnHeight;

					// The height of each stack is determined by the stack's relative value and the available positive
					// or negative height. The relative value needs to be corrected for the available height if there
					// are both negative and positive stacks, or if the absolute combined relative value for either
					// stack exceeds 1. In the latter case the height needs to be corrected as if the maximum relative
					// value was 1.
					let negativeStackHeightCorrection = 1;
					let positiveStackHeightCorrection = 1;
					if (mostNegativeRelValue < 0) {
						if (mostPositiveRelValue === 0) {
							if (mostNegativeRelValue < -1) {
								negativeStackHeightCorrection /= -mostNegativeRelValue;
							}
						}
						else {
							negativeStackHeightCorrection /= -mostNegativeRelValue;
							positiveStackHeightCorrection /= mostPositiveRelValue;
						}
					}
					else if (mostPositiveRelValue > 1) {
						positiveStackHeightCorrection /= mostPositiveRelValue;
					}

					// Relative column values need to be further adjusted if a domain minimum and/or maximum is
					// specified. Only negative stacks who's value equals the domain minimum, or positive stacks who's
					// value equals the domain maximum, must be rendered with the full available height.
					//
					// This is also where enough information is available to compute the correct positiveHeight.
					if (domainMin !== 0 || domainMax !== 0) {
						if (domainMin < 0) {
							if (domainMax === 0) {
								// There shouldn't be any positive stacks
								negativeStackHeightCorrection *= mostNegativeValue / domainMin;
								positiveHeight = 0;
							}
							else if (domainMax > 0) {
								// There may be both positive and negative stacks.
								negativeStackHeightCorrection *= mostNegativeValue / domainMin;
								positiveStackHeightCorrection *= mostPositiveValue / domainMax;
								positiveHeight *= domainMax / (domainMax - domainMin);
							}
						}
						else if (domainMin === 0 && domainMax > 0) {
							// There should only be positive stacks.
							positiveStackHeightCorrection *= mostPositiveValue / domainMax;
						}
						// FIXME: Should this raise an error if domainMin > 0 or domainMax < 0? These are not valid
						// domains for column charts (issue #6).
					}
					// Without a domain, adjust the positiveHeight only if there are negative stacks.
					else if (mostNegativeRelValue < 0) {
						if (mostPositiveRelValue === 0) {
							// There are definitely no positive stacks.
							positiveHeight = 0;
						}
						else {
							// There are both positive and negative stacks.
							positiveHeight *= mostPositiveRelValue / (mostPositiveRelValue - mostNegativeRelValue);
						}
					}

					// Negative columns start below the zero line.
					const negativeOffset = positiveHeight + 1;

					let chartWidth = 0;
					const points = from<
						[ G, [ Record, Record ] ],
						StackedColumnPoint<G, T>
					>(stacks.entries(), (entry, index) => {
						const [ stack, signed ] = <[ G, [ Record, Record ] ]> entry;

						const value = signed[0].value + signed[1].value;
						const columns = signed[0].columns.concat(signed[1].columns);
						const columnPoints = signed[0].columnPoints.concat(signed[1].columnPoints);

						// Spend half the spacing ahead of each stack, and half after.
						const x1 = chartWidth;
						// Assume each column's displayWidth is indeed the columnWidth
						const x2 = x1 + columnWidth + columnSpacing;
						chartWidth = x2;

						let maxY2 = 0;
						let minY1 = Infinity;

						for (const { columnPoints, isNegative, relativeValue } of signed) {
							if (columnPoints.length === 0) {
								continue;
							}

							const availableHeight = isNegative ? positiveHeight - columnHeight : positiveHeight;
							const correction = isNegative ? negativeStackHeightCorrection : positiveStackHeightCorrection;
							const stackHeight = availableHeight * relativeValue * correction;

							let prev = { displayHeight: 0, y1: positiveHeight, y2: negativeOffset };
							const [ firstPoint ] = columnPoints;
							for (const point of columnPoints) {
								// Ensure each column within the stack has the correct size relative to the other
								// columns.
								let displayHeight = stackHeight * point.datum.relativeValue / relativeValue;
								// Place above/below the previous column.
								let y2 = isNegative ? prev.y2 + displayHeight : prev.y1;
								let y1 = isNegative ? prev.y2 : y2 - displayHeight;

								// Column spacing eats into the height of the column farthest from the zero line.
								// TODO: Support spacing around the zero line? Would need to track whether there was
								// a negative stack, and the first point in that stack (issue #8).
								if (point !== firstPoint) {
									displayHeight -= stackSpacing;
									if (isNegative) {
										y1 += stackSpacing;
									}
									else {
										y2 -= stackSpacing;
									}
								}

								if (y1 < minY1) {
									minY1 = y1;
								}
								if (y2 > maxY2) {
									maxY2 = y2;
								}

								assign(point, {
									displayHeight,
									x1,
									x2,
									y1,
									y2
								});

								prev = point;
							}
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
							y1: minY1,
							y2: maxY2
						};
					});

					return {
						height,
						horizontalValues,
						points,
						verticalValues,
						width,
						zero: { x: zero.x, y: positiveHeight }
					};
				}
			},

			around: {
				renderPlotPoints<G, T>(renderColumns: (points: ColumnPoint<T>[]) => VNode[]) {
					return function(this: any, stackPoints: StackedColumnPoint<G, T>[]) {
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
		initialize<G, T>(
			instance: StackedColumnChart<G, T, StackedColumn<G, T>, StackedColumnChartState<T>>,
			{
				stackSelector,
				stackSpacing = 0
			}: StackedColumnChartOptions<G, T, StackedColumn<G, T>, StackedColumnChartState<T>> = {}
		) {
			if (!stackSelector) {
				// Ignore instance.stackSelector being undefined, let the runtime throw an exception instead.
				stackSelector = (input: T) => instance.stackSelector!(input);
			}

			stackSelectors.set(instance, stackSelector);
			shadowStackSpacings.set(instance, stackSpacing);
		}
	});

export default createStackedColumnChart;
