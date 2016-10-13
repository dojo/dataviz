import { ComposeFactory } from 'dojo-compose/compose';
import createWidget, { Widget, WidgetOptions, WidgetState } from 'dojo-widgets/createWidget';
import { VNode } from 'maquette';

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

export type ChartOptions<S extends ChartState> = WidgetOptions<S> & SvgRootOptions<S>;

export interface ChartMixin {
	/**
	 * Default return value for `getXInset()`, in case `xInset` is not present in the state.
	 *
	 * If not provided, the default value that ends up being used is 0.
	 */
	readonly xInset?: number;

	/**
	 * Default return value for `getYInset()`, in case `yInset` is not present in the state.
	 *
	 * If not provided, the default value that ends up being used is 0.
	 */
	readonly yInset?: number;

	/**
	 * How many pixels from the left, within the <svg> root, the chart sthould be rendered.
	 */
	getXInset(): number;

	/**
	 * How many pixels from the top, within the <svg> root, the chart sthould be rendered.
	 */
	getYInset(): number;

	getChildrenNodes(): VNode[];
}

export type Chart<S extends ChartState> = Widget<S> & SvgRoot<S> & ChartMixin;

export type ChartFactory = ComposeFactory<Chart<ChartState>, ChartOptions<ChartState>>;

const createChart: ChartFactory = createWidget
	.mixin(createSvgRootMixin)
	.extend({
		getXInset(this: Chart<ChartState>) {
			const { xInset = this.xInset || 0 } = this.state;
			return xInset;
		},

		getYInset(this: Chart<ChartState>) {
			const { xInset = this.yInset || 0 } = this.state;
			return xInset;
		},

		getChildrenNodes(): VNode[] {
			// Subclasses must override.
			return [];
		}
	});

export default createChart;
