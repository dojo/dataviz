import { Observable } from 'rxjs/Rx';
import WeakMap from 'dojo-shim/WeakMap';

function defaultCompare (a: any, b: any): number {
	const strA = String(a);
	const strB = String(b);
	return strA < strB && -1 || strA > strB && 1 || 0;
}

function identity<T> (value: T): T {
	return value;
}

export default function sort<T> (
	observable: Observable<T[]>,
	comparableSelector: (input: T) => any = identity,
	compareFunction: (a: any, b: any) => number = defaultCompare
): Observable<T[]> {
	const comparables = new WeakMap<T, any>();

	return observable.map(arr => {
		const result = arr.slice();
		result.sort((inputA, inputB) => {
			if (!comparables.has(inputA)) {
				comparables.set(inputA, comparableSelector(inputA));
			}
			if (!comparables.has(inputB)) {
				comparables.set(inputB, comparableSelector(inputB));
			}
			return compareFunction(comparables.get(inputA), comparables.get(inputB));
		});
		return result;
	});
};
