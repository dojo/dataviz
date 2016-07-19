import { forOf, Iterable } from 'dojo-shim/iterator';
import { Observable } from 'rxjs/Rx';

export default function sumAndWeigh<T> (
	observable: Observable<Iterable<T> | ArrayLike<T>>,
	valueSelector: (input: T) => number
): Observable<[T, number][]> {
	return observable.map((inputs) => {
		const arr: T[] = [];
		const values: number[] = [];
		let sum = 0;
		forOf(inputs, (input) => {
			arr.push(input);

			// FIXME: Handle Infinity and -Infinity?
			const value = valueSelector(input) || 0;
			values.push(value);
			sum += value;
		});

		return arr.map<[T, number]>((input, index) => [input, values[index] / sum]);
	});
};
