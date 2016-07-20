import { Observable, Subscriber } from 'rxjs/Rx';

import accumulate from './data/accumulate';
import relativeValues from './data/relative-values';
import sort from './data/sort';
import sum from './data/sum';

export {
	/* provide the public API here */
};

interface PlayCount {
	artist: string;
	count: number;
}

const source = new Observable<PlayCount>((subscriber: Subscriber<PlayCount>) => {
	const data = [
		{ artist: 'Hawksley Workman', count: 31910 },
		{ artist: 'Buck 65', count: 21192 },
		{ artist: 'The Weakerthans', count: 13495 },
		{ artist: 'Bear McCreary', count: 10864 },
		{ artist: 'Metric', count: 10067 },
		{ artist: 'The New Pornographers', count: 6201 },
		{ artist: 'Bike For Three!', count: 6022 },
		{ artist: 'Mounties', count: 3097 },
		{ artist: 'Limblifter', count: 2800 },
		{ artist: 'Arcade Fire', count: 2172 }
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
const shared = sorted.share();

const getValue = (input: PlayCount) => input.count;
const summation = sum(shared, getValue);
relativeValues(shared, getValue, summation)
	.subscribe(results => console.error(results));
