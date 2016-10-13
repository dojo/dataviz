import { ComposeFactory } from 'dojo-compose/compose';
import createStateful, { State, Stateful, StatefulOptions } from 'dojo-compose/mixins/createStateful';
import { VNodeProperties } from 'maquette';

import { Invalidatable } from '../interfaces';

export interface SvgRootState extends State {
	/**
	 * Controls the height of the <svg> element.
	 */
	height?: number;

	/**
	 * Controls the width of the <svg> element.
	 */
	width?: number;
}

export type SvgRootOptions<S extends SvgRootState> = StatefulOptions<S>;

export interface SvgRootMixin {
	/**
	 * Default value for `getHeight(), in case `height` is not present in the state.
	 *
	 * If not provided, the default value that ends up being used is 150.
	 */
	readonly height?: number;
	/**
	 * Default value for `getWidth(), in case `width` is not present in the state.
	 *
	 * If not provided, the default value that ends up being used is 300.
	 */
	readonly width?: number;

	/**
	 * The tagName is *always* 'svg'.
	 */
	readonly tagName: string;

	/**
	 * Controls the height of the <svg> element.
	 */
	getHeight(): number;

	/**
	 * Controls the width of the <svg> element.
	 */
	getWidth(): number;
}

/**
 * Renders a root <svg> VNode. To be mixed into dojo-widgets/createWidget.
 */
export type SvgRoot<S extends SvgRootState> = Stateful<S> & Invalidatable & SvgRootMixin;

export type SvgRootFactory = ComposeFactory<SvgRoot<SvgRootState>, SvgRootOptions<SvgRootState>>;

const createSvgRootMixin: SvgRootFactory = createStateful
	.extend({
		getHeight(this: SvgRoot<SvgRootState>) {
			const { height = this.height || 150 } = this.state;
			return height;
		},

		get tagName() {
			return 'svg';
		},

		// Other mixins may not realize they shouldn't be setting tagName.
		set tagName(noop) {},

		getWidth(this: SvgRoot<SvgRootState>) {
			const { width = this.width || 300 } = this.state;
			return width;
		},

		nodeAttributes: [
			function(this: SvgRoot<SvgRootState>): VNodeProperties {
				return {
					height: String(this.getHeight()),
					width: String(this.getWidth()),
					'shape-rendering': 'crispEdges'
				};
			}
		]
	});

export default createSvgRootMixin;
