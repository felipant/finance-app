-- Schema for Finance App Database (Cloudflare D1)

-- Categories table
CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_categoria TEXT NOT NULL
);

-- Subcategories table
CREATE TABLE subcategorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_categoria INTEGER NOT NULL,
    nome_subcategoria TEXT NOT NULL,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id)
);

-- Items table
CREATE TABLE itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_subcategoria INTEGER NOT NULL,
    nome_item TEXT NOT NULL,
    FOREIGN KEY (id_subcategoria) REFERENCES subcategorias(id)
);

-- Payment methods table
CREATE TABLE pagamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    Pix TEXT,
    Credito TEXT,
    Dinheiro TEXT,
    Debito TEXT
);

-- Expenses table
CREATE TABLE gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_compra TEXT NOT NULL,
    valor REAL NOT NULL,
    parcelas INTEGER,
    id_item INTEGER NOT NULL,
    id_categoria INTEGER NOT NULL,
    id_subcategoria INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('fixo', 'variável')),
    id_pagamento INTEGER NOT NULL,
    comentario TEXT,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id),
    FOREIGN KEY (id_subcategoria) REFERENCES subcategorias(id),
    FOREIGN KEY (id_item) REFERENCES itens(id),
    FOREIGN KEY (id_pagamento) REFERENCES pagamento(id)
);

-- Fixed expenses table
CREATE TABLE gastos_fixos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valor REAL NOT NULL,
    id_categoria INTEGER NOT NULL,
    id_subcategoria INTEGER NOT NULL,
    id_item INTEGER NOT NULL,
    tipo TEXT DEFAULT 'fixo',
    comentario TEXT,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id),
    FOREIGN KEY (id_subcategoria) REFERENCES subcategorias(id),
    FOREIGN KEY (id_item) REFERENCES itens(id)
);
