import { Suspense } from 'react';
import FeedList from '../components/feed-list';

function FeedFallback() {
	return (
		<div className='flex w-full max-w-4xl flex-col gap-5 px-4 py-6 slide-in-from-top-5'>
			<div className='h-56 rounded-3xl border border-border/20 bg-card-blur animate-pulse' />
			<div className='h-72 rounded-3xl border border-border/20 bg-card-blur animate-pulse' />
			<div className='h-72 rounded-3xl border border-border/20 bg-card-blur animate-pulse' />
		</div>
	);
}

export default function FeedScreen() {
	return (
		// <div className='container mx-auto grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,48rem)_minmax(0,1fr)]'>
		<div className='grid grid-cols-1 page-animation'>
			<Suspense fallback={<FeedFallback />}>
				<FeedList />
			</Suspense>
			{/* <aside className='hidden lg:block' /> */}
		</div>
	);
}
