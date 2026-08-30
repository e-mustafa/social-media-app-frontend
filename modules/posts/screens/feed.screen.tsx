import { Suspense } from 'react';
import FeedList from '../components/feed-list';

function FeedFallback() {
	return (
		<div className='mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6'>
			<div className='h-56 rounded-3xl border border-border/20 bg-card-blur animate-pulse' />
			<div className='h-72 rounded-3xl border border-border/20 bg-card-blur animate-pulse' />
			<div className='h-72 rounded-3xl border border-border/20 bg-card-blur animate-pulse' />
		</div>
	);
}

export default function FeedScreen() {
	return (
		<main className='min-h-[calc(100vh-4rem)] w-full bg-radial from-brand-primary/5 via-transparent to-transparent'>
			<div className='container mx-auto grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,48rem)_minmax(0,1fr)]'>
				<aside className='hidden lg:block' />
				<Suspense fallback={<FeedFallback />}>
					<FeedList />
				</Suspense>
				<aside className='hidden lg:block' />
			</div>
		</main>
	);
}
