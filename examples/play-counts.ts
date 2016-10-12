import { Observable, Subscriber } from 'rxjs/Rx';

import accumulate from '../src/data/accumulate';
import sort from '../src/data/sort';

export interface PlayCount {
	artist: string;
	count: number;
	province: 'British Columbia' | 'Manitoba' | 'Nova Scotia' | 'Ontario' | 'Quebec';
}

export default function getObservable(): Observable<PlayCount[]> {
	const source = new Observable<PlayCount>((subscriber: Subscriber<PlayCount>) => {
		const data: PlayCount[] = [
			{ artist: 'Hawksley Workman', count: 31910, province: 'Ontario' },
			{ artist: 'Buck 65', count: 21192, province: 'Nova Scotia' },
			{ artist: 'The Weakerthans', count: 13495, province: 'Manitoba' },
			{ artist: 'Metric', count: 10067, province: 'Ontario' },
			{ artist: 'The New Pornographers', count: 6201, province: 'British Columbia' },
			// Crediting it to Buck 65's home province, since Greetings from Tuskan is Belgian.
			{ artist: 'Bike For Three!', count: 6022, province: 'Nova Scotia' },
			{ artist: 'Mounties', count: 3097, province: 'Ontario' },
			{ artist: 'Limblifter', count: 2800, province: 'British Columbia' },
			{ artist: 'Arcade Fire', count: 2172, province: 'Quebec' }
		];

		var handle = setInterval(() => { // tslint:disable-line:no-var-keyword
			if (data.length) {
				subscriber.next(data.shift());
			} else {
				subscriber.complete();
				clearInterval(handle);
			}
		}, 1000);
	});

	const accumulated = accumulate(source);
	const sorted = sort(accumulated, ({ artist }) => artist.replace(/^The\s+/, ''));
	return sorted;
}
