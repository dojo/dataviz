import { Iterable } from 'dojo-shim/iterator';
import { Observable } from 'rxjs/Rx';

import relativeValues from '../data/relative-values';
import sum from '../data/sum';

export interface Column<T> {
	input: T;
	relativeValue: number;
	value: number;
}

export default function columnar<T> (
	observable: Observable<Iterable<T> | ArrayLike<T>>,
	valueSelector: (input: T) => number
): Observable<Column<T>[]> {
	const shared = observable.share();
	const summation = sum(shared, valueSelector);
	return relativeValues(shared, valueSelector, summation)
		.map((inputsAndRelativeValues) => {
			return inputsAndRelativeValues.map(([input, relativeValue]) => {
				const value = valueSelector(input);
				return { input, relativeValue, value };
			});
		});
}
