<script lang="ts">
	import { Plus, Edit, Trash2, Calendar, Search } from 'lucide-svelte';
	import NewFixedExpenseModal from '$lib/components/NewFixedExpenseModal.svelte';
	import EditFixedExpenseModal from '$lib/components/EditFixedExpenseModal.svelte';
	import ToastNotifications from '$lib/components/ToastNotifications.svelte';
	
	let { data } = $props();
	
	let gastosFixos = $state(data.gastosFixos || []);
	let showNewModal = $state(false);
	let showEditModal = $state(false);
	let editingGasto = $state(null);
	let notifications = $state([]);
	let isLaunching = $state(false);
	
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
		if (!confirm('Tem certeza que deseja excluir este gasto fixo?')) return;
		
		try {
			const response = await fetch(`/api/gastos-fixos/${id}`, { method: 'DELETE' });
			if (response.ok) {
				addNotification('Gasto fixo excluído com sucesso', 'success');
				gastosFixos = gastosFixos.filter(g => g.id !== id);
			} else {
				addNotification('Erro ao excluir gasto fixo', 'error');
			}
		} catch (error) {
			addNotification('Erro ao excluir gasto fixo', 'error');
		}
	}
	
	async function launchMonthlyExpenses() {
		if (isLaunching) return;
		
		isLaunching = true;
		try {
			const response = await fetch('/api/launch-fixed-expenses', { method: 'POST' });
			const result = await response.json();
			
			if (response.ok) {
				if (result.launched > 0) {
					addNotification(`${result.launched} gastos fixos lançados com sucesso!`, 'success');
				} else {
					addNotification('Todos os gastos fixos deste mês já foram lançados', 'warning');
				}
			} else {
				addNotification(result.error || 'Erro ao lançar gastos fixos', 'error');
			}
		} catch (error) {
			addNotification('Erro ao lançar gastos fixos', 'error');
		} finally {
			isLaunching = false;
		}
	}
	
	async function saveEdit(updatedGasto) {
		try {
			const response = await fetch(`/api/gastos-fixos/${updatedGasto.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedGasto)
			});
			
			if (response.ok) {
				addNotification('Gasto fixo atualizado com sucesso', 'success');
				gastosFixos = gastosFixos.map(g => g.id === updatedGasto.id ? updatedGasto : g);
				showEditModal = false;
				editingGasto = null;
			} else {
				addNotification('Erro ao atualizar gasto fixo', 'error');
			}
		} catch (error) {
			addNotification('Erro ao atualizar gasto fixo', 'error');
		}
	}
	
	async function saveNew(newGasto) {
		try {
			const response = await fetch('/api/gastos-fixos', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newGasto)
			});
			
			if (response.ok) {
				const result = await response.json();
				addNotification('Gasto fixo criado com sucesso', 'success');
				gastosFixos = [...gastosFixos, result];
				showNewModal = false;
			} else {
				addNotification('Erro ao criar gasto fixo', 'error');
			}
		} catch (error) {
			addNotification('Erro ao criar gasto fixo', 'error');
		}
	}
</script>

<div class="max-w-6xl mx-auto">
	<div class="flex justify-between items-center mb-6">
		<h2 class="text-2xl font-bold text-white">Gastos Fixos</h2>
		<div class="flex gap-2">
			<button
				onclick={launchMonthlyExpenses}
				disabled={isLaunching}
				class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
			>
				<Calendar class="w-4 h-4" />
				{isLaunching ? 'Lançando...' : 'Adicionar gastos fixos do mês'}
			</button>
			<button
				onclick={() => showNewModal = true}
				class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
			>
				<Plus class="w-4 h-4" />
				Novo Gasto Fixo
			</button>
		</div>
	</div>
	
	<!-- Table -->
	<div class="card overflow-x-auto">
		<table class="w-full">
			<thead>
				<tr class="border-b border-slate-700">
					<th class="text-left p-3 text-slate-300">Valor</th>
					<th class="text-left p-3 text-slate-300">Categoria</th>
					<th class="text-left p-3 text-slate-300">Subcategoria</th>
					<th class="text-left p-3 text-slate-300">Tipo</th>
					<th class="text-left p-3 text-slate-300">Comentário</th>
					<th class="text-left p-3 text-slate-300">Ações</th>
				</tr>
			</thead>
			<tbody>
				{#each gastosFixos as gasto}
					<tr class="border-b border-slate-700 hover:bg-slate-800 transition-colors">
						<td class="p-3 font-medium">R$ {parseFloat(gasto.valor).toFixed(2)}</td>
						<td class="p-3">{gasto.categoria}</td>
						<td class="p-3">{gasto.subcategoria}</td>
						<td class="p-3">
							<span class="px-2 py-1 bg-slate-700 rounded text-xs">
								{gasto.tipo}
							</span>
						</td>
						<td class="p-3">{gasto.comentario || '-'}</td>
						<td class="p-3">
							<div class="flex gap-1">
								<button
									onclick={() => editGasto(gasto)}
									class="p-1 hover:bg-blue-600 rounded transition-colors"
									title="Editar"
								>
									<Edit class="w-4 h-4 text-blue-400" />
								</button>
								<button
									onclick={() => deleteGasto(gasto.id)}
									class="p-1 hover:bg-red-600 rounded transition-colors"
									title="Excluir"
								>
									<Trash2 class="w-4 h-4 text-red-400" />
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		
		{#if gastosFixos.length === 0}
			<div class="text-center py-8 text-slate-400">
				Nenhum gasto fixo cadastrado
			</div>
		{/if}
	</div>
</div>

{#if showNewModal}
	<NewFixedExpenseModal
		onclose={() => showNewModal = false}
		onsave={saveNew}
		onnotification={(message, type) => addNotification(message, type)}
	/>
{/if}

{#if showEditModal}
	<EditFixedExpenseModal
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
