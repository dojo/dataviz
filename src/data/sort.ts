import { forOf } from 'dojo-shim/iterator';
import WeakMap from 'dojo-shim/WeakMap';
import { Observable } from 'rxjs/Rx';

import { InputObservable } from './interfaces';

function defaultCompare(a: any, b: any): number {
	const strA = String(a);
	const strB = String(b);
	return strA < strB && -1 || strA > strB && 1 || 0;
}

function identity<T>(value: T): T {
	return value;
}

export default function sort<T>(
	observable: InputObservable<T>,
	comparableSelector: (input: T) => any = identity,
	compareFunction: (a: any, b: any) => number = defaultCompare
): Observable<T[]> {
	const comparables = new WeakMap<T, any>();

	return observable.map(inputs => {
		const result: T[] = [];
		forOf(inputs, (input) => {
			if (!comparables.has(input)) {
				comparables.set(input, comparableSelector(input));
			}
			result.push(input);
		});
		result.sort((inputA, inputB) => {
			return compareFunction(comparables.get(inputA), comparables.get(inputB));
		});
		return result;
	});
};
