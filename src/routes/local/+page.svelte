<script lang="ts">
	import { client, applyPendingMigrations } from '$lib/db/client';
	import { posts } from '$lib/db/schema';

	type Post = typeof posts.$inferSelect;

	let data = $state<{ posts: Post[] }>({ posts: [] });
	let isLoading = $state(true);
	let error = $state<{ error?: string }>();

	$effect(() => {
		isLoading = true;
		applyPendingMigrations()
			.then(() => loadPosts())
			.catch(console.error)
			.finally(() => {
				isLoading = false;
			});
	});

	async function loadPosts() {
		const result = await client.db.query.posts.findMany();
		data = { posts: result };
	}

	async function handleSubmit(ev: SubmitEvent) {
		ev.preventDefault();
		const formEl = ev.currentTarget as HTMLFormElement;
		const formData = new FormData(formEl);
		const title = formData.get('title');
		const content = formData.get('content');

		if (typeof title !== 'string' || title.trim().length === 0) {
			error = { error: 'Title is required' };
			return;
		}

		if (typeof content !== 'string' || content.trim().length === 0) {
			error = { error: 'Content is required' };
			return;
		}

		await client.db.insert(posts).values({ title, content });
		await loadPosts();
		formEl.reset();
	}
</script>

<h1>Posts (Client)</h1>
<h2>Create Post</h2>
<form method="post" class="posts__form" onsubmit={handleSubmit}>
	<input name="title" placeholder="Title" required />
	<br />
	<textarea name="content" placeholder="Content" required></textarea>
	<br />

	{#if error && error.error}
		<p class="posts__error">{error.error}</p>
		<br />
	{/if}

	<button type="submit">Create Post</button>
</form>

<h2>Posts</h2>
<div class="posts__list">
	{#if isLoading}
		<p>Loading...</p>
	{/if}

	{#each data.posts as post}
		<div class="posts__list-item">
			<string>{post.title}</string>
			<p>{post.content}</p>
		</div>
	{:else}
		{#if !isLoading}
			<h2>No posts yet</h2>
		{/if}
	{/each}
</div>

<style>
	.posts__form {
		margin-bottom: 10px;
	}

	.posts__error {
		color: red;
	}

	.posts__list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.posts__list-item {
		padding: 4px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
</style>
