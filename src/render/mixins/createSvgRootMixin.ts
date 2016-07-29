import createStateful, { State, Stateful, StatefulOptions } from 'dojo-compose/mixins/createStateful';
import WeakMap from 'dojo-shim/WeakMap';
import { VNodeProperties } from 'maquette/maquette';

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

export interface SvgRootOptions<S extends SvgRootState> extends StatefulOptions<S> {
	/**
	 * Controls the height of the <svg> element. Defaults to 150.
	 */
	height?: number;

	/**
	 * Controls the width of the <svg> element. Defaults to 300.
	 */
	width?: number;
}

export interface SvgRootMixin {
	/**
	 * Controls the height of the <svg> element.
	 */
	height?: number;

	/**
	 * The tagName is *always* 'svg'.
	 */
	tagName: string;

	/**
	 * Controls the width of the <svg> element.
	 */
	width?: number;

	/**
	 * Get attributes that should be used to create the root VNode.
	 */
	getRootAttributes(): VNodeProperties;
}

/**
 * Renders a root <svg> VNode. To be mixed into dojo-widgets/createWidget.
 */
export type SvgRoot<S extends SvgRootState> = Stateful<S> & Invalidatable & SvgRootMixin;

const shadowHeights = new WeakMap<SvgRoot<SvgRootState>, number>();
const shadowWidths = new WeakMap<SvgRoot<SvgRootState>, number>();

const createSvgRootMixin = createStateful
	.mixin({
		mixin: <SvgRootMixin> {
			get height() {
				const root: SvgRoot<SvgRootState> = this;
				const { height = shadowHeights.get(root) } = root.state || {};
				return height;
			},

			set height(height) {
				const root: SvgRoot<SvgRootState> = this;
				if (root.state) {
					root.setState({ height });
				}
				else {
					shadowHeights.set(root, height);
					root.invalidate();
				}
			},

			get tagName() {
				return 'svg';
			},

			set tagName(noop) {},

			get width() {
				const root: SvgRoot<SvgRootState> = this;
				const { width = shadowWidths.get(root) } = root.state || {};
				return width;
			},

			set width(width) {
				const root: SvgRoot<SvgRootState> = this;
				if (root.state) {
					root.setState({ width });
				}
				else {
					shadowWidths.set(root, width);
					root.invalidate();
				}
			},

			getRootAttributes(): VNodeProperties {
				const root: SvgRoot<SvgRootState> = this;
				// TODO: Move defaults into height/weight getters on root.
				const { height, width } = root;
				return {
					height: String(height),
					width: String(width),
					'shape-rendering': 'crispEdges'
				};
			}
		},

		initialize(instance: SvgRoot<SvgRootState>, { height = 150, width = 300 }: SvgRootOptions<SvgRootState> = {}) {
			shadowHeights.set(instance, height);
			shadowWidths.set(instance, width);
		}
	});

export default createSvgRootMixin;
