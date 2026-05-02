<script lang="ts">
	import { X, Plus, Search } from 'lucide-svelte';
	
	let { onclose, onnotification } = $props();
	
	// Header form data
	let headerData = $state({
		data_compra: new Date().toISOString().split('T')[0],
		pagamento: 'Credito',
		parcelas: '1',
		tipo: 'variável'
	});
	
	// Table rows
	let rows = $state([{
		id: Date.now(),
		item: '',
		subcategoria: '',
		categoria: '',
		valor: '',
		comentario: ''
	}]);
	
	let items = $state([]);
	//let filteredItems = $state([]);
	let currentFocusIndex = $state(0);
	
	let filteredItems = $derived(
		items
			.filter(item =>
			item.nome_item
				.toLowerCase()
				.includes(rows[currentFocusIndex]?.item?.toLowerCase() || '')
			)
			.slice(0, 5)
	);
	
	let total = $derived(
		rows.reduce((sum, row) => sum + (parseFloat(row.valor) || 0), 0)
	);
	
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
	
	function selectItem(rowIndex, item) {
		rows[rowIndex].item = item.nome_item;
		rows[rowIndex].categoria = item.nome_categoria;
		rows[rowIndex].subcategoria = item.nome_subcategoria;
		currentFocusIndex = -1;
		
		// Focus on valor field
		const valorInput = document.querySelector(`#valor-${rowIndex}`);
		if (valorInput) valorInput.focus();
	}
	
	function addNewRow() {
		const lastRow = rows[rows.length - 1];
		if (!lastRow.item) return; // Don't add if last row is empty
		
		rows = [...rows, {
			id: Date.now(),
			item: '',
			subcategoria: '',
			categoria: '',
			valor: '',
			comentario: ''
		}];
		
		// Focus on new row's item field
		setTimeout(() => {
			const itemInput = document.querySelector(`#item-${rows.length - 1}`);
			if (itemInput) itemInput.focus();
		}, 0);
	}
	
	function removeRow(index) {
		if (rows.length > 1) {
			rows = rows.filter((_, i) => i !== index);
		}
	}
	
	function handleKeyDown(event, rowIndex, field) {
		if (event.key === 'Tab' && !event.shiftKey) {
			if (field === 'item') {
				// Select first filtered item if available
				if (filteredItems.length > 0) {
					event.preventDefault();
					selectItem(rowIndex, filteredItems[0]);
				}
			} else if (field === 'valor') {
				// Move to comentario
				const comentarioInput = document.querySelector(`#comentario-${rowIndex}`);
				if (comentarioInput) comentarioInput.focus();
			} else if (field === 'comentario') {
				// Add new row and focus on item
				event.preventDefault();
				addNewRow();
			}
		}
	}
	
	async function submitAll() {
		const validRows = rows.filter(row => row.item && row.valor);
		if (validRows.length === 0) {
			onnotification('Adicione pelo menos um item válido', 'error');
			return;
		}
		
		try {
			const payload = {
				header: headerData,
				items: validRows
			};
			
			const response = await fetch('/api/multiple-expenses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			
			if (response.ok) {
				onnotification(`${validRows.length} gastos registrados com sucesso!`, 'success');
				onclose();
			} else {
				onnotification('Erro ao registrar gastos', 'error');
			}
		} catch (error) {
			onnotification('Erro ao registrar gastos', 'error');
		}
	}
	
	function handleItemInput(rowIndex, value) {
		rows[rowIndex].item = value;
		currentFocusIndex = rowIndex;
	}
	
	// Load items on mount
	$effect(() => {
		loadItems();
	});
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
	<div class="bg-slate-900 border border-slate-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
		<div class="flex items-center justify-between p-6 border-b border-slate-700">
			<h2 class="text-2xl font-bold text-white">Lançar Múltiplas Compras</h2>
			<button
				onclick={onclose}
				class="p-2 hover:bg-slate-800 rounded-lg transition-colors"
			>
				<X class="w-5 h-5 text-slate-400" />
			</button>
		</div>
		
		<div class="p-6">
			<!-- Header Form -->
			<div class="mb-6 p-4 bg-slate-800 rounded-lg">
				<h3 class="text-lg font-semibold text-white mb-4">Configurações Gerais</h3>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-1">Data</label>
						<input
							type="date"
							bind:value={headerData.data_compra}
							class="input-field w-full"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-1">Pagamento</label>
						<select bind:value={headerData.pagamento} class="input-field w-full">
							<option value="Credito">Crédito</option>
							<option value="Debito">Débito</option>
							<option value="Dinheiro">Dinheiro</option>
							<option value="Pix">Pix</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-1">Parcelas</label>
						<select bind:value={headerData.parcelas} class="input-field w-full">
							{#each Array(12) as _, i}
								<option value={i + 1}>{i + 1}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
						<select bind:value={headerData.tipo} class="input-field w-full">
							<option value="variável">Variável</option>
							<option value="fixo">Fixo</option>
						</select>
					</div>
				</div>
			</div>
			
			<!-- Dynamic Table -->
			<div class="mb-6">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b border-slate-700">
								<th class="text-left p-2 text-slate-300">Item</th>
								<th class="text-left p-2 text-slate-300">Subcategoria</th>
								<th class="text-left p-2 text-slate-300">Categoria</th>
								<th class="text-left p-2 text-slate-300">Valor</th>
								<th class="text-left p-2 text-slate-300">Comentário</th>
								<th class="text-left p-2 text-slate-300"></th>
							</tr>
						</thead>
						<tbody>
							{#each rows as row, rowIndex}
								<tr class="border-b border-slate-700">
									<td class="p-2 relative">
										<input
											id="item-{rowIndex}"
											type="text"
											bind:value={row.item}
											oninput={(e) => handleItemInput(rowIndex, e.target.value)}
											onkeydown={(e) => handleKeyDown(e, rowIndex, 'item')}
											onblur={() => { setTimeout(() => { currentFocusIndex = -1; }, 200); }}
											class="input-field w-full text-sm"
											placeholder="Digite para buscar..."
										/>
										
										{#if filteredItems.length > 0 && currentFocusIndex === rowIndex && row.item}
											<div class="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
												{#each filteredItems as item}
													<button
														type="button"
														onclick={() => selectItem(rowIndex, item)}
														class="w-full text-left px-3 py-2 hover:bg-slate-700 transition-colors text-sm flex justify-between items-center"
													>
														<span>{item.nome_item}</span>
														<span class="text-xs text-slate-400">{item.nome_categoria} / {item.nome_subcategoria}</span>
													</button>
												{/each}
											</div>
										{/if}
									</td>
									<td class="p-2">
										<input
											type="text"
											bind:value={row.subcategoria}
											readonly
											class="input-field w-full text-sm bg-slate-700"
										/>
									</td>
									<td class="p-2">
										<input
											type="text"
											bind:value={row.categoria}
											readonly
											class="input-field w-full text-sm bg-slate-700"
										/>
									</td>
									<td class="p-2">
										<input
											id="valor-{rowIndex}"
											type="number"
											bind:value={row.valor}
											onkeydown={(e) => handleKeyDown(e, rowIndex, 'valor')}
											step="0.01"
											class="input-field w-full text-sm"
											placeholder="0.00"
										/>
									</td>
									<td class="p-2">
										<input
											id="comentario-{rowIndex}"
											type="text"
											bind:value={row.comentario}
											onkeydown={(e) => handleKeyDown(e, rowIndex, 'comentario')}
											class="input-field w-full text-sm"
											placeholder="Comentário"
										/>
									</td>
									<td class="p-2">
										{#if rows.length > 1}
											<button
												onclick={() => removeRow(rowIndex)}
												class="p-1 hover:bg-red-600 rounded transition-colors"
											>
												<X class="w-4 h-4 text-red-400" />
											</button>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				
				<div class="mt-4 flex justify-between items-center">
					<button
						onclick={addNewRow}
						class="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
					>
						<Plus class="w-4 h-4" />
						Adicionar Linha
					</button>
					
					<div class="text-lg font-semibold text-white">
						Total: R$ {total.toFixed(2)}
					</div>
				</div>
			</div>
			
			<!-- Submit Button -->
			<div class="flex justify-end gap-4">
				<button
					onclick={onclose}
					class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
				>
					Cancelar
				</button>
				<button
					onclick={submitAll}
					class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
				>
					Registrar {rows.filter(row => row.item && row.valor).length} Gastos
				</button>
			</div>
		</div>
	</div>
</div>
