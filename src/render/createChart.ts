import { ComposeFactory } from 'dojo-compose/compose';
import { assign } from 'dojo-core/lang';
import createWidget, { Widget, WidgetOptions, WidgetState } from 'dojo-widgets/createWidget';
import { VNode, VNodeProperties } from 'maquette/maquette';

import createSvgRootMixin, { SvgRoot, SvgRootOptions, SvgRootState } from './mixins/createSvgRootMixin';

export type ChartState = WidgetState & SvgRootState;

export type ChartOptions<S extends ChartState> = WidgetOptions<S> & SvgRootOptions<S>;

export interface ChartMixin {
	getChildrenNodes(): VNode[];
}

export type Chart<S extends ChartState> = Widget<S> & SvgRoot<S> & ChartMixin;

export interface ChartFactory extends ComposeFactory<
	Chart<ChartState>,
	ChartOptions<ChartState>
> {
	<S extends ChartState>(options?: ChartOptions<S>): Chart<S>;
}

const createChart: ChartFactory = createWidget
	.mixin(createSvgRootMixin)
	.mixin({
		aspectAdvice: {
			before: {
				getNodeAttributes(overrides?: VNodeProperties): VNodeProperties[] {
					const chart: Chart<ChartState> = this;
					return [assign(chart.getRootAttributes(), overrides)];
				}
			}
		},

		mixin: {
			getChildrenNodes(): VNode[] {
				// Subclasses must override.
				return [];
			}
		}
	});

export default createChart;
