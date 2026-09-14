/**
 * Erros de dominio.
 *
 * Existem para a borda (server action, rota, job) traduzir falha em resposta
 * sem inspecionar mensagem de string. Cada um carrega o que a interface precisa
 * para explicar o que aconteceu em portugues.
 */

export type ErrorCode =
  | "nao_autenticado"
  | "sem_permissao"
  | "nao_encontrado"
  | "conflito"
  | "dados_invalidos"
  | "regra_de_negocio"
  | "isolamento";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { status?: number; details?: Record<string, string[]>; cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.code = code;
    this.status = options?.status ?? defaultStatus(code);
    if (options?.details) this.details = options.details;
  }
}

function defaultStatus(code: ErrorCode): number {
  switch (code) {
    case "nao_autenticado":
      return 401;
    case "sem_permissao":
    case "isolamento":
      return 403;
    case "nao_encontrado":
      return 404;
    case "conflito":
      return 409;
    case "dados_invalidos":
      return 422;
    case "regra_de_negocio":
      return 400;
  }
}

export class NotAuthenticated extends AppError {
  constructor(message = "Sessao expirada. Entre novamente.") {
    super("nao_autenticado", message);
  }
}

export class Forbidden extends AppError {
  readonly permission?: string;

  constructor(message: string, permission?: string) {
    super("sem_permissao", message);
    if (permission) this.permission = permission;
  }
}

export class NotFound extends AppError {
  constructor(what = "Registro") {
    super("nao_encontrado", `${what} nao encontrado.`);
  }
}

export class Conflict extends AppError {
  constructor(message: string) {
    super("conflito", message);
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, string[]>, message = "Confira os campos destacados.") {
    super("dados_invalidos", message, { details });
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, cause?: unknown) {
    super("regra_de_negocio", message, cause !== undefined ? { cause } : undefined);
  }
}

/** Vazamento entre redes. Nunca deveria chegar aqui: o banco ja recusou. */
export class TenantViolation extends AppError {
  constructor(message = "Operacao fora da clinica da sessao.") {
    super("isolamento", message);
  }
}
