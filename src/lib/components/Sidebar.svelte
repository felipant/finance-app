<script lang="ts">
	import { page } from '$app/stores';
	import { Home, Database, DollarSign, BarChart3, PieChart, LucideMinus } from 'lucide-svelte';
	
	let isCollapsed = $state(false);
	
	const navigation = [
		{ name: 'Gastos', href: '/', icon: Home },
		{ name: 'Base de Dados', href: '/base-de-dados', icon: Database },
		{ name: 'Gastos Fixos', href: '/gastos-fixos', icon: DollarSign },
		{ name: 'Dashboard Detalhado', href: '/dashboard-detalhado', icon: BarChart3 },
		{ name: 'Dashboard Gráfico', href: '/dashboard-grafico', icon: PieChart }
	];
	
	function toggleSidebar() {
		isCollapsed = !isCollapsed;
	}
</script>

<aside 
	class="fixed left-0 top-0 h-full bg-slate-900 border-r border-white/10 transition-all duration-300 z-50 {isCollapsed ? 'w-16' : 'w-64'}"
>
	<div class="p-4">
		<button
			onclick={toggleSidebar}
			class="w-full flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
		>
			<LucideMinus class="w-5 h-5 text-white" />
		</button>
	</div>
	
	<nav class="px-2">
		{#each navigation as item}
			<a
				href={item.href}
				class="flex items-center px-3 py-2 mb-1 rounded-lg transition-colors {
					$page.url.pathname === item.href
						? 'bg-blue-600 text-white'
						: 'text-slate-300 hover:bg-slate-800 hover:text-white'
				}"
				title={isCollapsed ? item.name : ''}
			>
				<item.icon class="w-5 h-5 flex-shrink-0" />
				{#if !isCollapsed}
					<span class="ml-3">{item.name}</span>
				{/if}
			</a>
		{/each}
	</nav>
</aside>

<style>
	aside {
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
	}
</style>
