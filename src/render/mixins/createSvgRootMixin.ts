import createStateful, { State, Stateful, StatefulOptions } from 'dojo-compose/mixins/createStateful';
import { assign } from 'dojo-core/lang';
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

export type SvgRootOptions<S extends SvgRootState> = StatefulOptions<S>;

export interface SvgRootMixin {
	/**
	 * The tagName is *always* 'svg'.
	 */
	readonly tagName: string;

	getNodeAttributes(overrides?: VNodeProperties): VNodeProperties;

	// TODO: Add getters and setters for height and width, shadowing state, like styles in createCachedRenderMixin.
}

/**
 * Renders a root <svg> VNode. To be mixed into dojo-widgets/createWidget.
 */
export type SvgRoot<S extends SvgRootState> = Stateful<S> & SvgRootMixin;

const createSvgRootMixin = createStateful
	.extend({
		get tagName() {
			return 'svg';
		},

		set tagName(noop) {},

		// Assuming this is mixed in to dojo-widgets/createWidget, replace the getNodeAttributes() implementation from
		// its prototype in order to render the <svg> root with the height and width attributes.
		getNodeAttributes(overrides?: VNodeProperties): VNodeProperties {
			const root: SvgRoot<SvgRootState> = this;
			// TODO: Move defaults into height/weight getters on root.
			const { height = 150, width = 300 } = root.state;
			const props = assign({
				height: String(height),
				width: String(width)
			}, overrides);
			return createWidget.prototype.getNodeAttributes.call(root, props);
		}
	});

export default createSvgRootMixin;
