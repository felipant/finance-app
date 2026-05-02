<script lang="ts">
	import { Upload, Edit, Trash2, Search, X } from 'lucide-svelte';
	import EditModal from '$lib/components/EditModal.svelte';
	import ToastNotifications from '$lib/components/ToastNotifications.svelte';
	
	let { data } = $props();
	
	let gastos = $state(data.gastos || []);
	//let filteredGastos = $state([]);
	let showEditModal = $state(false);
	let editingGasto = $state(null);
	let notifications = $state([]);
	let csvFile = $state(null);
	
	// Filter states
	let filters = $state({
		data_compra: '',
		valor: '',
		parcelas: '',
		tipo: '',
		pagamento: '',
		comentario: '',
		categoria: '',
		subcategoria: '',
		item: ''
	});
	
	// Apply filters
	let filteredGastos = $derived(() => {
		return gastos.filter(gasto => {
			return Object.entries(filters).every(([key, value]) => {
				if (!value) return true;
				const gastoValue = String(gasto[key] || '').toLowerCase();
				return gastoValue.includes(value.toLowerCase());
			});
		});
	});
	
	function addNotification(message, type = 'success') {
		notifications = [...notifications, { id: Date.now(), message, type }];
		setTimeout(() => {
			notifications = notifications.filter(n => n.id !== notifications[0]?.id);
		}, 3000);
	}
	
	function editGasto(gasto) {
		editingGasto = { ...gasto };
		showEditModal = true;
	}
	
	async function deleteGasto(id) {
		if (!confirm('Tem certeza que deseja excluir este gasto?')) return;
		
		try {
			const response = await fetch(`/api/gastos/${id}`, { method: 'DELETE' });
			if (response.ok) {
				addNotification('Gasto excluído com sucesso', 'success');
				gastos = gastos.filter(g => g.id !== id);
			} else {
				addNotification('Erro ao excluir gasto', 'error');
			}
		} catch (error) {
			addNotification('Erro ao excluir gasto', 'error');
		}
	}
	
	async function handleCSVImport() {
		if (!csvFile) return;
		
		const formData = new FormData();
		formData.append('csv', csvFile);
		
		try {
			const response = await fetch('/api/import-csv', {
				method: 'POST',
				body: formData
			});
			
			if (response.ok) {
				const result = await response.json();
				addNotification(`${result.imported} registros importados com sucesso`, 'success');
				// Reload data
				window.location.reload();
			} else {
				addNotification('Erro ao importar CSV', 'error');
			}
		} catch (error) {
			addNotification('Erro ao importar CSV', 'error');
		}
	}
	
	function handleFilterChange(key, value) {
		filters[key] = value;
	}
	
	function clearFilters() {
		filters = {
			data_compra: '',
			valor: '',
			parcelas: '',
			tipo: '',
			pagamento: '',
			comentario: '',
			categoria: '',
			subcategoria: '',
			item: ''
		};
	}
	
	async function saveEdit(updatedGasto) {
		try {
			const response = await fetch(`/api/gastos/${updatedGasto.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedGasto)
			});
			
			if (response.ok) {
				addNotification('Gasto atualizado com sucesso', 'success');
				gastos = gastos.map(g => g.id === updatedGasto.id ? updatedGasto : g);
				showEditModal = false;
				editingGasto = null;
			} else {
				addNotification('Erro ao atualizar gasto', 'error');
			}
		} catch (error) {
			addNotification('Erro ao atualizar gasto', 'error');
		}
	}
</script>

<div class="max-w-7xl mx-auto">
	<div class="flex justify-between items-center mb-6">
		<h2 class="text-2xl font-bold text-white">Base de Dados</h2>
		<div class="flex gap-2">
			<label class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
				<Upload class="w-4 h-4" />
				Importar CSV
				<input
					type="file"
					accept=".csv"
					bind:files={csvFile}
					onchange={handleCSVImport}
					class="hidden"
				/>
			</label>
		</div>
	</div>
	
	<!-- Filters -->
	<div class="card mb-6">
		<div class="flex justify-between items-center mb-4">
			<h3 class="text-lg font-semibold text-white">Filtros</h3>
			<button
				onclick={clearFilters}
				class="text-sm text-slate-400 hover:text-white transition-colors"
			>
				Limpar Filtros
			</button>
		</div>
		
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
			{#each Object.entries(filters) as [key, value]}
				<div>
					<label class="block text-xs font-medium text-slate-400 mb-1">
						{key.replace('_', ' ').toUpperCase()}
					</label>
					<input
						type="text"
						bind:value={filters[key]}
						oninput={(e) => handleFilterChange(key, e.target.value)}
						placeholder={`Buscar ${key}...`}
						class="input-field w-full text-sm"
					/>
				</div>
			{/each}
		</div>
	</div>
	
	<!-- Results count -->
	<div class="mb-4 text-sm text-slate-400">
		{filteredGastos.length} de {gastos.length} registros
	</div>
	
	<!-- Table -->
	<div class="card overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-slate-700">
					<th class="text-left p-2 text-slate-300">Data</th>
					<th class="text-left p-2 text-slate-300">Item</th>
					<th class="text-left p-2 text-slate-300">Categoria</th>
					<th class="text-left p-2 text-slate-300">Subcategoria</th>
					<th class="text-left p-2 text-slate-300">Valor</th>
					<th class="text-left p-2 text-slate-300">Parcelas</th>
					<th class="text-left p-2 text-slate-300">Tipo</th>
					<th class="text-left p-2 text-slate-300">Pagamento</th>
					<th class="text-left p-2 text-slate-300">Comentário</th>
					<th class="text-left p-2 text-slate-300">Ações</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredGastos.slice(0, 20) as gasto}
					<tr class="border-b border-slate-700 hover:bg-slate-800 transition-colors">
						<td class="p-2">{gasto.data_compra}</td>
						<td class="p-2">{gasto.item}</td>
						<td class="p-2">{gasto.categoria}</td>
						<td class="p-2">{gasto.subcategoria}</td>
						<td class="p-2">R$ {parseFloat(gasto.valor).toFixed(2)}</td>
						<td class="p-2">{gasto.parcelas}</td>
						<td class="p-2">{gasto.tipo}</td>
						<td class="p-2">{gasto.pagamento}</td>
						<td class="p-2">{gasto.comentario || '-'}</td>
						<td class="p-2">
							<div class="flex gap-1">
								<button
									onclick={() => editGasto(gasto)}
									class="p-1 hover:bg-blue-600 rounded transition-colors"
									title="Editar"
								>
									<Edit class="w-3 h-3 text-blue-400" />
								</button>
								<button
									onclick={() => deleteGasto(gasto.id)}
									class="p-1 hover:bg-red-600 rounded transition-colors"
									title="Excluir"
								>
									<Trash2 class="w-3 h-3 text-red-400" />
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		
		{#if filteredGastos.length === 0}
			<div class="text-center py-8 text-slate-400">
				Nenhum registro encontrado
			</div>
		{:else if filteredGastos.length > 20}
			<div class="text-center py-4 text-slate-400">
				Mostrando 20 de {filteredGastos.length} registros
			</div>
		{/if}
	</div>
</div>

{#if showEditModal}
	<EditModal
		gasto={editingGasto}
		onclose={() => {
			showEditModal = false;
			editingGasto = null;
		}}
		onsave={saveEdit}
		onnotification={(message, type) => addNotification(message, type)}
	/>
{/if}

<ToastNotifications {notifications} />
