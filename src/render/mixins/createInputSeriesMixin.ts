import { ComposeFactory } from 'dojo-compose/compose';
import createEvented, { EventedListener, TargettedEventObject } from 'dojo-compose/mixins/createEvented';
import createStateful, { State, Stateful, StatefulOptions } from 'dojo-compose/mixins/createStateful';
import { Handle } from 'dojo-core/interfaces';
import { from } from 'dojo-shim/array';
import { isArrayLike, isIterable, Iterable } from 'dojo-shim/iterator';
import WeakMap from 'dojo-shim/WeakMap';
import { Observable, Subscriber } from 'rxjs/Rx';

export interface InputSeriesState<T> extends State {
	/**
	 * A single series of input data for the observable.
	 *
	 * Can only be a POJO, so just an array in this case.
	 */
	inputSeries?: T[];
}

export interface InputSeriesOptions<T, S extends InputSeriesState<T>> extends StatefulOptions<S> {
	/**
	 * Input data for the observable.
	 *
	 * If an Iterable or ArrayLike this represents a single series. The observable is completed after emitting the first
	 * (series) value.
	 *
	 * Otherwise the observable must provide one or more series.
	 */
	inputSeries?: Iterable<T> | ArrayLike<T> | Observable<T[]>;
}

export interface InputSeriesMixin<T> {
	/**
	 * Provides the current observable, if any.
	 */
	inputSeries?: Observable<T[]>;
}

/**
 * Event that is emitted when the observable changes.
 */
export interface InputSeriesChangeEvent<T> extends TargettedEventObject {
	/**
	 * The new observable.
	 */
	observable: Observable<T[]>;
}

export interface InputSeriesOverrides<T> {
	/**
	 * Emitted when the observable is replaced.
	 */
	on(type: 'inputserieschange', listener: EventedListener<InputSeriesChangeEvent<T>>): Handle;
	on(type: string, listener: EventedListener<TargettedEventObject>): Handle;
}

/**
 * Provides an observable for the data, based on state or initializer options.
 */
export type InputSeries<T, S extends InputSeriesState<T>> =
	Stateful<S> & InputSeriesMixin<T> & InputSeriesOverrides<T>;

export interface InputSeriesFactory<T> extends ComposeFactory<
	InputSeries<T, InputSeriesState<T>>,
	InputSeriesOptions<T, InputSeriesState<T>>
> {
	<T, S extends InputSeriesState<T>>(options?: InputSeriesOptions<T, S>): InputSeries<T, S>;
}

const observables = new WeakMap<InputSeries<any, InputSeriesState<any>>, Observable<any[]>>();

const createInputSeries: InputSeriesFactory<any> = createStateful
	.extend({
		get inputSeries(this: InputSeries<any, InputSeriesState<any>>) {
			return observables.get(this);
		}
	})
	.mixin({
		mixin: createEvented,

		initialize<T>(instance: InputSeries<T, InputSeriesState<T>>, { inputSeries }: InputSeriesOptions<T, InputSeriesState<T>> = {}) {
			if (inputSeries) {
				// Create an observable if the data option was provided.
				let observable: Observable<T[]>;
				if (isArrayLike(inputSeries)) {
					observable = Observable.from([from(inputSeries)]);
				}
				else if (isIterable(inputSeries)) {
					// The repetition is a workaround for <https://github.com/dojo/shim/issues/9>.
					observable = Observable.from([from(inputSeries)]);
				}
				else {
					observable = inputSeries;
				}
				observables.set(instance, observable);
				instance.emit({
					type: 'inputserieschange',
					observable,
					target: instance
				});
			}

			let managingObservable = false;
			let managedSubscriber: Subscriber<T[]>;
			let latestValue: T[] | null = null;

			// Observe the instance state. It overrides any data option.
			instance.own(instance.on('statechange', (evt) => {
				let { state: { inputSeries } } = evt;

				// No action if the state did not contain data and no observable is yet being managed.
				if (!inputSeries && !managingObservable) {
					return;
				}

				// Ensure at least an empty array.
				if (!inputSeries) {
					inputSeries = [];
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
						type: 'inputserieschange',
						observable,
						target: instance
					});
				}

				// Emit on the existing observable.
				if (managedSubscriber) {
					managedSubscriber.next(inputSeries);
				}
				// Cache the latest value for when the observable is subscribed to.
				else {
					latestValue = inputSeries;
				}
			}));
		}
	});

export default createInputSeries;
