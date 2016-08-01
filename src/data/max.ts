import { forOf } from 'dojo-shim/iterator';

import { DivisorOperator, InputObservable, ValueSelector } from './interfaces';

function max<T> (observable: InputObservable<T>, valueSelector: ValueSelector<T>) {
	return observable.map((inputs) => {
		let max = 0;
		forOf(inputs, (input) => {
			// FIXME: Handle Infinity?
			const value = Math.abs(valueSelector(input)) || 0;
			if (value > max) {
				max = value;
			}
		});
		return max;
	});
}

export default max as DivisorOperator<any>;
