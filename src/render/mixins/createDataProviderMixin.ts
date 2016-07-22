import { ComposeFactory } from 'dojo-compose/compose';
import createEvented, { EventedListener, TargettedEventObject } from 'dojo-compose/mixins/createEvented';
import createStateful, { State, Stateful, StatefulOptions } from 'dojo-compose/mixins/createStateful';
import { Handle } from 'dojo-core/interfaces';
import { from } from 'dojo-shim/array';
import { isArrayLike, isIterable, Iterable } from 'dojo-shim/iterator';
import WeakMap from 'dojo-shim/WeakMap';
import { Observable, Subscriber } from 'rxjs/Rx';

export interface DataProviderState<T> extends State {
	/**
	 * Data for the observable. Can only be a POJO, so just an array in this case.
	 */
	data?: T[];
}

export interface DataProviderOptions<T, S extends DataProviderState<T>> extends StatefulOptions<S> {
	/**
	 * Data for the observable. If an Iterable or ArrayLike the observable is completed after emitting the first value.
	 * Otherwise the observable *is* the data.
	 */
	data?: Iterable<T> | ArrayLike<T> | Observable<T[]>;
}

export interface DataProviderMixin<T> {
	/**
	 * Provides the current observable, if any.
	 */
	data?: Observable<T[]>;
}

/**
 * Event that is emitted when the observable changes.
 */
export interface DataChangeEvent<T> extends TargettedEventObject {
	/**
	 * The new observable.
	 */
	data: Observable<T[]>;
}

export interface DataProviderOverrides<T> {
	/**
	 * Emitted when the observable changes.
	 */
	on(type: 'datachange', listener: EventedListener<DataChangeEvent<T>>): Handle;
	on(type: string, listener: EventedListener<TargettedEventObject>): Handle;
}

/**
 * Provides an observable for the data, based on state or initializer options.
 */
export type DataProvider<T, S extends DataProviderState<T>> =
	Stateful<S> & DataProviderMixin<T> & DataProviderOverrides<T>;

export interface DataProviderFactory<T> extends ComposeFactory<
	DataProvider<T, DataProviderState<T>>,
	DataProviderOptions<T, DataProviderState<T>>
> {
	<T, S extends DataProviderState<T>>(options?: DataProviderOptions<T, S>): DataProvider<T, S>;
}

const observables = new WeakMap<DataProvider<any, DataProviderState<any>>, Observable<any[]>>();

const createDataProviderMixin: DataProviderFactory<any> = createStateful
	.extend({
		get data() {
			return observables.get(this);
		}
	})
	.mixin({
		mixin: createEvented,
		initialize<T>(instance: DataProvider<T, DataProviderState<T>>, { data }: DataProviderOptions<T, DataProviderState<T>> = {}) {
			if (data) {
				// Create an observable if the data option was provided.
				let observable: Observable<T[]> = isArrayLike(data) || isIterable(data) ? Observable.from([from(data)]) : data;
				observables.set(instance, observable);
				instance.emit({
					type: 'datachange',
					data: observable,
					target: instance
				});
			}

			let managingObservable = false;
			let managedSubscriber: Subscriber<T[]> = null;
			let latestValue: T[] = null;

			// Observe the instance state. It overrides any data option.
			instance.own(instance.on('statechange', (evt) => {
				let { state: { data } } = evt;

				// No action if the state did not contain data and no observable is yet being managed.
				if (!data && !managingObservable) {
					return;
				}

				// Ensure at least an empty array.
				if (!data) {
					data = [];
				}

				if (!managingObservable) {
					managingObservable = true;
					const observable = new Observable<T[]>((subscriber: Subscriber<T[]>) => {
						managedSubscriber = subscriber;
						if (latestValue) {
							subscriber.next(latestValue);
							latestValue = null;
						}
					});
					observables.set(instance, observable);
					instance.emit({
						type: 'datachange',
						data: observable,
						target: instance
					});
				}

				// Emit on the existing observable.
				if (managedSubscriber) {
					managedSubscriber.next(data);
				}
				// Cache the latest value for when the observable is subscribed to.
				else {
					latestValue = data;
				}
			}));

			instance.own({
				destroy() {
					observables.delete(instance);
				}
			});
		}
	});

export default createDataProviderMixin;
