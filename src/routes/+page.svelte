<script lang="ts">
	import { enhance } from '$app/forms';
	import { Settings, Plus, Calendar, Search, CheckCircle2, AlertCircle } from 'lucide-svelte';
	import CategoriesModal from '$lib/components/CategoriesModal.svelte';
	import MultiplePurchasesModal from '$lib/components/MultiplePurchasesModal.svelte';
	import ToastNotifications from '$lib/components/ToastNotifications.svelte';

	let { data, form } = $props();

	// ─── Estado do Formulário ───────────────────────────────────────────────
	let formData = $state({
		data_compra: new Date().toISOString().split('T')[0],
		item: '',
		valor: '',
		parcelas: '1',
		tipo: 'variável',
		pagamento: 'Credito',
		comentario: ''
	});

	let selectedItem = $state<null | {
		id: number;
		nome_item: string;
		nome_subcategoria: string;
		nome_categoria: string;
		id_subcategoria: number;
		id_categoria: number;
	}>(null);

	let showDropdown = $state(false);
	let isSubmitting = $state(false);
	let showCategoriesModal = $state(false);
	let showMultipleModal = $state(false);
	let notifications = $state<{ id: number; message: string; type: string }[]>([]);

	const items = $derived(data.items || []);

	// ─── Filtro de itens para autocomplete ─────────────────────────────────
	const filteredItems = $derived(
		formData.item.length > 0 && !selectedItem
			? items
					.filter((it) => it.nome_item.toLowerCase().includes(formData.item.toLowerCase()))
					.slice(0, 7)
			: []
	);

	// ─── Helpers ────────────────────────────────────────────────────────────
	function selectItem(item: (typeof items)[0]) {
		selectedItem = item;
		formData.item = item.nome_item;
		showDropdown = false;
	}

	function clearItem() {
		selectedItem = null;
		formData.item = '';
		showDropdown = false;
	}

	function onItemInput() {
		selectedItem = null;
		showDropdown = true;
	}

	function onItemBlur() {
		// Pequeno delay para permitir clique no dropdown
		setTimeout(() => {
			showDropdown = false;
		}, 150);
	}

	function resetForm() {
		formData = {
			data_compra: new Date().toISOString().split('T')[0],
			item: '',
			valor: '',
			parcelas: '1',
			tipo: 'variável',
			pagamento: 'Credito',
			comentario: ''
		};
		selectedItem = null;
		showDropdown = false;
	}

	function addNotification(message: string, type = 'success') {
		const id = Date.now();
		notifications = [...notifications, { id, message, type }];
		setTimeout(() => {
			notifications = notifications.filter((n) => n.id !== id);
		}, 4000);
	}

	// ─── Reage ao resultado do form (SSR action) ────────────────────────────
	$effect(() => {
		if (form?.success) {
			addNotification(form.message || 'Gasto registrado com sucesso!', 'success');
			resetForm();
		} else if (form?.error) {
			addNotification(form.error, 'error');
		}
	});
</script>

<div class="max-w-4xl mx-auto">
	<!-- ── Cabeçalho ─────────────────────────────────────────────────────── -->
	<div class="flex flex-wrap justify-between items-center mb-6 gap-3">
		<h2 class="text-2xl font-bold text-white">Lançamento de Gastos</h2>

		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => (showCategoriesModal = true)}
				class="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
			>
				<Settings class="w-4 h-4" />
				Categorias
			</button>

			<button
				type="button"
				onclick={() => (showMultipleModal = true)}
				class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
			>
				<Plus class="w-4 h-4" />
				Lançar múltiplas compras
			</button>
		</div>
	</div>

	<!-- ── Formulário Principal ──────────────────────────────────────────── -->
	<form
		method="POST"
		class="card bg-slate-900 border border-white/10 rounded-xl p-6 shadow-xl"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result, update }) => {
				isSubmitting = false;
				await update({ reset: false }); // mantemos nosso próprio reset
			};
		}}
	>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<!-- Data -->
			<div>
				<label class="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
					<Calendar class="w-3.5 h-3.5 inline mr-1" />
					Data <span class="text-red-400">*</span>
				</label>
				<input
					type="date"
					name="data_compra"
					bind:value={formData.data_compra}
					required
					class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
				/>
			</div>

			<!-- Item (autocomplete) — 2 colunas -->
			<div class="relative md:col-span-2">
				<label class="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
					<Search class="w-3.5 h-3.5 inline mr-1" />
					Item <span class="text-red-400">*</span>
				</label>
				<input
					type="text"
					name="item"
					bind:value={formData.item}
					oninput={onItemInput}
					onblur={onItemBlur}
					onfocus={() => (showDropdown = true)}
					autocomplete="off"
					required
					placeholder="Digite para buscar um item…"
					class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
				/>

				{#if showDropdown && filteredItems.length > 0}
					<div
						class="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden"
					>
						{#each filteredItems as item}
							<button
								type="button"
								onmousedown={() => selectItem(item)}
								class="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors flex justify-between items-center gap-4"
							>
								<span class="text-white font-medium text-sm">{item.nome_item}</span>
								<span class="text-xs text-slate-400 shrink-0"
									>{item.nome_categoria} / {item.nome_subcategoria}</span
								>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Subcategoria (read-only) -->
			<div>
				<label class="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
					Subcategoria
				</label>
				<input
					type="text"
					value={selectedItem?.nome_subcategoria ?? ''}
					readonly
					tabindex="-1"
					placeholder="Preenchido ao selecionar item"
					class="w-full bg-slate-700/50 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 cursor-default text-sm"
				/>
			</div>

			<!-- Categoria (read-only) -->
			<div>
				<label class="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
					Categoria
				</label>
				<input
					type="text"
					value={selectedItem?.nome_categoria ?? ''}
					readonly
					tabindex="-1"
					placeholder="Preenchido ao selecionar item"
					class="w-full bg-slate-700/50 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 cursor-default text-sm"
				/>
			</div>

			<!-- Valor -->
			<div>
				<label class="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
					Valor (R$) <span class="text-red-400">*</span>
				</label>
				<input
					type="number"
					name="valor"
					bind:value={formData.valor}
					step="0.01"
					min="0.01"
					required
					placeholder="0,00"
					class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
				/>
			</div>

			<!-- Parcelas -->
			<div>
				<label class="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
					Parcelas <span class="text-red-400">*</span>
				</label>
				<select
					name="parcelas"
					bind:value={formData.parcelas}
					class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
				>
					{#each Array(12) as _, i}
						<option value={String(i + 1)}>{i + 1}x</option>
					{/each}
				</select>
			</div>

			<!-- Tipo -->
			<div>
				<label class="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
					Tipo <span class="text-red-400">*</span>
				</label>
				<select
					name="tipo"
					bind:value={formData.tipo}
					class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
				>
					<option value="variável">Variável</option>
					<option value="fixo">Fixo</option>
				</select>
			</div>

			<!-- Pagamento -->
			<div>
				<label class="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
					Pagamento <span class="text-red-400">*</span>
				</label>
				<select
					name="pagamento"
					bind:value={formData.pagamento}
					class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
				>
					<option value="Credito">Crédito</option>
					<option value="Debito">Débito</option>
					<option value="Dinheiro">Dinheiro</option>
					<option value="Pix">Pix</option>
				</select>
			</div>

			<!-- Comentário — full width -->
			<div class="lg:col-span-3">
				<label class="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">
					Comentário
					<span class="text-slate-500 normal-case font-normal ml-1">(opcional)</span>
				</label>
				<textarea
					name="comentario"
					bind:value={formData.comentario}
					rows="2"
					placeholder="Observações adicionais…"
					class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
				></textarea>
			</div>
		</div>

		<!-- Rodapé do formulário -->
		<div class="mt-6 flex items-center justify-between gap-4">
			<!-- Feedback inline de parcelas -->
			{#if parseInt(formData.parcelas) > 1 && formData.valor}
				<p class="text-sm text-slate-400">
					≈ <span class="text-white font-semibold"
						>R$ {(parseFloat(formData.valor) / parseInt(formData.parcelas)).toFixed(2)}</span
					> por parcela
				</p>
			{:else}
				<div></div>
			{/if}

			<div class="flex gap-3">
				<button
					type="button"
					onclick={resetForm}
					class="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
				>
					Limpar
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					class="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-wait text-white rounded-lg font-semibold transition-all shadow-lg active:scale-95 text-sm"
				>
					{#if isSubmitting}
						<span
							class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
						></span>
						Registrando…
					{:else}
						<CheckCircle2 class="w-4 h-4" />
						Registrar Gasto
					{/if}
				</button>
			</div>
		</div>
	</form>
</div>

<!-- ── Modais ─────────────────────────────────────────────────────────────── -->
{#if showCategoriesModal}
	<CategoriesModal
		onclose={() => (showCategoriesModal = false)}
		onnotification={(msg, type) => addNotification(msg, type)}
	/>
{/if}

{#if showMultipleModal}
	<MultiplePurchasesModal
		onclose={() => (showMultipleModal = false)}
		onnotification={(msg, type) => addNotification(msg, type)}
	/>
{/if}

<ToastNotifications {notifications} />