DROP INDEX "clicks_url_id_idx";--> statement-breakpoint
CREATE INDEX "clicks_url_id_clicked_at_idx" ON "clicks" USING btree ("url_id","clicked_at");