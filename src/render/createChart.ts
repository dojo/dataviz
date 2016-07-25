import { ComposeFactory } from 'dojo-compose/compose';
import { assign } from 'dojo-core/lang';
import createWidget, { Widget, WidgetOptions, WidgetState } from 'dojo-widgets/createWidget';
import { VNode, VNodeProperties } from 'maquette/maquette';

import { Chartable } from './interfaces';
import createSvgRootMixin, { SvgRoot, SvgRootOptions, SvgRootState } from './mixins/createSvgRootMixin';

export type ChartState<T> = WidgetState & SvgRootState;

export type ChartOptions<T, S extends ChartState<T>> = WidgetOptions<S> & SvgRootOptions<S>;

export interface ChartMixin {
	getChildrenNodes(): VNode[];
}

export type Chart<T, S extends ChartState<T>> = Widget<S> & SvgRoot<S> & Chartable & ChartMixin;

export interface ChartFactory<T> extends ComposeFactory<
	Chart<T, ChartState<T>>,
	ChartOptions<T, ChartState<T>>
> {
	<T, S extends ChartState<T>>(options?: ChartOptions<T, S>): Chart<T, S>;
}

const createChart: ChartFactory<any> = createWidget
	.mixin(createSvgRootMixin)
	.mixin({
		aspectAdvice: {
			before: {
				getNodeAttributes(overrides?: VNodeProperties): VNodeProperties[] {
					const chart: Chart<any, ChartState<any>> = this;
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
