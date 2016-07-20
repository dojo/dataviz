import createEvented from 'dojo-compose/mixins/createEvented';
import { ComposeFactory } from 'dojo-compose/compose';
import createStateful, { State, Stateful, StatefulOptions } from 'dojo-compose/mixins/createStateful';
import WeakMap from 'dojo-shim/WeakMap';
import { Observable, Subscriber } from 'rxjs/Rx';

export interface DataObserverState<T> extends State {
	// TODO: Support Iterables, ArrayLike, and Observers
	data?: T[];
}

export type DataObserverOptions<T, S extends DataObserverState<T>> =
	StatefulOptions<S>;

export interface DataObserverMixin<T> {
	data: Observable<T[]>;

	// TODO: Add getters and setters for data, shadowing state, like styles in createCachedRenderMixin.
}

export type DataObserver<T, S extends DataObserverState<T>> =
	Stateful<S> & DataObserverMixin<T>;

export interface DataObserverFactory<T> extends ComposeFactory<
	DataObserver<T, DataObserverState<T>>,
	DataObserverOptions<T, DataObserverState<T>>
> {
	<T, S extends DataObserverState<T>>(options?: DataObserverOptions<T, S>): DataObserver<T, S>;
}

const observables = new WeakMap<DataObserver<any, DataObserverState<any>>, Observable<any[]>>();

const createDataObserverMixin: DataObserverFactory<any> = createStateful
	.extend({
		get data() {
			return observables.get(this);
		}
	})
	.mixin({
		mixin: createEvented,
		initialize<T>(instance: DataObserver<T, DataObserverState<T>>) {
			const observable = new Observable<T[]>((subscriber: Subscriber<T[]>) => {
				instance.own(instance.on('statechange', (evt) => {
					subscriber.next(evt.state.data || []);
				}));
			});
			observables.set(instance, observable);
		}
	});

export default createDataObserverMixin;
