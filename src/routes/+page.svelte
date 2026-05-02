<script lang="ts">
	import { enhance } from '$app/forms';
	import { Settings, Plus, Calendar, Search } from 'lucide-svelte';
	import CategoriesModal from '$lib/components/CategoriesModal.svelte';
	import MultiplePurchasesModal from '$lib/components/MultiplePurchasesModal.svelte';
	import ToastNotifications from '$lib/components/ToastNotifications.svelte';
	
	// Svelte 5: Acesso a props via $props()[cite: 2]
	let { data } = $props();
	
	// Svelte 5: Estado reativo via $state()[cite: 2]
	let formData = $state({
		data_compra: new Date().toISOString().split('T')[0],
		item: '',
		valor: '',
		parcelas: '1',
		tipo: 'variável',
		pagamento: 'Credito',
		comentario: ''
	});
	
	let selectedItem = $state(null);
	let showCategoriesModal = $state(false);
	let showMultipleModal = $state(false);
	let items = $state(data.items || []);
	let notifications = $state([]);

	// Svelte 5: Usamos $derived para valores que dependem de outros estados
	let filteredItems = $derived(
		items
			.filter(item =>
			item.nome_item
				.toLowerCase()
				.includes(rows[currentFocusIndex]?.item?.toLowerCase() || '')
			)
			.slice(0, 5)
	);
	
	function selectItem(item) {
		selectedItem = item;
		formData.item = item.nome_item;
		// A categoria/subcategoria é processada no servidor via +page.server.js[cite: 1]
	}
	
	function addNotification(message, type = 'success') {
		notifications = [...notifications, { id: Date.now(), message, type }];
		setTimeout(() => {
			notifications = notifications.filter(n => n.id !== notifications[0]?.id);
		}, 3000);
	}
	
	function resetForm() {
		// Resetando mantendo a reatividade do objeto $state[cite: 2]
		formData.data_compra = new Date().toISOString().split('T')[0];
		formData.item = '';
		formData.valor = '';
		formData.parcelas = '1';
		formData.tipo = 'variável';
		formData.pagamento = 'Credito';
		formData.comentario = '';
		selectedItem = null;
	}
</script>

<div class="max-w-4xl mx-auto">
	<div class="flex justify-between items-center mb-6">
		<h2 class="text-2xl font-bold text-white">Lançamento de Gastos</h2>
		<div class="flex gap-2">
			<!-- Svelte 5: Uso de onclick em vez de on:click[cite: 2] -->
			<button
				onclick={() => showCategoriesModal = true}
				class="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
			>
				<Settings class="w-4 h-4" />
				Categorias
			</button>
			<button
				onclick={() => showMultipleModal = true}
				class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
			>
				<Plus class="w-4 h-4" />
				Lançar múltiplas compras
			</button>
		</div>
	</div>
	
	<form 
		method="POST"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					addNotification('Gasto registrado com sucesso!', 'success');
					resetForm();
					await update();
				} else if (result.type === 'failure') {
					addNotification(result.data?.error || 'Erro ao registrar gasto', 'error');
				}
			};
		}}
		class="card bg-slate-900 p-6 rounded-xl border border-white/10 shadow-xl"
	>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<div class="relative">
				<label class="block text-sm font-medium text-slate-300 mb-1">
					<Calendar class="w-4 h-4 inline mr-1" />
					Data
				</label>
				<input
					type="date"
					name="data_compra"
					bind:value={formData.data_compra}
					class="input-field w-full bg-slate-800 border-slate-700 text-white rounded-md p-2"
					required
				/>
			</div>
			
			<div class="relative lg:col-span-2">
				<label class="block text-sm font-medium text-slate-300 mb-1">
					<Search class="w-4 h-4 inline mr-1" />
					Item
				</label>
				<input
					type="text"
					name="item"
					bind:value={formData.item}
					autocomplete="off"
					class="input-field w-full bg-slate-800 border-slate-700 text-white rounded-md p-2"
					placeholder="Digite para buscar um item..."
					required
				/>
				
				{#if filteredItems.length > 0 && formData.item && !selectedItem}
					<div class="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden">
						{#each filteredItems as item}
							<button
								type="button"
								onclick={() => selectItem(item)}
								class="w-full text-left px-3 py-2 hover:bg-slate-700 transition-colors flex justify-between items-center"
							>
								<span class="text-white">{item.nome_item}</span>
								<span class="text-xs text-slate-400">{item.nome_categoria} / {item.nome_subcategoria}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
			
			<div>
				<label class="block text-sm font-medium text-slate-300 mb-1">Valor</label>
				<input
					type="number"
					name="valor"
					bind:value={formData.valor}
					step="0.01"
					class="input-field w-full bg-slate-800 border-slate-700 text-white rounded-md p-2"
					placeholder="0.00"
					required
				/>
			</div>
			
			<div>
				<label class="block text-sm font-medium text-slate-300 mb-1">Parcelas</label>
				<select name="parcelas" bind:value={formData.parcelas} class="input-field w-full bg-slate-800 border-slate-700 text-white rounded-md p-2">
					{#each Array(12) as _, i}
						<option value={i + 1}>{i + 1}</option>
					{/each}
				</select>
			</div>
			
			<div>
				<label class="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
				<select name="tipo" bind:value={formData.tipo} class="input-field w-full bg-slate-800 border-slate-700 text-white rounded-md p-2">
					<option value="variável">Variável</option>
					<option value="fixo">Fixo</option>
				</select>
			</div>
			
			<div>
				<label class="block text-sm font-medium text-slate-300 mb-1">Pagamento</label>
				<select name="pagamento" bind:value={formData.pagamento} class="input-field w-full bg-slate-800 border-slate-700 text-white rounded-md p-2">
					<option value="Credito">Crédito</option>
					<option value="Debito">Débito</option>
					<option value="Dinheiro">Dinheiro</option>
					<option value="Pix">Pix</option>
				</select>
			</div>
			
			<div class="lg:col-span-3">
				<label class="block text-sm font-medium text-slate-300 mb-1">Comentário</label>
				<textarea
					name="comentario"
					bind:value={formData.comentario}
					class="input-field w-full bg-slate-800 border-slate-700 text-white rounded-md p-2"
					rows="2"
					placeholder="Observações (opcional)"
				></textarea>
			</div>
		</div>
		
		<div class="mt-6 flex justify-end">
			<button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95">
				Registrar Gasto
			</button>
		</div>
	</form>
</div>

<!-- Svelte 5: Callbacks de componentes via props (onclose, onnotification)[cite: 2] -->
{#if showCategoriesModal}
	<CategoriesModal 
		onclose={() => showCategoriesModal = false}
		onnotification={(message, type) => addNotification(message, type)}
	/>
{/if}

{#if showMultipleModal}
	<MultiplePurchasesModal 
		onclose={() => showMultipleModal = false}
		onnotification={(message, type) => addNotification(message, type)}
	/>
{/if}

<ToastNotifications {notifications} />