import { Iterable } from 'dojo-shim/iterator';
import { Observable } from 'rxjs/Rx';

export type Divisor = Observable<number>;

export interface DivisorOperator<T> {
	(observable: InputObservable<T>, valueSelector: ValueSelector<T>): Divisor;
}

export type InputObservable<T> = Observable<Iterable<T> | ArrayLike<T>>;

export type ValueSelector<T> = (input: T) => number;
