import { forOf } from 'dojo-shim/iterator';
import { Observable } from 'rxjs/Rx';

import { Divisor, InputObservable, ValueSelector } from './interfaces';

export default function relativeValues<T> (
	observable: InputObservable<T>,
	valueSelector: ValueSelector<T>,
	divisors: Divisor
): Observable<[T, number][]> {
	return observable
		.withLatestFrom(divisors)
		.map(([inputs, divisor]) => {
			const result: [T, number][] = [];
			forOf(inputs, (input) => {
				// FIXME: Handle Infinity and -Infinity?
				result.push([input, (valueSelector(input) || 0) / divisor]);
			});
			return result;
		});
}
