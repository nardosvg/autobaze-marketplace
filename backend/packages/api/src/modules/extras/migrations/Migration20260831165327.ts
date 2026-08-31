import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260831165327 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "avaliacao_foto" ("id" text not null, "review_id" text not null, "customer_id" text null, "url" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "avaliacao_foto_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_avaliacao_foto_deleted_at" ON "avaliacao_foto" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "pergunta_produto" ("id" text not null, "product_id" text not null, "seller_id" text not null, "customer_id" text null, "customer_nome" text null, "texto" text not null, "resposta" text null, "status" text not null default 'pendente', "respondida_em" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pergunta_produto_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pergunta_produto_deleted_at" ON "pergunta_produto" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "avaliacao_foto" cascade;`);

    this.addSql(`drop table if exists "pergunta_produto" cascade;`);
  }

}
