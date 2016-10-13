import { ComposeFactory } from 'dojo-compose/compose';
import createWidget, { Widget, WidgetOptions, WidgetState } from 'dojo-widgets/createWidget';
import WeakMap from 'dojo-shim/WeakMap';
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

export type ChartOptions<S extends ChartState> = WidgetOptions<S> & SvgRootOptions<S> & {
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

interface PrivateState {
	xInset: number;
	yInset: number;
}

const privateStateMap = new WeakMap<Chart<ChartState>, PrivateState>();

const createChart: ChartFactory = createWidget
	.mixin(createSvgRootMixin)
	.extend({
		get xInset(this: Chart<ChartState>) {
			const { xInset = privateStateMap.get(this).xInset } = this.state || {};
			return xInset;
		},

		set xInset(xInset) {
			if (this.state) {
				this.setState({ xInset });
			}
			else {
				privateStateMap.get(this).xInset = xInset;
			}
		},

		get yInset(this: Chart<ChartState>) {
			const { yInset = privateStateMap.get(this).yInset } = this.state || {};
			return yInset;
		},

		set yInset(yInset) {
			if (this.state) {
				this.setState({ yInset });
			}
			else {
				privateStateMap.get(this).yInset = yInset;
			}
		},

		getChildrenNodes(): VNode[] {
			// Subclasses must override.
			return [];
		}
	})
	.mixin({
		initialize(instance: Chart<ChartState>, { xInset = 0, yInset = 0 }: ChartOptions<ChartState> = {}) {
			privateStateMap.set(instance, { xInset, yInset });
		}
	});

export default createChart;
