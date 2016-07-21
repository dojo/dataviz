import createStateful, { State, Stateful, StatefulOptions } from 'dojo-compose/mixins/createStateful';
import { assign } from 'dojo-core/lang';
import WeakMap from 'dojo-shim/WeakMap';
import createWidget from 'dojo-widgets/createWidget';
import { VNodeProperties } from 'maquette/maquette';

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
	readonly tagName: string;

	/**
	 * Controls the width of the <svg> element.
	 */
	width?: number;

	getNodeAttributes(overrides?: VNodeProperties): VNodeProperties;
}

/**
 * Renders a root <svg> VNode. To be mixed into dojo-widgets/createWidget.
 */
export type SvgRoot<S extends SvgRootState> = Stateful<S> & SvgRootMixin;

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
					// Assume this is mixed in to dojo-widgets/createWidget, in which case invalidate() is available.
					(<any> root).invalidate();
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
					// Assume this is mixed in to dojo-widgets/createWidget, in which case invalidate() is available.
					(<any> root).invalidate();
				}
			},

			// Assuming this is mixed in to dojo-widgets/createWidget, replace the getNodeAttributes() implementation
			// from its prototype in order to render the <svg> root with the height and width attributes.
			getNodeAttributes(overrides?: VNodeProperties): VNodeProperties {
				const root: SvgRoot<SvgRootState> = this;
				// TODO: Move defaults into height/weight getters on root.
				const { height, width } = root;
				const props = assign({
					height: String(height),
					width: String(width)
				}, overrides);
				return createWidget.prototype.getNodeAttributes.call(root, props);
			}
		},
		initialize(instance: SvgRoot<SvgRootState>, { height = 150, width = 300 }: SvgRootOptions<SvgRootState> = {}) {
			shadowHeights.set(instance, height);
			shadowWidths.set(instance, width);
		}
	});

export default createSvgRootMixin;
