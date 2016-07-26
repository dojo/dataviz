import { ComposeFactory } from 'dojo-compose/compose';
import { assign } from 'dojo-core/lang';
import createWidget, { Widget, WidgetOptions, WidgetState } from 'dojo-widgets/createWidget';
import WeakMap from 'dojo-shim/WeakMap';
import { VNode, VNodeProperties } from 'maquette/maquette';

import createSvgRootMixin, { SvgRoot, SvgRootOptions, SvgRootState } from './mixins/createSvgRootMixin';

export interface ChartState extends WidgetState, SvgRootState {
	/**
	 * How many pixels from the left, within the <svg> root, the chart sthould be rendered.
	 */
	xInset?: number;

	/**
	 * How many pixels from the top, within the <svg> root, the chart sthould be rendered.
	 */
	yInset?: number;
}

export interface ChartOptions<S extends ChartState> extends WidgetOptions<S>, SvgRootOptions<S> {
	/**
	 * How many pixels from the left, within the <svg> root, the chart sthould be rendered.
	 */
	xInset?: number;

	/**
	 * How many pixels from the top, within the <svg> root, the chart sthould be rendered.
	 */
	yInset?: number;
}

export interface ChartMixin {
	/**
	 * How many pixels from the left, within the <svg> root, the chart sthould be rendered.
	 *
	 * Defaults to 0.
	 */
	xInset: number;

	/**
	 * How many pixels from the top, within the <svg> root, the chart sthould be rendered.
	 *
	 * Defaults to 0.
	 */
	yInset: number;

	getChildrenNodes(): VNode[];
}

export type Chart<S extends ChartState> = Widget<S> & SvgRoot<S> & ChartMixin;

export interface ChartFactory extends ComposeFactory<
	Chart<ChartState>,
	ChartOptions<ChartState>
> {
	<S extends ChartState>(options?: ChartOptions<S>): Chart<S>;
}

const shadowXInsets = new WeakMap<Chart<ChartState>, number>();
const shadowYInsets = new WeakMap<Chart<ChartState>, number>();

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

		mixin: <ChartMixin> {
			get xInset() {
				const chart: Chart<ChartState> = this;
				const { xInset = shadowXInsets.get(chart) } = chart.state || {};
				return xInset;
			},

			set xInset(xInset) {
				const chart: Chart<ChartState> = this;
				if (chart.state) {
					chart.setState({ xInset });
				}
				else {
					shadowXInsets.set(chart, xInset);
				}
			},

			get yInset() {
				const chart: Chart<ChartState> = this;
				const { yInset = shadowYInsets.get(chart) } = chart.state || {};
				return yInset;
			},

			set yInset(yInset) {
				const chart: Chart<ChartState> = this;
				if (chart.state) {
					chart.setState({ yInset });
				}
				else {
					shadowYInsets.set(chart, yInset);
				}
			},

			getChildrenNodes(): VNode[] {
				// Subclasses must override.
				return [];
			}
		},

		initialize(
			instance: Chart<ChartState>,
			{ xInset = 0, yInset = 0 }: ChartOptions<ChartState> = {}
		) {
			shadowXInsets.set(instance, xInset);
			shadowYInsets.set(instance, yInset);
			instance.own({
				destroy() {
					shadowXInsets.delete(instance);
					shadowYInsets.delete(instance);
				}
			});
		}
	});

export default createChart;
