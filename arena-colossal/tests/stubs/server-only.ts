// Substituto do pacote `server-only` nos testes.
//
// Aquele pacote existe para QUEBRAR O BUILD se um componente de cliente
// importar código de servidor — é uma proteção de bundler, não de runtime.
// Rodando em Node puro, fora do Next, ele não resolve; este stub o substitui
// sem afetar a garantia real, que continua valendo no build de produção.
export {};
