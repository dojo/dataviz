import createEvented from 'dojo-compose/mixins/createEvented';
import createWidget from 'dojo-widgets/createWidget';
import { h, VNode } from 'maquette/maquette';
import { Observable, Subscriber } from 'rxjs/Rx';

import columnar from 'src/structure/columnar';

const createColumnChart = createWidget
	.extend({
		tagName: 'svg',

		getChildrenNodes(): VNode[] {
			return this.columns.map(({ input, relativeValue }: any, index: number) => {
				const height = relativeValue * 100;
				const y = 100 - height;
				return h('g', { key: input }, [
					h('rect', {
						width: '20',
						height: String(height),
						x: String(20 * index),
						y: String(y)
					})
				]);
			});
		}
	})
	.mixin({
		mixin: createEvented,
		initialize(instance: any) {
			const source = new Observable<any>((subscriber: Subscriber<any>) => {
				// FIXME: Type evt.state
				instance.own(instance.on('statechange', (evt: any) => {
					subscriber.next(evt.state.items || []);
				}));

				// subscriber.next(instance.state.items || []);
			});

			// FIXME: Make configurable
			const valueSelector = (item: any) => item.count;
			const subscription = columnar(source, valueSelector)
				.subscribe((columns) => {
					instance.columns = columns;
					instance.invalidate();
				});

			instance.own({
				destroy() {
					subscription.unsubscribe();
				}
			});
		}
	});

export default createColumnChart;
