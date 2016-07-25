import { forOf } from 'dojo-shim/iterator';

import { DivisorOperator, InputObservable, ValueSelector } from './interfaces';

function sum<T> (observable: InputObservable<T>, valueSelector: ValueSelector<T>) {
	return observable.map((inputs) => {
		let sum = 0;
		forOf(inputs, (input) => {
			// FIXME: Handle Infinity and -Infinity?
			sum += valueSelector(input) || 0;
		});
		return sum;
	});
}
export default sum as DivisorOperator<any>;
