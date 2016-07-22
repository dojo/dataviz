import { forOf, Iterable } from 'dojo-shim/iterator';
import { Observable } from 'rxjs/Rx';

export default function relativeValues<T> (
	observable: Observable<Iterable<T> | ArrayLike<T>>,
	valueSelector: (input: T) => number,
	divisors: Observable<number>
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
