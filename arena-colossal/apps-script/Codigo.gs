/**
 * ARENA COLOSSAL — agenda no Google Calendar, sem servidor.
 * =============================================================================
 *
 * Este arquivo roda DENTRO da conta Google da Arena, como Apps Script. Por
 * isso ele escreve na agenda sem client secret, sem refresh token e sem
 * projeto no Google Cloud: quem autoriza é o dono da conta, uma vez, na
 * primeira publicação.
 *
 * O que ele faz:
 *   GET  ?rota=availability&date=YYYY-MM-DD&service=slug
 *        -> horários REAIS do dia, já descontando o que está na agenda
 *   POST ?rota=bookings
 *        -> valida, confere conflito, cria o evento e avisa por e-mail
 *   POST ?rota=bookings/confirm
 *        -> estado de um agendamento, para a página de acompanhamento
 *
 * SOBRE SEGURANÇA — leia antes de publicar
 * -----------------------------------------------------------------------------
 * A URL publicada é pública: qualquer pessoa que a encontre pode chamá-la.
 * Não existe segredo possível dentro de um site estático — qualquer chave que
 * o navegador use, o visitante lê. A defesa aqui é outra:
 *
 *   1. Nada é aceito sem passar por VALIDAR_ (serviço conhecido, data dentro
 *      da janela, horário dentro do expediente, dado no formato certo).
 *   2. Conflito é conferido na própria agenda antes de criar o evento.
 *   3. Limite por e-mail e por dia, guardado em PropertiesService.
 *   4. O evento nasce com o prefixo [SITE] e a Arena vê tudo — apagar um
 *      pedido falso custa dois toques.
 *
 * O script NUNCA lê nem devolve a agenda inteira: a rota de disponibilidade
 * responde apenas "livre" ou "ocupado" por horário. Título, participante e
 * descrição dos seus outros compromissos não saem daqui.
 */

// =============================================================================
// 1. CONFIGURAÇÃO — ajuste aqui e publique de novo
// =============================================================================
const CFG = {
  // 'primary' = a agenda principal da conta. Para usar outra, cole o ID dela
  // (Configurações da agenda > Integrar agenda > ID da agenda).
  CALENDARIO: 'primary',
  FUSO: 'America/Sao_Paulo',

  // 0 = domingo ... 6 = sábado. Dia ausente = fechado.
  HORARIOS: {
    1: [['08:00', '18:00']],
    2: [['08:00', '18:00']],
    3: [['08:00', '18:00']],
    4: [['08:00', '18:00']],
    5: [['08:00', '18:00']],
    6: [['08:00', '12:00']],
  },

  PASSO_MIN: 30,          // de quanto em quanto tempo a grade oferece horário
  ANTECEDENCIA_H: 12,     // antecedência mínima para agendar
  JANELA_DIAS: 60,        // até quantos dias à frente
  SIMULTANEOS: 1,         // quantos veículos a Arena atende ao mesmo tempo
  BLOQUEIOS: [],          // ['2026-12-25', '2026-12-31']

  SERVICOS: {
    'lavagem-tecnica': { nome: 'Lavagem Técnica / Detalhada', min: 120 },
    'higienizacao-interna': { nome: 'Higienização Interna', min: 180 },
    'higienizacao-couro': { nome: 'Higienização de Couro', min: 120 },
    'higienizacao-ar-condicionado': { nome: 'Higienização do Ar-Condicionado', min: 60 },
    'descontaminacao': { nome: 'Descontaminação', min: 90 },
    'polimento-tecnico': { nome: 'Polimento Técnico', min: 480 },
    'vitrificacao': { nome: 'Vitrificação', min: 480 },
    'protecao-plasticos': { nome: 'Proteção de Plásticos', min: 60 },
    'protecao-pneus': { nome: 'Proteção de Pneus', min: 45 },
    'restauracao-farois': { nome: 'Restauração / Proteção de Faróis', min: 180 },
  },

  EMAIL_INTERNO: 'edinelson.yeshua@gmail.com',
  ENDERECO: 'Av. dos Tucanos, 286 — Ariribá, Balneário Camboriú — SC, 88338-610',
  WHATSAPP_ARENA: '5547992228325',

  MAX_POR_EMAIL_POR_DIA: 3,
  PREFIXO: '[SITE]',
};

// =============================================================================
// 2. ENTRADAS
// =============================================================================
function doGet(e) {
  return responder(despachar('GET', e, null));
}

function doPost(e) {
  var corpo = {};
  try {
    corpo = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return responder({ ok: false, code: 'invalid_request', message: 'Não foi possível ler o pedido.' });
  }
  return responder(despachar('POST', e, corpo));
}

function despachar(metodo, e, corpo) {
  var rota = (e && e.parameter && e.parameter.rota) || '';
  try {
    if (metodo === 'GET' && rota === 'availability') return rotaDisponibilidade(e.parameter);
    if (metodo === 'GET' && rota === 'health') return { ok: true, status: 'ready', calendario: CFG.CALENDARIO };
    if (metodo === 'POST' && rota === 'bookings') return rotaAgendar(corpo);
    if (metodo === 'POST' && rota === 'bookings/confirm') return rotaConsultar(corpo);
    return { ok: false, code: 'not_found', message: 'Rota desconhecida.' };
  } catch (err) {
    // O erro real fica no log da Arena; o visitante recebe uma frase útil.
    console.error(rota, err && err.stack ? err.stack : err);
    return { ok: false, code: 'server_error', message: 'Não conseguimos processar agora. Tente novamente ou chame no WhatsApp.' };
  }
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// =============================================================================
// 3. DISPONIBILIDADE
// =============================================================================
function rotaDisponibilidade(p) {
  var data = String((p && p.date) || '');
  var slug = String((p && p.service) || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { ok: false, code: 'invalid_request', message: 'Data inválida.' };
  var servico = CFG.SERVICOS[slug];
  if (!servico) return { ok: false, code: 'invalid_request', message: 'Serviço desconhecido.' };

  return {
    ok: true,
    date: data,
    service: slug,
    timezone: CFG.FUSO,
    scheduleConfigured: true,
    degraded: false,
    slots: gradeDoDia(data, servico.min),
    window: janela(),
  };
}

function janela() {
  var agora = new Date();
  var primeiro = new Date(agora.getTime() + CFG.ANTECEDENCIA_H * 3600e3);
  var ultimo = new Date(agora.getTime() + CFG.JANELA_DIAS * 86400e3);
  return { first: iso(primeiro), last: iso(ultimo) };
}

/** Horários do dia, já descontando o que a agenda mostra como ocupado. */
function gradeDoDia(data, minutos) {
  if (CFG.BLOQUEIOS.indexOf(data) !== -1) return [];
  var janelas = CFG.HORARIOS[diaDaSemana(data)];
  if (!janelas || !janelas.length) return [];

  var limite = new Date(Date.now() + CFG.ANTECEDENCIA_H * 3600e3);
  var ocupados = eventosDoDia(data);
  var slots = [];

  for (var j = 0; j < janelas.length; j++) {
    var abre = paraMin(janelas[j][0]);
    var fecha = paraMin(janelas[j][1]);
    for (var m = abre; m + minutos <= fecha; m += CFG.PASSO_MIN) {
      var inicio = instante(data, m);
      var fim = new Date(inicio.getTime() + minutos * 60000);
      if (inicio < limite) continue;
      slots.push({ time: paraHora(m), available: cabe(inicio, fim, ocupados) });
    }
  }
  return slots;
}

/** Só os instantes, nunca o conteúdo: nenhum dado de outro compromisso sai. */
function eventosDoDia(data) {
  var cal = agenda();
  var d0 = instante(data, 0);
  var d1 = new Date(d0.getTime() + 36 * 3600e3); // pega o que atravessa a virada
  return cal.getEvents(d0, d1)
    .filter(function (ev) { return !ev.isAllDayEvent(); })
    .map(function (ev) { return { i: ev.getStartTime().getTime(), f: ev.getEndTime().getTime() }; });
}

function cabe(inicio, fim, ocupados) {
  var i = inicio.getTime(), f = fim.getTime(), n = 0;
  for (var k = 0; k < ocupados.length; k++) {
    if (ocupados[k].i < f && i < ocupados[k].f) n++;
  }
  return n < CFG.SIMULTANEOS;
}

function agenda() {
  var cal = CFG.CALENDARIO === 'primary'
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(CFG.CALENDARIO);
  if (!cal) throw new Error('Agenda não encontrada: ' + CFG.CALENDARIO);
  return cal;
}

// =============================================================================
// 4. AGENDAR
// =============================================================================
function rotaAgendar(c) {
  var erro = validar(c);
  if (erro) return { ok: false, code: 'invalid_request', message: erro };

  // Honeypot: o site manda um campo invisível que só robô preenche.
  if (String(c.website || '').trim() !== '') {
    return { ok: false, code: 'invalid_request', message: 'Não foi possível concluir o agendamento.' };
  }

  var servico = CFG.SERVICOS[c.serviceSlug];
  var inicio = instante(c.date, paraMin(c.time));
  var fim = new Date(inicio.getTime() + servico.min * 60000);

  if (inicio < new Date(Date.now() + CFG.ANTECEDENCIA_H * 3600e3)) {
    return { ok: false, code: 'invalid_slot', message: 'Esse horário já passou da antecedência mínima.' };
  }
  if (!dentroDoExpediente(c.date, paraMin(c.time), servico.min)) {
    return { ok: false, code: 'invalid_slot', message: 'Esse horário está fora do atendimento.' };
  }
  if (excedeuLimite(c.email)) {
    return { ok: false, code: 'rate_limited', message: 'Recebemos vários pedidos deste contato hoje. Fale com a Arena pelo WhatsApp.' };
  }

  // Trava: dois pedidos no mesmo segundo não podem virar dois eventos.
  var trava = LockService.getScriptLock();
  try {
    trava.waitLock(15000);
  } catch (err) {
    return { ok: false, code: 'server_error', message: 'A agenda está ocupada neste instante. Tente de novo.' };
  }

  try {
    if (!cabe(inicio, fim, eventosDoDia(c.date))) {
      return { ok: false, code: 'slot_taken', message: 'Esse horário acabou de ser reservado. Escolha outro horário disponível.' };
    }

    var veiculo = [c.vehicleBrand, c.vehicleModel, c.vehicleYear].filter(Boolean).join(' ');
    var evento = agenda().createEvent(
      CFG.PREFIXO + ' ' + servico.nome + ' — ' + c.name,
      inicio, fim,
      {
        description: [
          'Serviço: ' + servico.nome,
          'Cliente: ' + c.name,
          'WhatsApp: ' + c.phone,
          'E-mail: ' + (c.email || '—'),
          'Veículo: ' + (veiculo || '—'),
          'Observações: ' + (c.notes || '—'),
          '',
          'Agendado pelo site.',
        ].join('\n'),
        location: CFG.ENDERECO,
      }
    );

    registrarLimite(c.email);
    avisar(evento.getId(), c, servico, inicio, fim, veiculo);

    return {
      ok: true,
      booking: {
        id: evento.getId(),
        serviceName: servico.nome,
        serviceSlug: c.serviceSlug,
        date: c.date,
        time: c.time,
        timeRange: c.time + ' – ' + paraHora(paraMin(c.time) + servico.min),
        vehicle: veiculo,
        customerName: c.name,
        startsAt: inicio.toISOString(),
        endsAt: fim.toISOString(),
      },
    };
  } finally {
    trava.releaseLock();
  }
}

function validar(c) {
  if (!c || typeof c !== 'object') return 'Pedido vazio.';
  if (!CFG.SERVICOS[c.serviceSlug]) return 'Escolha um serviço válido.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(c.date || ''))) return 'Data inválida.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(c.time || ''))) return 'Horário inválido.';
  if (String(c.name || '').trim().length < 3) return 'Informe o nome completo.';
  if (String(c.phone || '').replace(/\D/g, '').length < 10) return 'Informe um WhatsApp válido com DDD.';
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(c.email).trim())) return 'E-mail inválido.';
  if (String(c.vehicleBrand || '').trim().length < 2) return 'Informe a marca do veículo.';
  if (String(c.vehicleModel || '').trim().length < 1) return 'Informe o modelo do veículo.';
  if (c.consent !== true) return 'É necessário autorizar o contato sobre o agendamento.';
  if (String(c.notes || '').length > 600) return 'Observações longas demais.';
  var d = new Date(c.date + 'T12:00:00Z');
  if (isNaN(d.getTime())) return 'Data inválida.';
  if (d > new Date(Date.now() + (CFG.JANELA_DIAS + 1) * 86400e3)) return 'Data fora da janela de agendamento.';
  return null;
}

function dentroDoExpediente(data, minuto, duracao) {
  if (CFG.BLOQUEIOS.indexOf(data) !== -1) return false;
  var janelas = CFG.HORARIOS[diaDaSemana(data)];
  if (!janelas) return false;
  for (var j = 0; j < janelas.length; j++) {
    if (minuto >= paraMin(janelas[j][0]) && minuto + duracao <= paraMin(janelas[j][1])) return true;
  }
  return false;
}

function excedeuLimite(email) {
  if (!email) return false;
  var props = PropertiesService.getScriptProperties();
  var chave = 'lim_' + hojeISO() + '_' + String(email).toLowerCase().trim();
  return Number(props.getProperty(chave) || 0) >= CFG.MAX_POR_EMAIL_POR_DIA;
}

function registrarLimite(email) {
  if (!email) return;
  var props = PropertiesService.getScriptProperties();
  var chave = 'lim_' + hojeISO() + '_' + String(email).toLowerCase().trim();
  props.setProperty(chave, String(Number(props.getProperty(chave) || 0) + 1));
}

// =============================================================================
// 5. AVISOS
// =============================================================================
function avisar(id, c, servico, inicio, fim, veiculo) {
  var quando = Utilities.formatDate(inicio, CFG.FUSO, "EEEE, dd/MM/yyyy 'às' HH:mm");
  var linhas = [
    'Serviço: ' + servico.nome,
    'Data: ' + quando,
    'Duração prevista: ' + Math.round(servico.min / 60 * 10) / 10 + 'h',
    'Veículo: ' + (veiculo || '—'),
  ];

  // Interno: chega com tudo e com o link direto da conversa.
  try {
    MailApp.sendEmail({
      to: CFG.EMAIL_INTERNO,
      subject: 'Novo agendamento — ' + servico.nome + ' — ' + quando,
      body: linhas.concat([
        'Cliente: ' + c.name,
        'WhatsApp: ' + c.phone,
        'E-mail: ' + (c.email || '—'),
        'Observações: ' + (c.notes || '—'),
        '',
        'Abrir conversa: https://wa.me/' + e164(c.phone),
      ]).join('\n'),
    });
  } catch (err) {
    console.error('e-mail interno', err);
  }

  // Cliente: só se ele tiver deixado e-mail — no site o campo é opcional.
  if (c.email) {
    try {
      MailApp.sendEmail({
        to: c.email,
        subject: 'Agendamento confirmado — Arena Colossal',
        body: [
          'Olá, ' + c.name + '!',
          '',
          'Seu horário está reservado na agenda da Arena Colossal.',
          '',
        ].concat(linhas).concat([
          'Endereço: ' + CFG.ENDERECO,
          '',
          'Precisa remarcar ou tirar uma dúvida? Chame no WhatsApp:',
          'https://wa.me/' + CFG.WHATSAPP_ARENA,
          '',
          'Arena Colossal — Estética Automotiva',
        ]).join('\n'),
      });
    } catch (err) {
      console.error('e-mail do cliente', err);
    }
  }
}

// =============================================================================
// 6. CONSULTA
// =============================================================================
function rotaConsultar(c) {
  var id = String((c && c.bookingId) || '');
  if (!id) return { ok: false, code: 'invalid_request', message: 'Identificador ausente.' };

  var ev = null;
  try { ev = agenda().getEventById(id); } catch (err) { ev = null; }
  if (!ev) return { ok: false, code: 'not_found', message: 'Agendamento não encontrado.' };

  var titulo = ev.getTitle() || '';
  // Só devolve o que o próprio site criou, e sem nenhum dado pessoal:
  // o identificador circula por e-mail e barra de endereço, e não pode
  // virar chave de acesso ao nome ou ao telefone de ninguém.
  if (titulo.indexOf(CFG.PREFIXO) !== 0) {
    return { ok: false, code: 'not_found', message: 'Agendamento não encontrado.' };
  }

  var inicio = ev.getStartTime();
  var nome = titulo.replace(CFG.PREFIXO, '').split('—')[0].trim();
  return {
    ok: true,
    booking: {
      id: id,
      status: 'confirmed',
      serviceName: nome,
      date: Utilities.formatDate(inicio, CFG.FUSO, 'yyyy-MM-dd'),
      time: Utilities.formatDate(inicio, CFG.FUSO, 'HH:mm'),
      timeRange: Utilities.formatDate(inicio, CFG.FUSO, 'HH:mm') + ' – ' +
                 Utilities.formatDate(ev.getEndTime(), CFG.FUSO, 'HH:mm'),
      calendarSynced: true,
    },
    notifications: [
      { channel: 'calendar', status: 'sent' },
      { channel: 'email_internal', status: 'sent' },
      { channel: 'email_customer', status: 'sent' },
    ],
  };
}

// =============================================================================
// 7. TEMPO — tudo no fuso da operação, nunca no do servidor
// =============================================================================
/**
 * Converte "2026-09-30" + minutos para o instante real, no fuso da operação.
 * O Brasil não usa horário de verão hoje, mas já usou e pode voltar a usar —
 * por isso a segunda passada: se o deslocamento no instante calculado for
 * diferente do deslocamento do meio-dia daquele dia, refaz a conta com ele.
 */
function instante(data, minuto) {
  var p = data.split('-');
  var Y = Number(p[0]), M = Number(p[1]) - 1, D = Number(p[2]);
  var h = Math.floor(minuto / 60), mi = minuto % 60;

  var meioDia = new Date(Date.UTC(Y, M, D, 15, 0, 0));
  var offDia = deslocamento(meioDia);
  var d = new Date(Date.UTC(Y, M, D, h, mi, 0) - offDia);

  var offReal = deslocamento(d);
  if (offReal !== offDia) d = new Date(Date.UTC(Y, M, D, h, mi, 0) - offReal);
  return d;
}

/** Diferença, em milissegundos, entre o fuso da operação e o UTC. */
function deslocamento(quando) {
  var txt = Utilities.formatDate(quando, CFG.FUSO, 'Z'); // ex.: -0300
  var sinal = txt.charAt(0) === '-' ? -1 : 1;
  var h = Number(txt.substr(1, 2)), m = Number(txt.substr(3, 2));
  return sinal * (h * 60 + m) * 60000;
}

function diaDaSemana(data) {
  var p = data.split('-');
  return new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]))).getUTCDay();
}

function iso(d) { return Utilities.formatDate(d, CFG.FUSO, 'yyyy-MM-dd'); }
function hojeISO() { return iso(new Date()); }
function paraMin(hhmm) { var p = hhmm.split(':'); return Number(p[0]) * 60 + Number(p[1]); }

/** Telefone em E.164 só com dígitos, com o 55 na frente uma única vez. */
function e164(tel) {
  var d = String(tel || '').replace(/\D/g, '');
  if (d.length > 11 && d.indexOf('55') === 0) return d;   // já veio com DDI
  return '55' + d;
}
function paraHora(m) {
  var h = Math.floor(m / 60), r = m % 60;
  return (h < 10 ? '0' : '') + h + ':' + (r < 10 ? '0' : '') + r;
}

// =============================================================================
// 8. TESTE — rode uma vez pelo editor, antes de publicar
// =============================================================================
function testar() {
  var amanha = iso(new Date(Date.now() + 2 * 86400e3));
  var r = rotaDisponibilidade({ date: amanha, service: 'lavagem-tecnica' });
  console.log('Agenda:', agenda().getName());
  console.log('Dia testado:', amanha);
  console.log('Horários:', JSON.stringify(r.slots));
  var livres = (r.slots || []).filter(function (s) { return s.available; }).length;
  console.log(livres + ' livres de ' + (r.slots || []).length);
}
