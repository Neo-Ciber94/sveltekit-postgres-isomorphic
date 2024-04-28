import { db } from '$lib/db';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { posts } from '$lib/db/schema';

export const load: PageServerLoad = async () => {
	const result = await db.query.posts.findMany();
	return { posts: result };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const title = formData.get('title');
		const content = formData.get('content');

		if (typeof title !== 'string' || title.trim().length === 0) {
			return fail(400, { error: 'Title is required' });
		}

		if (typeof content !== 'string' || content.trim().length === 0) {
			return fail(400, { error: 'Content is required' });
		}

		await db.insert(posts).values({ title, content });
	}
};
