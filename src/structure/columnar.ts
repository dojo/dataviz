import { Iterable } from 'dojo-shim/iterator';
import { Observable } from 'rxjs/Rx';

import relativeValues from '../data/relative-values';

export interface Column<T> {
	input: T;
	relativeValue: number;
	value: number;
}

export type InputObservable<T> = Observable<Iterable<T> | ArrayLike<T>>;
export type ValueSelector<T> = (input: T) => number;
export type DivisorOperator<T> =
	(observable: InputObservable<T>, valueSelector: ValueSelector<T>) => Observable<number>;

export default function columnar<T> (
	observable: InputObservable<T>,
	valueSelector: ValueSelector<T>,
	divisorOperator: DivisorOperator<T>
): Observable<Column<T>[]> {
	const shared = observable.share();
	const divisors = divisorOperator(shared, valueSelector);
	return relativeValues(shared, valueSelector, divisors)
		.map((inputsAndRelativeValues) => {
			return inputsAndRelativeValues.map(([input, relativeValue]) => {
				const value = valueSelector(input);
				return { input, relativeValue, value };
			});
		});
}
