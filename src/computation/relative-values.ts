import { forOf, Iterable } from 'dojo-shim/iterator';
import { Observable } from 'rxjs/Rx';

export default function relativeValues<T> (
	observable: Observable<Iterable<T> | ArrayLike<T>>,
	sums: Observable<number>,
	valueSelector: (input: T) => number
): Observable<[T, number][]> {
	return observable
		.withLatestFrom(sums)
		.map(([inputs, sum]) => {
			const result: [T, number][] = [];
			forOf(inputs, (input) => {
				// FIXME: Handle Infinity and -Infinity?
				result.push([input, (valueSelector(input) || 0) / sum]);
			});
			return result;
		});
}
