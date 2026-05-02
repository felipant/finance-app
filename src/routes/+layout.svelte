<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-50">
	<Sidebar />
	
	<main class="ml-16 lg:ml-64 p-6">
		<header class="mb-8">
			<h1 class="text-3xl font-bold text-white mb-2">Família Oliveira Arantes</h1>
			<div class="h-px bg-gradient-to-r from-blue-500 to-transparent"></div>
		</header>
		
		{@render children()}
	</main>
</div>
