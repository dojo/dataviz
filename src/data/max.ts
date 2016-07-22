import { forOf, Iterable } from 'dojo-shim/iterator';
import { Observable } from 'rxjs/Rx';

export default function max<T> (
	observable: Observable<Iterable<T> | ArrayLike<T>>,
	valueSelector: (input: T) => number
): Observable<number> {
	return observable.map((inputs) => {
		let max = 0;
		forOf(inputs, (input) => {
			// FIXME: Handle Infinity and -Infinity?
			const value = valueSelector(input) || 0;
			// TODO: Operate on negative input values.
			if (value > max) {
				max = value;
			}
		});
		return max;
	});
}
