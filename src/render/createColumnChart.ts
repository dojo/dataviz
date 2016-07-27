import { ComposeFactory } from 'dojo-compose/compose';
import { h, VNode } from 'maquette/maquette';

import createChart, { Chart, ChartOptions, ChartState } from './createChart';
import createColumnPlot, {
	Column,
	ColumnPoint,
	ColumnPlot,
	ColumnPlotOptions,
	ColumnPlotState
} from './mixins/createColumnPlotMixin';

export { Column, ColumnPoint }

export type ColumnChartState<T> = ChartState & ColumnPlotState<T>;

export type ColumnChartOptions<T, S extends ColumnChartState<T>> = ChartOptions<S> & ColumnPlotOptions<T, S>;

export type ColumnChart<T, S extends ColumnChartState<T>> = Chart<S> & ColumnPlot<T, S>;

export interface ColumnChartFactory<T> extends ComposeFactory<
	ColumnChart<T, ColumnChartState<T>>,
	ColumnChartOptions<T, ColumnChartState<T>>
> {
	<T, S extends ColumnChartState<T>>(options?: ColumnChartOptions<T, S>): ColumnChart<T, S>;
}

const createColumnChart: ColumnChartFactory<any> = createChart
	.mixin(createColumnPlot)
	.extend({
		getChildrenNodes(): VNode[] {
			const chart: ColumnChart<any, ColumnChartState<any>> = this;
			const plot = chart.plot();
			if (plot.length === 0) {
				return [];
			}

			const { xInset, yInset } = chart;
			return [
				h('g', {
					key: 'plot',
					'transform': `translate(${xInset} ${yInset})`
				}, chart.renderPlot(plot))
			];
		}
	});

export default createColumnChart;
