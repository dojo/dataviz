import { ComposeFactory } from 'dojo-compose/compose';
import { h, VNode } from 'maquette/maquette';

import { Datum } from '../data/interfaces';

import createChart, { Chart, ChartOptions, ChartState } from './createChart';
import createAxes, { Axes, AxesOptions } from './mixins/createAxesMixin';
import createColumnPlot, {
	Column,
	ColumnPoint,
	ColumnPlot,
	ColumnPlotOptions,
	ColumnPlotState
} from './mixins/createColumnPlotMixin';

export { Column, ColumnPoint }

export type ColumnChartState<T, D> = ChartState & ColumnPlotState<T>;

export type ColumnChartOptions<T, D, S extends ColumnChartState<T, D>> = ChartOptions<S> & ColumnPlotOptions<T, S> & AxesOptions<D>;

export type ColumnChart<T, D extends Datum<any>, S extends ColumnChartState<T, D>> = Chart<S> & ColumnPlot<T, S> & Axes<D>;

export interface ColumnChartFactory<T> extends ComposeFactory<
	ColumnChart<T, Column<T>, ColumnChartState<T, Column<T>>>,
	ColumnChartOptions<T, Column<T>, ColumnChartState<T, Column<T>>>
> {
	<T, D extends Column<T>, S extends ColumnChartState<T, D>>(options?: ColumnChartOptions<T, D, S>): ColumnChart<T, D, S>;
}

export interface GenericColumnChartFactory<T> extends ComposeFactory<
	ColumnChart<T, Datum<any>, ColumnChartState<T, Datum<any>>>,
	ColumnChartOptions<T, Datum<any>, ColumnChartState<T, Datum<any>>>
> {
	<T, D extends Datum<any>, S extends ColumnChartState<T, D>>(options?: ColumnChartOptions<T, D, S>): ColumnChart<T, D, S>;
}

// Cast to a generic factory so subclasses can modify the datum type.
// The factory should be casted to ColumnChartFactory when creating a column chart.
const createColumnChart: GenericColumnChartFactory<any> = createChart
	.mixin(createAxes)
	.mixin(createColumnPlot)
	.extend({
		getChildrenNodes(): VNode[] {
			const chart: ColumnChart<any, any, any> = this;
			const plot = chart.plot();
			if (plot.length === 0) {
				return [];
			}

			const { domainMax, xInset, yInset } = chart;

			const nodes: VNode[] = [];

			let x2 = Math.max(...plot.map(({ x2 }) => x2));
			let y2 = Math.max(...plot.map(({ y2 }) => y2));
			const axes = chart.createAxes(plot, domainMax, x2, y2);
			x2 += axes.extraWidth;
			y2 += axes.extraHeight;

			if (axes.bottom) {
				nodes.push(h('g', {
					key: 'bottom-axis',
					transform: `translate(${xInset} ${yInset + y2})`
				}, axes.bottom));
			}
			if (axes.left) {
				nodes.push(h('g', {
					key: 'left-axis',
					transform: `translate(${xInset + 1} ${yInset + axes.extraHeight})`
				}, axes.left));
			}
			if (axes.right) {
				nodes.push(h('g', {
					key: 'right-axis',
					transform: `translate(${xInset + x2} ${yInset + axes.extraHeight})`
				}, axes.right));
			}
			if (axes.top) {
				nodes.push(h('g', {
					key: 'top-axis',
					transform: `translate(${xInset} ${yInset})`
				}, axes.top));
			}

			nodes.push(h('g', {
				key: 'plot',
				'transform': `translate(${xInset} ${yInset + axes.extraHeight})`
			}, chart.renderPlot(plot)));

			return nodes;
		}
	});

export default createColumnChart;
