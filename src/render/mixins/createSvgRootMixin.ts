import createStateful, { State, Stateful, StatefulOptions } from 'dojo-compose/mixins/createStateful';
import { assign } from 'dojo-core/lang';
import createWidget from 'dojo-widgets/createWidget';
import { VNodeProperties } from 'maquette/maquette';

export interface SvgRootState extends State {
	height?: number;
	width?: number;
}

export type SvgRootOptions<S extends SvgRootState> = StatefulOptions<S>;

export interface SvgRootMixin {
	readonly tagName: string;
	getNodeAttributes(overrides?: VNodeProperties): VNodeProperties;

	// TODO: Add getters and setters for height and width, shadowing state, like styles in createCachedRenderMixin.
}

export type SvgRoot<S extends SvgRootState> = Stateful<S> & SvgRootMixin;

const createSvgRootMixin = createStateful
	.extend({
		get tagName() {
			return 'svg';
		},

		set tagName(_) {
			// FIXME: Throw instead?
		},

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
