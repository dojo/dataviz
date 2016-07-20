import { forOf, Iterable } from 'dojo-shim/iterator';
import { Observable } from 'rxjs/Rx';

export default function sum<T> (
	observable: Observable<Iterable<T> | ArrayLike<T>>,
	valueSelector: (input: T) => number
): Observable<number> {
	return observable.map((inputs) => {
		let sum = 0;
		forOf(inputs, (input) => {
			// FIXME: Handle Infinity and -Infinity?
			sum += valueSelector(input) || 0;
		});
		return sum;
	});
}
