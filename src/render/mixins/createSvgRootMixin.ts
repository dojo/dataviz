import { ComposeFactory } from 'dojo-compose/compose';
import createStateful, { State, Stateful, StatefulOptions } from 'dojo-compose/mixins/createStateful';
import WeakMap from 'dojo-shim/WeakMap';
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

export type SvgRootFactory = ComposeFactory<SvgRoot<SvgRootState>, SvgRootOptions<SvgRootState>>;

const shadowHeights = new WeakMap<SvgRoot<SvgRootState>, number>();
const shadowWidths = new WeakMap<SvgRoot<SvgRootState>, number>();

const createSvgRootMixin: SvgRootFactory = createStateful
	.mixin({
		mixin: <SvgRootMixin> {
			get height(this: SvgRoot<SvgRootState>) {
				const { height = shadowHeights.get(this) } = this.state || {};
				return height;
			},

			set height(height) {
				if (this.state) {
					this.setState({ height });
				}
				else {
					shadowHeights.set(this, height);
					// invalidate() is typed as being optional, but that's just a workaround until
					// <https://github.com/dojo/compose/issues/74> is in place. Silence the strict null check violation
					// for now.
					this.invalidate!();
				}
			},

			get tagName() {
				return 'svg';
			},

			set tagName(noop) {},

			get width(this: SvgRoot<SvgRootState>) {
				const { width = shadowWidths.get(this) } = this.state || {};
				return width;
			},

			set width(width) {
				if (this.state) {
					this.setState({ width });
				}
				else {
					shadowWidths.set(this, width);
					// invalidate() is typed as being optional, but that's just a workaround until
					// <https://github.com/dojo/compose/issues/74> is in place. Silence the strict null check violation
					// for now.
					this.invalidate!();
				}
			},

			getRootAttributes(this: SvgRoot<SvgRootState>): VNodeProperties {
				const { height, width } = this;
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
