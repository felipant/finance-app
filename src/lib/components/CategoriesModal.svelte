<script lang="ts">
	import { X, Plus, Trash2 } from 'lucide-svelte';
	
	let { onclose, onnotification } = $props();
	
	let categories = $state([]);
	let subcategories = $state([]);
	let items = $state([]);
	let loading = $state(false);
	
	// Form states
	let newCategory = $state('');
	let newSubcategory = $state('');
	let newItem = $state('');
	let selectedCategory = $state(null);
	let selectedSubcategory = $state(null);
	
	async function loadData() {
		loading = true;
		try {
			const [catsRes, subcatsRes, itemsRes] = await Promise.all([
				fetch('/api/categories'),
				fetch('/api/subcategories'),
				fetch('/api/items')
			]);
			
			if (catsRes.ok) categories = await catsRes.json();
			if (subcatsRes.ok) subcategories = await subcatsRes.json();
			if (itemsRes.ok) items = await itemsRes.json();
		} catch (error) {
			onnotification('Erro ao carregar dados', 'error');
		} finally {
			loading = false;
		}
	}
	
	async function addCategory() {
		if (!newCategory.trim()) return;
		
		try {
			const response = await fetch('/api/categories', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nome_categoria: newCategory })
			});
			
			if (response.ok) {
				onnotification('Categoria adicionada com sucesso', 'success');
				newCategory = '';
				await loadData();
			}
		} catch (error) {
			onnotification('Erro ao adicionar categoria', 'error');
		}
	}
	
	function handleCategoryKeydown(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addCategory();
		}
	}
	
	async function deleteCategory(id) {
		try {
			const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
			if (response.ok) {
				onnotification('Categoria excluída com sucesso', 'success');
				await loadData();
			}
		} catch (error) {
			onnotification('Erro ao excluir categoria', 'error');
		}
	}
	
	async function addSubcategory(categoryId) {
		if (!newSubcategory.trim()) return;
		
		try {
			const response = await fetch('/api/subcategories', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					nome_subcategoria: newSubcategory,
					id_categoria: categoryId 
				})
			});
			
			if (response.ok) {
				onnotification('Subcategoria adicionada com sucesso', 'success');
				newSubcategory = '';
				await loadData();
			}
		} catch (error) {
			onnotification('Erro ao adicionar subcategoria', 'error');
		}
	}
	
	function handleSubcategoryKeydown(event, categoryId) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addSubcategory(categoryId);
		}
	}
	
	async function deleteSubcategory(id) {
		try {
			const response = await fetch(`/api/subcategories/${id}`, { method: 'DELETE' });
			if (response.ok) {
				onnotification('Subcategoria excluída com sucesso', 'success');
				await loadData();
			}
		} catch (error) {
			onnotification('Erro ao excluir subcategoria', 'error');
		}
	}
	
	async function addItem(subcategoryId) {
		if (!newItem.trim()) return;
		
		try {
			const response = await fetch('/api/items', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					nome_item: newItem,
					id_subcategoria: subcategoryId 
				})
			});
			
			if (response.ok) {
				onnotification('Item adicionado com sucesso', 'success');
				newItem = '';
				await loadData();
			}
		} catch (error) {
			onnotification('Erro ao adicionar item', 'error');
		}
	}
	
	function handleItemKeydown(event, subcategoryId) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addItem(subcategoryId);
		}
	}
	
	async function deleteItem(id) {
		try {
			const response = await fetch(`/api/items/${id}`, { method: 'DELETE' });
			if (response.ok) {
				onnotification('Item excluído com sucesso', 'success');
				await loadData();
			}
		} catch (error) {
			onnotification('Erro ao excluir item', 'error');
		}
	}
	
	function getSubcategories(categoryId) {
		return subcategories.filter(sub => sub.id_categoria === categoryId);
	}
	
	function getItems(subcategoryId) {
		return items.filter(item => item.id_subcategoria === subcategoryId);
	}
	
	// Load data on mount
	$effect(() => {
		loadData();
	});
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
	<div class="bg-slate-900 border border-slate-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
		<div class="flex items-center justify-between p-6 border-b border-slate-700">
			<h2 class="text-2xl font-bold text-white">Gerenciamento de Categorias</h2>
			<button
				onclick={onclose}
				class="p-2 hover:bg-slate-800 rounded-lg transition-colors"
			>
				<X class="w-5 h-5 text-slate-400" />
			</button>
		</div>
		
		<div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
			{#if loading}
				<div class="text-center py-8">
					<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
					<p class="mt-2 text-slate-400">Carregando...</p>
				</div>
			{:else}
				<!-- Add New Category -->
				<div class="mb-6 p-4 bg-slate-800 rounded-lg">
					<h3 class="text-lg font-semibold text-white mb-3">Nova Categoria</h3>
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={newCategory}
							placeholder="Nome da categoria"
							class="input-field flex-1"
							onkeydown={handleCategoryKeydown}
						/>
						<button onclick={addCategory} class="btn-primary">
							<Plus class="w-4 h-4" />
						</button>
					</div>
				</div>
				
				<!-- Categories Hierarchy -->
				<div class="space-y-4">
					{#each categories as category}
						<div class="bg-slate-800 rounded-lg p-4">
							<div class="flex items-center justify-between mb-3">
								<h3 class="text-lg font-semibold text-white">{category.nome_categoria}</h3>
								<button
									onclick={() => deleteCategory(category.id)}
									class="p-1 hover:bg-red-600 rounded transition-colors"
								>
									<Trash2 class="w-4 h-4 text-red-400" />
								</button>
							</div>
							
							<!-- Add New Subcategory -->
							<div class="mb-3 flex gap-2">
								<input
									type="text"
									bind:value={newSubcategory}
									placeholder="Nova subcategoria"
									class="input-field flex-1 text-sm"
									onkeydown={(e) => handleSubcategoryKeydown(e, category.id)}
								/>
								<button 
									onclick={() => addSubcategory(category.id)}
									class="btn-secondary text-sm px-3 py-1"
								>
									<Plus class="w-3 h-3" />
								</button>
							</div>
							
							<!-- Subcategories -->
							<div class="space-y-2 ml-4">
								{#each getSubcategories(category.id) as subcategory}
									<div class="bg-slate-700 rounded-lg p-3">
										<div class="flex items-center justify-between mb-2">
											<h4 class="text-sm font-medium text-white">{subcategory.nome_subcategoria}</h4>
											<button
												onclick={() => deleteSubcategory(subcategory.id)}
												class="p-1 hover:bg-red-600 rounded transition-colors"
											>
												<Trash2 class="w-3 h-3 text-red-400" />
											</button>
										</div>
										
										<!-- Add New Item -->
										<div class="mb-2 flex gap-2">
											<input
												type="text"
												bind:value={newItem}
												placeholder="Novo item"
												class="input-field flex-1 text-xs"
												onkeydown={(e) => handleItemKeydown(e, subcategory.id)}
											/>
											<button 
												onclick={() => addItem(subcategory.id)}
												class="btn-secondary text-xs px-2 py-1"
											>
												<Plus class="w-3 h-3" />
											</button>
										</div>
										
										<!-- Items -->
										<div class="flex flex-wrap gap-1 ml-4">
											{#each getItems(subcategory.id) as item}
												<div class="flex items-center gap-1 bg-slate-600 px-2 py-1 rounded text-xs text-white">
													<span>{item.nome_item}</span>
													<button
														onclick={() => deleteItem(item.id)}
														class="hover:text-red-400 transition-colors"
													>
														<Trash2 class="w-3 h-3" />
													</button>
												</div>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
