<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageServerData } from './$types';

	export let data: PageServerData;
	export let form: ActionData;
</script>

<h1>Posts (Server)</h1>
<h2>Create Post</h2>
<form method="post" use:enhance class="posts__form">
	<input name="title" placeholder="Title" required />
	<br />
	<textarea name="content" placeholder="Content" required></textarea>
	<br />

	{#if form && form.error}
		<p class="posts__error">{form.error}</p>
		<br />
	{/if}

	<button type="submit">Create Post</button>
</form>

<h2>Posts</h2>
<div class="posts__list">
	{#each data.posts as post}
		<div class="posts__list-item">
			<string>{post.title}</string>
			<p>{post.content}</p>
		</div>
	{:else}
		<h2>No posts yet</h2>
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
