import { ComposeFactory } from 'dojo-compose/compose';
import createWidget, { Widget, WidgetOptions, WidgetState } from 'dojo-widgets/createWidget';

import createSvgRootMixin, { SvgRoot, SvgRootOptions, SvgRootState } from './mixins/createSvgRootMixin';
import createColumnStructureMixin, {
	ColumnStructure,
	ColumnStructureOptions,
	ColumnStructureState
} from './mixins/createColumnStructureMixin';

export type ColumnChartState<T> =
	WidgetState & SvgRootState & ColumnStructureState<T>;

export type ColumnChartOptions<T, S extends ColumnChartState<T>> =
	WidgetOptions<S> & SvgRootOptions<S> & ColumnStructureOptions<T, S>;

export type ColumnChart<T, S extends ColumnChartState<T>> =
	Widget<S> & SvgRoot<S> & ColumnStructure<T, S>;

export interface ColumnChartFactory<T> extends ComposeFactory<
	ColumnChart<T, ColumnChartState<T>>,
	ColumnChartOptions<T, ColumnChartState<T>>
> {
	<T, S extends ColumnChartState<T>>(options?: ColumnChartOptions<T, S>): ColumnChart<T, S>;
}

const createColumnChart: ColumnChartFactory<any> = createWidget
	.mixin(createSvgRootMixin)
	.mixin(createColumnStructureMixin);

export default createColumnChart;
