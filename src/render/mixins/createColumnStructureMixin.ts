import compose, { ComposeFactory } from 'dojo-compose/compose';
import { Handle } from 'dojo-core/interfaces';
import WeakMap from 'dojo-shim/WeakMap';
import { h, VNode } from 'maquette/maquette';
import { Observable } from 'rxjs/Rx';

import columnar, { Column } from '../../structure/columnar';
import createDataObserverMixin, {
	DataObserver,
	DataObserverOptions,
	DataObserverState
} from './createDataObserverMixin';

export type ColumnStructureState<T> = DataObserverState<T>;

export interface ColumnStructureOptions<T, S extends ColumnStructureState<T>> extends DataObserverOptions<T, S> {
	valueSelector?: (input: T) => number;
}

export interface ColumnStructureMixin<T> {
	getChildrenNodes(): VNode[];

	valueSelector?: (input: T) => number;
}

export type ColumnStructure<T, S extends ColumnStructureState<T>> =
	DataObserver<T, S> & ColumnStructureMixin<T>;

export interface ColumnStructureFactory<T> extends ComposeFactory<
	ColumnStructure<T, ColumnStructureState<T>>,
	ColumnStructureOptions<T, ColumnStructureState<T>>
> {
	<T, S extends ColumnStructureState<T>>(options?: ColumnStructureOptions<T, S>): ColumnStructure<T, S>;
}

const structures = new WeakMap<ColumnStructure<any, ColumnStructureState<any>>, Column<any>[]>();

const createColumnStructureMixin: ColumnStructureFactory<any> = compose({
	getChildrenNodes(): VNode[] {
		const structure = structures.get(this);
		return structure.map((value, index) => {
			// TODO: Make width configurable
			// TODO: Read height from state
			const { input, relativeValue } = value;
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
}).mixin({
	mixin: createDataObserverMixin,
	initialize<T>(
		instance: ColumnStructure<T, ColumnStructureState<T>>,
		{ valueSelector }: ColumnStructureOptions<T, ColumnStructureState<T>> = {}
	) {
		if (!valueSelector) {
			valueSelector = (input: T) => {
				if (instance.valueSelector) {
					return instance.valueSelector(input);
				}
				return 0;
			};
		}

		structures.set(instance, []);

		let handle: Handle = null;
		const subscribe = (data: Observable<T[]>) => {
			if (handle) {
				handle.destroy();
			}

			const subscription = columnar(data, valueSelector)
				.subscribe((structure) => {
					structures.set(instance, structure);
					(<any> instance).invalidate();
				});

			handle = instance.own({
				destroy() {
					subscription.unsubscribe();
				}
			});
		};

		if (instance.data) {
			subscribe(instance.data);
		}
		instance.own(instance.on('datachange', ({ data }) => subscribe(data)));
	}
});

export default createColumnStructureMixin;
