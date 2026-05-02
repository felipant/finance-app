<script lang="ts">
	import { X, Save } from 'lucide-svelte';
	
	let { gasto, onclose, onsave, onnotification } = $props();
	
	let formData = $state({
		valor: '',
		item: '',
		tipo: 'variável',
		comentario: ''
	});
	
	let items = $state([]);
	let selectedItem = $state(null);
	
	// Initialize form with gasto data
	$effect(() => {
		if (gasto) {
			formData = {
				valor: gasto.valor || '',
				item: gasto.item || '',
				tipo: gasto.tipo || 'variável',
				comentario: gasto.comentario || ''
			};
		}
	});
	
	// Load items for autocomplete
	async function loadItems() {
		try {
			const response = await fetch('/api/items');
			if (response.ok) {
				items = await response.json();
			}
		} catch (error) {
			onnotification('Erro ao carregar itens', 'error');
		}
	}
	
	// Filter items based on input
	let filteredItems = $derived(() => {
		return items.filter(item => 
			item.nome_item.toLowerCase().includes(formData.item.toLowerCase())
		).slice(0, 5);
	});
	
	function selectItem(item) {
		selectedItem = item;
		formData.item = item.nome_item;
		filteredItems = [];
	}
	
	async function handleSave() {
		if (!formData.item || !formData.valor) {
			onnotification('Preencha todos os campos obrigatórios', 'error');
			return;
		}
		
		const updatedGasto = {
			...gasto,
			...formData,
			valor: parseFloat(formData.valor),
			categoria: selectedItem?.nome_categoria || gasto.categoria,
			subcategoria: selectedItem?.nome_subcategoria || gasto.subcategoria
		};
		
		await onsave(updatedGasto);
	}
	
	function handleKeydown(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleSave();
		}
	}
	
	// Load items on mount
	$effect(() => {
		loadItems();
	});
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
	<div class="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
		<div class="flex items-center justify-between p-6 border-b border-slate-700">
			<h2 class="text-2xl font-bold text-white">Editar Gasto Fixo</h2>
			<button
				onclick={onclose}
				class="p-2 hover:bg-slate-800 rounded-lg transition-colors"
			>
				<X class="w-5 h-5 text-slate-400" />
			</button>
		</div>
		
		<div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="relative">
					<label class="block text-sm font-medium text-slate-300 mb-1">Item</label>
					<input
						type="text"
						bind:value={formData.item}
						class="input-field w-full"
						placeholder="Digite para buscar..."
						oninput={() => {}}
						onkeydown={handleKeydown}
						onblur={() => filteredItems = []}
					/>
					
					{#if filteredItems.length > 0 && formData.item}
						<div class="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg">
							{#each filteredItems as item}
								<button
									type="button"
									onclick={() => selectItem(item)}
									class="w-full text-left px-3 py-2 hover:bg-slate-700 transition-colors text-sm flex justify-between items-center"
								>
									<span class="text-white">{item.nome_item}</span>
									<span class="text-xs text-slate-400">{item.nome_categoria} / {item.nome_subcategoria}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
				
				<div>
					<label class="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
					<input
						type="text"
						value={selectedItem?.nome_categoria || ''}
						readonly
						class="input-field w-full bg-slate-700 border-slate-600 text-slate-400"
						placeholder="Selecione um item"
					/>
				</div>
				
				<div>
					<label class="block text-sm font-medium text-slate-300 mb-1">Subcategoria</label>
					<input
						type="text"
						value={selectedItem?.nome_subcategoria || ''}
						readonly
						class="input-field w-full bg-slate-700 border-slate-600 text-slate-400"
						placeholder="Selecione um item"
					/>
				</div>
				
				<div>
					<label class="block text-sm font-medium text-slate-300 mb-1">Valor</label>
					<input
						type="number"
						bind:value={formData.valor}
						step="0.01"
						class="input-field w-full"
						placeholder="0.00"
						onkeydown={handleKeydown}
					/>
				</div>
				
				<div>
					<label class="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
					<select bind:value={formData.tipo} class="input-field w-full">
						<option value="variável">Variável</option>
						<option value="fixo">Fixo</option>
					</select>
				</div>
				
				<div class="md:col-span-2">
					<label class="block text-sm font-medium text-slate-300 mb-1">Comentário</label>
					<textarea
						bind:value={formData.comentario}
						class="input-field w-full"
						rows="2"
						placeholder="Observações (opcional)"
					></textarea>
				</div>
				
				{#if selectedItem}
					<div class="md:col-span-2 p-3 bg-slate-800 rounded-lg">
						<p class="text-sm text-slate-300">
							<strong>Categoria:</strong> {selectedItem.nome_categoria}<br>
							<strong>Subcategoria:</strong> {selectedItem.nome_subcategoria}
						</p>
					</div>
				{:else if gasto?.categoria}
					<div class="md:col-span-2 p-3 bg-slate-800 rounded-lg">
						<p class="text-sm text-slate-300">
							<strong>Categoria:</strong> {gasto.categoria}<br>
							<strong>Subcategoria:</strong> {gasto.subcategoria}
						</p>
					</div>
				{/if}
			</div>
		</div>
		
		<div class="flex justify-end gap-4 p-6 border-t border-slate-700">
			<button
				onclick={onclose}
				class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
			>
				Cancelar
			</button>
			<button
				onclick={handleSave}
				class="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
			>
				<Save class="w-4 h-4" />
				Salvar
			</button>
		</div>
	</div>
</div>
