<script lang="ts">
	import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-svelte';
	
	let { notifications } = $props();
	
	function getIcon(type) {
		switch (type) {
			case 'success':
				return CheckCircle;
			case 'error':
				return XCircle;
			case 'warning':
				return AlertCircle;
			default:
				return CheckCircle;
		}
	}
	
	function getStyles(type) {
		switch (type) {
			case 'success':
				return 'bg-green-600 border-green-500';
			case 'error':
				return 'bg-red-600 border-red-500';
			case 'warning':
				return 'bg-yellow-600 border-yellow-500';
			default:
				return 'bg-green-600 border-green-500';
		}
	}
</script>

<div class="fixed top-4 right-4 z-50 space-y-2">
	{#each notifications as notification (notification.id)}
		<div
			class="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all transform translate-x-0 {getStyles(notification.type)}"
		>
			<svelte:component
				this={getIcon(notification.type)}
				class="w-5 h-5 text-white flex-shrink-0"
			/>

			<span class="text-white font-medium">
				{notification.message}
			</span>

			<button
				onclick={() => {
					notifications = notifications.filter(n => n.id !== notification.id);
				}}
				class="ml-auto p-1 hover:bg-white/20 rounded transition-colors"
			>
				<X class="w-4 h-4 text-white" />
			</button>
		</div>
	{/each}
</div>
