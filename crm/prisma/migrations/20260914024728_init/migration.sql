-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'PROFESSIONAL', 'RECEPTION', 'FINANCE');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('INDICACAO', 'INSTAGRAM', 'FACEBOOK', 'GOOGLE', 'TRAFEGO_PAGO', 'WHATSAPP', 'SITE', 'PASSANTE', 'OUTRO');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NOVO', 'CONTATO', 'AGENDADO', 'AVALIACAO', 'PROPOSTA', 'GANHO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('NOTA', 'LIGACAO', 'WHATSAPP', 'EMAIL', 'REUNIAO', 'MUDANCA_ETAPA');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('AGENDADO', 'CONFIRMADO', 'ATENDIDO', 'FALTOU', 'CANCELADO');

-- CreateEnum
CREATE TYPE "ProcedureCategory" AS ENUM ('ODONTOLOGIA', 'ESTETICA', 'OUTRO');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('RASCUNHO', 'ENVIADO', 'APROVADO', 'RECUSADO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('ABERTA', 'PAGA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('DINHEIRO', 'PIX', 'DEBITO', 'CREDITO', 'BOLETO', 'CONVENIO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('FOTO_ANTES', 'FOTO_DEPOIS', 'RADIOGRAFIA', 'DOCUMENTO', 'TERMO');

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "document" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "defaultCommissionPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'RECEPTION',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isProfessional" BOOLEAN NOT NULL DEFAULT false,
    "specialty" TEXT,
    "councilNumber" TEXT,
    "color" TEXT NOT NULL DEFAULT '#0f766e',
    "commissionPct" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "document" TEXT,
    "birthDate" DATE,
    "source" "LeadSource",
    "notes" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "city" TEXT,
    "state" TEXT,
    "consentDataAt" TIMESTAMP(3),
    "consentImageAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'OUTRO',
    "interest" TEXT,
    "stage" "LeadStage" NOT NULL DEFAULT 'NOVO',
    "valueCents" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT,
    "patientId" TEXT,
    "lostReason" TEXT,
    "nextFollowUpAt" TIMESTAMP(3),
    "stageChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "ActivityType" NOT NULL DEFAULT 'NOTA',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "roomId" TEXT,
    "procedureId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'AGENDADO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedures" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProcedureCategory" NOT NULL DEFAULT 'ODONTOLOGIA',
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_plans" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'RASCUNHO',
    "number" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_plan_items" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "procedureId" TEXT,
    "description" TEXT NOT NULL,
    "teeth" TEXT[],
    "region" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "treatment_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installments" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "planId" TEXT,
    "number" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL DEFAULT 1,
    "dueDate" DATE NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paidCents" INTEGER NOT NULL DEFAULT 0,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'ABERTA',
    "method" "PaymentMethod",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "installmentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "note" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamneses" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "allergies" TEXT,
    "medications" TEXT,
    "conditions" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anamneses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_notes" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT,
    "appointmentId" TEXT,
    "content" TEXT NOT NULL,
    "performed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "kind" "AttachmentKind" NOT NULL DEFAULT 'DOCUMENTO',
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tooth_charts" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tooth_charts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinics_slug_key" ON "clinics"("slug");

-- CreateIndex
CREATE INDEX "users_clinicId_isProfessional_idx" ON "users"("clinicId", "isProfessional");

-- CreateIndex
CREATE UNIQUE INDEX "users_clinicId_email_key" ON "users"("clinicId", "email");

-- CreateIndex
CREATE INDEX "patients_clinicId_name_idx" ON "patients"("clinicId", "name");

-- CreateIndex
CREATE INDEX "patients_clinicId_phone_idx" ON "patients"("clinicId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "patients_clinicId_document_key" ON "patients"("clinicId", "document");

-- CreateIndex
CREATE UNIQUE INDEX "leads_patientId_key" ON "leads"("patientId");

-- CreateIndex
CREATE INDEX "leads_clinicId_stage_idx" ON "leads"("clinicId", "stage");

-- CreateIndex
CREATE INDEX "leads_clinicId_nextFollowUpAt_idx" ON "leads"("clinicId", "nextFollowUpAt");

-- CreateIndex
CREATE INDEX "lead_activities_clinicId_leadId_createdAt_idx" ON "lead_activities"("clinicId", "leadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_clinicId_name_key" ON "rooms"("clinicId", "name");

-- CreateIndex
CREATE INDEX "appointments_clinicId_startsAt_idx" ON "appointments"("clinicId", "startsAt");

-- CreateIndex
CREATE INDEX "appointments_clinicId_professionalId_startsAt_idx" ON "appointments"("clinicId", "professionalId", "startsAt");

-- CreateIndex
CREATE INDEX "procedures_clinicId_category_idx" ON "procedures"("clinicId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "procedures_clinicId_name_key" ON "procedures"("clinicId", "name");

-- CreateIndex
CREATE INDEX "treatment_plans_clinicId_status_idx" ON "treatment_plans"("clinicId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "treatment_plans_clinicId_number_key" ON "treatment_plans"("clinicId", "number");

-- CreateIndex
CREATE INDEX "treatment_plan_items_clinicId_planId_idx" ON "treatment_plan_items"("clinicId", "planId");

-- CreateIndex
CREATE INDEX "installments_clinicId_status_dueDate_idx" ON "installments"("clinicId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "installments_clinicId_patientId_idx" ON "installments"("clinicId", "patientId");

-- CreateIndex
CREATE INDEX "payments_clinicId_paidAt_idx" ON "payments"("clinicId", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "anamneses_patientId_key" ON "anamneses"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_notes_appointmentId_key" ON "clinical_notes"("appointmentId");

-- CreateIndex
CREATE INDEX "clinical_notes_clinicId_patientId_createdAt_idx" ON "clinical_notes"("clinicId", "patientId", "createdAt");

-- CreateIndex
CREATE INDEX "attachments_clinicId_patientId_idx" ON "attachments"("clinicId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "tooth_charts_patientId_key" ON "tooth_charts"("patientId");

-- CreateIndex
CREATE INDEX "audit_logs_clinicId_createdAt_idx" ON "audit_logs"("clinicId", "createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "procedures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES "treatment_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "procedures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "treatment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "installments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamneses" ADD CONSTRAINT "anamneses_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamneses" ADD CONSTRAINT "anamneses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tooth_charts" ADD CONSTRAINT "tooth_charts_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tooth_charts" ADD CONSTRAINT "tooth_charts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
