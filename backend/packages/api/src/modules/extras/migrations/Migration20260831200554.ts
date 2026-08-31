import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260831200554 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "veiculo_cliente" ("id" text not null, "customer_id" text not null, "ano_modelo_id" text not null, "label" text not null, "placa" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "veiculo_cliente_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_veiculo_cliente_deleted_at" ON "veiculo_cliente" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "veiculo_cliente" cascade;`);
  }

}
