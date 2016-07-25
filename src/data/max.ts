import { forOf } from 'dojo-shim/iterator';

import { DivisorOperator, InputObservable, ValueSelector } from './interfaces';

function max<T> (observable: InputObservable<T>, valueSelector: ValueSelector<T>) {
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

export default max as DivisorOperator<any>;
