import { Observable, Subscriber } from 'rxjs/Rx';
import sort from './computation/sort';
import sumAndWeigh from './computation/sum-and-weigh';

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

const combined = source.scan(
	(inputs, input) => inputs.concat(input),
	[] as PlayCount[]
);

sort(
	sumAndWeigh(combined, (input) => input.count),
	([{ artist }]) => artist.replace(/^The\s+/, '')
).subscribe(results => console.error(results));
