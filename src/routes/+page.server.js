import { fail } from '@sveltejs/kit';

// Safe whitelist for payment column lookup
const PAYMENT_COLUMN_MAP = {
	Credito: 'SELECT id FROM pagamento WHERE Credito IS NOT NULL LIMIT 1',
	Debito: 'SELECT id FROM pagamento WHERE Debito IS NOT NULL LIMIT 1',
	Pix: 'SELECT id FROM pagamento WHERE Pix IS NOT NULL LIMIT 1',
	Dinheiro: 'SELECT id FROM pagamento WHERE Dinheiro IS NOT NULL LIMIT 1'
};

/** @type {import('./$types').PageServerLoad} */
export async function load({ platform }) {
	const db = platform.env.DB;

	try {
		const items = await db
			.prepare(
				`
			SELECT 
				i.id,
				i.nome_item,
				i.id_subcategoria,
				s.nome_subcategoria,
				s.id_categoria,
				c.nome_categoria
			FROM itens i
			JOIN subcategorias s ON i.id_subcategoria = s.id
			JOIN categorias c ON s.id_categoria = c.id
			ORDER BY i.nome_item
		`
			)
			.all();

		return {
			items: items.results || []
		};
	} catch (error) {
		console.error('Erro ao carregar itens:', error);
		return { items: [] };
	}
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, platform }) => {
		const db = platform.env.DB;

		try {
			const formData = await request.formData();

			const itemNome = formData.get('item')?.toString().trim();
			const valorRaw = formData.get('valor')?.toString();
			const parcelasRaw = formData.get('parcelas')?.toString();
			const tipo = formData.get('tipo')?.toString();
			const pagamento = formData.get('pagamento')?.toString();
			const comentario = formData.get('comentario')?.toString().trim() || '';
			const dataCompra = formData.get('data_compra')?.toString();

			// Validações básicas
			if (!itemNome) return fail(400, { error: 'Item é obrigatório.' });
			if (!valorRaw || isNaN(parseFloat(valorRaw)))
				return fail(400, { error: 'Valor inválido.' });
			if (!dataCompra) return fail(400, { error: 'Data é obrigatória.' });

			const valorTotal = parseFloat(valorRaw);
			const parcelas = Math.max(1, Math.min(12, parseInt(parcelasRaw) || 1));

			// Busca item com subcategoria e categoria
			const itemResult = await db
				.prepare(
					`
				SELECT 
					i.id AS item_id,
					i.id_subcategoria,
					s.id_categoria
				FROM itens i
				JOIN subcategorias s ON i.id_subcategoria = s.id
				WHERE i.nome_item = ?
				LIMIT 1
			`
				)
				.bind(itemNome)
				.first();

			if (!itemResult) {
				return fail(400, { error: `Item "${itemNome}" não encontrado na base de dados.` });
			}

			// Busca ID do método de pagamento
			const paymentQuery = PAYMENT_COLUMN_MAP[pagamento];
			let paymentId = 1;
			if (paymentQuery) {
				const paymentResult = await db.prepare(paymentQuery).first();
				if (paymentResult) paymentId = paymentResult.id;
			}

			// Calcula valor por parcela (arredonda para 2 casas)
			const valorParcela = Math.round((valorTotal / parcelas) * 100) / 100;
			const dataInicial = new Date(dataCompra + 'T12:00:00');

			// Prepara inserções para cada parcela
			const inserts = [];
			for (let i = 0; i < parcelas; i++) {
				const dataParcela = new Date(dataInicial);
				dataParcela.setMonth(dataParcela.getMonth() + i);
				const dataFormatada = dataParcela.toISOString().split('T')[0];

				let comentarioParcela = comentario;
				if (parcelas > 1) {
					comentarioParcela = `Parcela ${i + 1}/${parcelas}${comentario ? ' - ' + comentario : ''}`;
				}

				inserts.push(
					db
						.prepare(
							`
					INSERT INTO gastos 
						(data_compra, valor, parcelas, id_item, id_categoria, id_subcategoria, tipo, id_pagamento, comentario)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
				`
						)
						.bind(
							dataFormatada,
							valorParcela,
							parcelas,
							itemResult.item_id,
							itemResult.id_categoria,
							itemResult.id_subcategoria,
							tipo || 'variável',
							paymentId,
							comentarioParcela
						)
				);
			}

			await db.batch(inserts);

			return {
				success: true,
				message:
					parcelas > 1
						? `${parcelas} parcelas registradas com sucesso!`
						: 'Gasto registrado com sucesso!'
			};
		} catch (error) {
			console.error('Erro ao registrar gasto:', error);
			return fail(500, { error: 'Erro interno ao registrar gasto. Tente novamente.' });
		}
	}
};