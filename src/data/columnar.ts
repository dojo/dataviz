import { Observable } from 'rxjs/Rx';

import {
	Datum,
	DivisorOperator,
	InputObservable,
	ValueSelector
} from './interfaces';
import relativeValues from './relative-values';

export interface Column<T> extends Datum<T> {
	relativeValue: number;
}

export default function columnar<T> (
	observable: InputObservable<T>,
	valueSelector: ValueSelector<T>,
	divisorOperator: DivisorOperator<T>
): Observable<Column<T>[]> {
	const shared = observable.share();
	const divisors = divisorOperator(shared, valueSelector);
	return relativeValues(shared, valueSelector, divisors)
		.map((inputsAndRelativeValues) => {
			return inputsAndRelativeValues.map(([input, relativeValue]) => {
				const value = valueSelector(input);
				return { input, relativeValue, value };
			});
		});
}
