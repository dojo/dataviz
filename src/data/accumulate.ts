import { Observable } from 'rxjs/Rx';

export default function accumulate<T>(observable: Observable<T>): Observable<T[]> {
	return observable.scan<T[]>((acc, input) => acc.concat(input), []);
}
