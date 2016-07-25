import { ComposeFactory } from 'dojo-compose/compose';
import { VNode } from 'maquette/maquette';

import createChart, { Chart, ChartOptions, ChartState } from './createChart';
import createColumnStructureMixin, {
	ColumnVisualization,
	ColumnStructure,
	ColumnStructureOptions,
	ColumnStructureState
} from './mixins/createColumnStructureMixin';

export { ColumnVisualization }

export type ColumnChartState<T> = ChartState<T> & ColumnStructureState<T>;

export type ColumnChartOptions<T, S extends ColumnChartState<T>> = ChartOptions<T, S> & ColumnStructureOptions<T, S>;

export type ColumnChart<T, S extends ColumnChartState<T>> = Chart<T, S> & ColumnStructure<T, S>;

export interface ColumnChartFactory<T> extends ComposeFactory<
	ColumnChart<T, ColumnChartState<T>>,
	ColumnChartOptions<T, ColumnChartState<T>>
> {
	<T, S extends ColumnChartState<T>>(options?: ColumnChartOptions<T, S>): ColumnChart<T, S>;
}

const createColumnChart: ColumnChartFactory<any> = createChart
	.mixin(createColumnStructureMixin)
	.extend({
		getChildrenNodes(): VNode[] {
			const chart: ColumnChart<any, ColumnChartState<any>> = this;
			return chart.getChartNodes();
		}
	});

export default createColumnChart;
