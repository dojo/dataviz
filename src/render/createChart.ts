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
				getNodeAttributes(this: Chart<ChartState>, overrides?: VNodeProperties): VNodeProperties[] {
					return [assign(this.getRootAttributes(), overrides)];
				}
			}
		},

		mixin: <ChartMixin> {
			get xInset(this: Chart<ChartState>) {
				const { xInset = shadowXInsets.get(this) } = this.state || {};
				return xInset;
			},

			set xInset(xInset) {
				if (this.state) {
					this.setState({ xInset });
				}
				else {
					shadowXInsets.set(this, xInset);
				}
			},

			get yInset(this: Chart<ChartState>) {
				const { yInset = shadowYInsets.get(this) } = this.state || {};
				return yInset;
			},

			set yInset(yInset) {
				if (this.state) {
					this.setState({ yInset });
				}
				else {
					shadowYInsets.set(this, yInset);
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
		}
	});

export default createChart;
