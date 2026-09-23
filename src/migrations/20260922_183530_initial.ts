import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`collage\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`alt\` text,
  	\`title\` text,
  	\`year\` numeric,
  	\`_objectkey\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`collage__order_idx\` ON \`collage\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`collage_updated_at_idx\` ON \`collage\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`collage_created_at_idx\` ON \`collage\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`collage__status_idx\` ON \`collage\` (\`_status\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`collage_filename_idx\` ON \`collage\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`_collage_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version__order\` text,
  	\`version_alt\` text,
  	\`version_title\` text,
  	\`version_year\` numeric,
  	\`version__objectkey\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_url\` text,
  	\`version_thumbnail_u_r_l\` text,
  	\`version_filename\` text,
  	\`version_mime_type\` text,
  	\`version_filesize\` numeric,
  	\`version_width\` numeric,
  	\`version_height\` numeric,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`collage\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_collage_v_parent_idx\` ON \`_collage_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_collage_v_version_version__order_idx\` ON \`_collage_v\` (\`version__order\`);`)
  await db.run(sql`CREATE INDEX \`_collage_v_version_version_updated_at_idx\` ON \`_collage_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_collage_v_version_version_created_at_idx\` ON \`_collage_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_collage_v_version_version__status_idx\` ON \`_collage_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_collage_v_version_version_filename_idx\` ON \`_collage_v\` (\`version_filename\`);`)
  await db.run(sql`CREATE INDEX \`_collage_v_created_at_idx\` ON \`_collage_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_collage_v_updated_at_idx\` ON \`_collage_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_collage_v_latest_idx\` ON \`_collage_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`songs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`title\` text,
  	\`artist\` text DEFAULT 'BeccaBerry',
  	\`duration\` text,
  	\`_objectkey\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`songs__order_idx\` ON \`songs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`songs_updated_at_idx\` ON \`songs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`songs_created_at_idx\` ON \`songs\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`songs__status_idx\` ON \`songs\` (\`_status\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`songs_filename_idx\` ON \`songs\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`_songs_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version__order\` text,
  	\`version_title\` text,
  	\`version_artist\` text DEFAULT 'BeccaBerry',
  	\`version_duration\` text,
  	\`version__objectkey\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_url\` text,
  	\`version_thumbnail_u_r_l\` text,
  	\`version_filename\` text,
  	\`version_mime_type\` text,
  	\`version_filesize\` numeric,
  	\`version_width\` numeric,
  	\`version_height\` numeric,
  	\`version_focal_x\` numeric,
  	\`version_focal_y\` numeric,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`songs\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_songs_v_parent_idx\` ON \`_songs_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_songs_v_version_version__order_idx\` ON \`_songs_v\` (\`version__order\`);`)
  await db.run(sql`CREATE INDEX \`_songs_v_version_version_updated_at_idx\` ON \`_songs_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_songs_v_version_version_created_at_idx\` ON \`_songs_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_songs_v_version_version__status_idx\` ON \`_songs_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_songs_v_version_version_filename_idx\` ON \`_songs_v\` (\`version_filename\`);`)
  await db.run(sql`CREATE INDEX \`_songs_v_created_at_idx\` ON \`_songs_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_songs_v_updated_at_idx\` ON \`_songs_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_songs_v_latest_idx\` ON \`_songs_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`videos\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`youtube_url\` text,
  	\`title\` text,
  	\`description\` text,
  	\`poster_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`poster_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`videos__order_idx\` ON \`videos\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`videos_poster_idx\` ON \`videos\` (\`poster_id\`);`)
  await db.run(sql`CREATE INDEX \`videos_updated_at_idx\` ON \`videos\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`videos_created_at_idx\` ON \`videos\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`videos__status_idx\` ON \`videos\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_videos_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version__order\` text,
  	\`version_youtube_url\` text,
  	\`version_title\` text,
  	\`version_description\` text,
  	\`version_poster_id\` integer,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`videos\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_poster_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_videos_v_parent_idx\` ON \`_videos_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_videos_v_version_version__order_idx\` ON \`_videos_v\` (\`version__order\`);`)
  await db.run(sql`CREATE INDEX \`_videos_v_version_version_poster_idx\` ON \`_videos_v\` (\`version_poster_id\`);`)
  await db.run(sql`CREATE INDEX \`_videos_v_version_version_updated_at_idx\` ON \`_videos_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_videos_v_version_version_created_at_idx\` ON \`_videos_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_videos_v_version_version__status_idx\` ON \`_videos_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_videos_v_created_at_idx\` ON \`_videos_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_videos_v_updated_at_idx\` ON \`_videos_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_videos_v_latest_idx\` ON \`_videos_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text NOT NULL,
  	\`_objectkey\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`role\` text DEFAULT 'editor' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`reset_password_requested_at\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`collage_id\` integer,
  	\`songs_id\` integer,
  	\`videos_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`collage_id\`) REFERENCES \`collage\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`songs_id\`) REFERENCES \`songs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`videos_id\`) REFERENCES \`videos\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_collage_id_idx\` ON \`payload_locked_documents_rels\` (\`collage_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_songs_id_idx\` ON \`payload_locked_documents_rels\` (\`songs_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_videos_id_idx\` ON \`payload_locked_documents_rels\` (\`videos_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`home_page_stanzas\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`line\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_page\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_page_stanzas_order_idx\` ON \`home_page_stanzas\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_page_stanzas_parent_id_idx\` ON \`home_page_stanzas\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`home_page\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hero_image_id\` integer,
  	\`eyebrow\` text DEFAULT 'Becca Berry, Esq.',
  	\`primary_button_text\` text DEFAULT 'Read Becca’s story',
  	\`primary_button_page\` text DEFAULT '/about-me',
  	\`secondary_button_text\` text DEFAULT 'See the collages',
  	\`secondary_button_page\` text DEFAULT '/collage-art',
  	\`lead_in\` text DEFAULT 'Nobody is coming to save you.',
  	\`closing_line\` text DEFAULT 'For the ones who survived what they can’t say out loud—yet',
  	\`story_portrait_id\` integer,
  	\`story_quote\` text DEFAULT 'I’m Becca Berry, Esq., and I’m done pretending healing is pretty.',
  	\`story_text\` text DEFAULT 'I’m a survivor. A truth-teller. A California-raised attorney who realized the law could sometimes protect people but couldn’t save them, so I learned about the magic that could. I write, sing, collage, and conjure because my healing demanded it.',
  	\`story_button_text\` text DEFAULT 'Read the whole story',
  	\`story_button_page\` text DEFAULT '/about-me',
  	\`doors_heading\` text DEFAULT 'Art, in every form',
  	\`collage_door\` text DEFAULT 'Look',
  	\`songs_door\` text DEFAULT 'Listen',
  	\`videos_door\` text DEFAULT 'Watch',
  	\`closing_heading\` text DEFAULT 'If you found this website, it’s not an accident.',
  	\`closing_text\` text DEFAULT 'If something in these words made your body say “yes,” trust that. You’re in the right place.',
  	\`closing_words\` text DEFAULT 'Magic. Art. Truth.',
  	\`closing_button_text\` text DEFAULT 'Get in touch',
  	\`closing_button_page\` text DEFAULT '/contact',
  	\`seo_title\` text DEFAULT 'Nothing Wrong With You',
  	\`seo_description\` text DEFAULT 'A spiritual and artistic storytelling platform for survivors, curated by Becca Berry, Esq. Nobody is coming to save you. You can save yourself.',
  	\`seo_share_image_id\` integer,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`hero_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`story_portrait_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`home_page_hero_image_idx\` ON \`home_page\` (\`hero_image_id\`);`)
  await db.run(sql`CREATE INDEX \`home_page_story_portrait_idx\` ON \`home_page\` (\`story_portrait_id\`);`)
  await db.run(sql`CREATE INDEX \`home_page_seo_seo_share_image_idx\` ON \`home_page\` (\`seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`home_page__status_idx\` ON \`home_page\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_home_page_v_version_stanzas\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`line\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_page_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_home_page_v_version_stanzas_order_idx\` ON \`_home_page_v_version_stanzas\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_home_page_v_version_stanzas_parent_id_idx\` ON \`_home_page_v_version_stanzas\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_home_page_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_hero_image_id\` integer,
  	\`version_eyebrow\` text DEFAULT 'Becca Berry, Esq.',
  	\`version_primary_button_text\` text DEFAULT 'Read Becca’s story',
  	\`version_primary_button_page\` text DEFAULT '/about-me',
  	\`version_secondary_button_text\` text DEFAULT 'See the collages',
  	\`version_secondary_button_page\` text DEFAULT '/collage-art',
  	\`version_lead_in\` text DEFAULT 'Nobody is coming to save you.',
  	\`version_closing_line\` text DEFAULT 'For the ones who survived what they can’t say out loud—yet',
  	\`version_story_portrait_id\` integer,
  	\`version_story_quote\` text DEFAULT 'I’m Becca Berry, Esq., and I’m done pretending healing is pretty.',
  	\`version_story_text\` text DEFAULT 'I’m a survivor. A truth-teller. A California-raised attorney who realized the law could sometimes protect people but couldn’t save them, so I learned about the magic that could. I write, sing, collage, and conjure because my healing demanded it.',
  	\`version_story_button_text\` text DEFAULT 'Read the whole story',
  	\`version_story_button_page\` text DEFAULT '/about-me',
  	\`version_doors_heading\` text DEFAULT 'Art, in every form',
  	\`version_collage_door\` text DEFAULT 'Look',
  	\`version_songs_door\` text DEFAULT 'Listen',
  	\`version_videos_door\` text DEFAULT 'Watch',
  	\`version_closing_heading\` text DEFAULT 'If you found this website, it’s not an accident.',
  	\`version_closing_text\` text DEFAULT 'If something in these words made your body say “yes,” trust that. You’re in the right place.',
  	\`version_closing_words\` text DEFAULT 'Magic. Art. Truth.',
  	\`version_closing_button_text\` text DEFAULT 'Get in touch',
  	\`version_closing_button_page\` text DEFAULT '/contact',
  	\`version_seo_title\` text DEFAULT 'Nothing Wrong With You',
  	\`version_seo_description\` text DEFAULT 'A spiritual and artistic storytelling platform for survivors, curated by Becca Berry, Esq. Nobody is coming to save you. You can save yourself.',
  	\`version_seo_share_image_id\` integer,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_hero_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_story_portrait_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_home_page_v_version_version_hero_image_idx\` ON \`_home_page_v\` (\`version_hero_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_page_v_version_version_story_portrait_idx\` ON \`_home_page_v\` (\`version_story_portrait_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_page_v_version_seo_version_seo_share_image_idx\` ON \`_home_page_v\` (\`version_seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_page_v_version_version__status_idx\` ON \`_home_page_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_home_page_v_created_at_idx\` ON \`_home_page_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_home_page_v_updated_at_idx\` ON \`_home_page_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_home_page_v_latest_idx\` ON \`_home_page_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_home_page_v_autosave_idx\` ON \`_home_page_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`about_page_affirmations\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`line\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`about_page\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`about_page_affirmations_order_idx\` ON \`about_page_affirmations\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`about_page_affirmations_parent_id_idx\` ON \`about_page_affirmations\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`about_page\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text DEFAULT 'About Me',
  	\`heading\` text DEFAULT 'Nobody is coming to save you.',
  	\`heading_emphasis\` text DEFAULT 'You can save yourself!',
  	\`lede\` text DEFAULT 'For the ones who survived what they can’t say out loud—yet',
  	\`connect_text\` text DEFAULT 'Connect with Becca Berry',
  	\`connect_label\` text DEFAULT '@beccaberry',
  	\`connect_url\` text DEFAULT 'https://www.instagram.com/beccaberry',
  	\`portrait_id\` integer,
  	\`body\` text,
  	\`seo_title\` text DEFAULT 'About Me',
  	\`seo_description\` text DEFAULT 'Becca Berry, Esq. is an attorney, artist and survivor. Read why she built Nothing Wrong With You, a spiritual and artistic platform for survivors who are tired of healing quietly.',
  	\`seo_share_image_id\` integer,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`portrait_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`about_page_portrait_idx\` ON \`about_page\` (\`portrait_id\`);`)
  await db.run(sql`CREATE INDEX \`about_page_seo_seo_share_image_idx\` ON \`about_page\` (\`seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`about_page__status_idx\` ON \`about_page\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_about_page_v_version_affirmations\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`line\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_about_page_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_about_page_v_version_affirmations_order_idx\` ON \`_about_page_v_version_affirmations\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_about_page_v_version_affirmations_parent_id_idx\` ON \`_about_page_v_version_affirmations\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_about_page_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_eyebrow\` text DEFAULT 'About Me',
  	\`version_heading\` text DEFAULT 'Nobody is coming to save you.',
  	\`version_heading_emphasis\` text DEFAULT 'You can save yourself!',
  	\`version_lede\` text DEFAULT 'For the ones who survived what they can’t say out loud—yet',
  	\`version_connect_text\` text DEFAULT 'Connect with Becca Berry',
  	\`version_connect_label\` text DEFAULT '@beccaberry',
  	\`version_connect_url\` text DEFAULT 'https://www.instagram.com/beccaberry',
  	\`version_portrait_id\` integer,
  	\`version_body\` text,
  	\`version_seo_title\` text DEFAULT 'About Me',
  	\`version_seo_description\` text DEFAULT 'Becca Berry, Esq. is an attorney, artist and survivor. Read why she built Nothing Wrong With You, a spiritual and artistic platform for survivors who are tired of healing quietly.',
  	\`version_seo_share_image_id\` integer,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_portrait_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_about_page_v_version_version_portrait_idx\` ON \`_about_page_v\` (\`version_portrait_id\`);`)
  await db.run(sql`CREATE INDEX \`_about_page_v_version_seo_version_seo_share_image_idx\` ON \`_about_page_v\` (\`version_seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_about_page_v_version_version__status_idx\` ON \`_about_page_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_about_page_v_created_at_idx\` ON \`_about_page_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_about_page_v_updated_at_idx\` ON \`_about_page_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_about_page_v_latest_idx\` ON \`_about_page_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_about_page_v_autosave_idx\` ON \`_about_page_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`art_page\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`art_heading\` text DEFAULT 'I create art because silence was killing me.',
  	\`art_seo_title\` text DEFAULT 'Art',
  	\`art_seo_description\` text DEFAULT 'Collage, writing, songs and mixed-media video art by Becca Berry, made as part of her healing and for other survivors.',
  	\`art_seo_share_image_id\` integer,
  	\`collage_heading\` text DEFAULT 'Collage',
  	\`collage_seo_title\` text DEFAULT 'Collage',
  	\`collage_seo_description\` text DEFAULT 'Collage art by Becca Berry: cut-up magazines, headlines and faces rearranged into visual testimony, made as part of her healing.',
  	\`collage_seo_share_image_id\` integer,
  	\`songs_heading\` text DEFAULT 'Songs',
  	\`songs_intro\` text DEFAULT 'I’ll be adding demos that I’ve been working on, just expressing and getting these songs out of me while also finding my sound.',
  	\`songs_seo_title\` text DEFAULT 'Songs',
  	\`songs_seo_description\` text DEFAULT 'Songs and demos by Becca Berry, including 30/We Survived, The End, and Lullaby with Galactic Monk. Listen here.',
  	\`songs_seo_share_image_id\` integer,
  	\`videos_heading\` text DEFAULT 'Videos',
  	\`videos_lede\` text DEFAULT 'Mixed Media Video Art',
  	\`videos_seo_title\` text DEFAULT 'Videos',
  	\`videos_seo_description\` text DEFAULT 'Mixed media video art by Becca Berry: shadowwork, mkultrasurvivor and judgement.',
  	\`videos_seo_share_image_id\` integer,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`art_seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`collage_seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`songs_seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`videos_seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`art_page_art_seo_art_seo_share_image_idx\` ON \`art_page\` (\`art_seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`art_page_collage_seo_collage_seo_share_image_idx\` ON \`art_page\` (\`collage_seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`art_page_songs_seo_songs_seo_share_image_idx\` ON \`art_page\` (\`songs_seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`art_page_videos_seo_videos_seo_share_image_idx\` ON \`art_page\` (\`videos_seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`art_page__status_idx\` ON \`art_page\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_art_page_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_art_heading\` text DEFAULT 'I create art because silence was killing me.',
  	\`version_art_seo_title\` text DEFAULT 'Art',
  	\`version_art_seo_description\` text DEFAULT 'Collage, writing, songs and mixed-media video art by Becca Berry, made as part of her healing and for other survivors.',
  	\`version_art_seo_share_image_id\` integer,
  	\`version_collage_heading\` text DEFAULT 'Collage',
  	\`version_collage_seo_title\` text DEFAULT 'Collage',
  	\`version_collage_seo_description\` text DEFAULT 'Collage art by Becca Berry: cut-up magazines, headlines and faces rearranged into visual testimony, made as part of her healing.',
  	\`version_collage_seo_share_image_id\` integer,
  	\`version_songs_heading\` text DEFAULT 'Songs',
  	\`version_songs_intro\` text DEFAULT 'I’ll be adding demos that I’ve been working on, just expressing and getting these songs out of me while also finding my sound.',
  	\`version_songs_seo_title\` text DEFAULT 'Songs',
  	\`version_songs_seo_description\` text DEFAULT 'Songs and demos by Becca Berry, including 30/We Survived, The End, and Lullaby with Galactic Monk. Listen here.',
  	\`version_songs_seo_share_image_id\` integer,
  	\`version_videos_heading\` text DEFAULT 'Videos',
  	\`version_videos_lede\` text DEFAULT 'Mixed Media Video Art',
  	\`version_videos_seo_title\` text DEFAULT 'Videos',
  	\`version_videos_seo_description\` text DEFAULT 'Mixed media video art by Becca Berry: shadowwork, mkultrasurvivor and judgement.',
  	\`version_videos_seo_share_image_id\` integer,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_art_seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_collage_seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_songs_seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_videos_seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_art_page_v_version_art_seo_version_art_seo_share_image_idx\` ON \`_art_page_v\` (\`version_art_seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_art_page_v_version_collage_seo_version_collage_seo_shar_idx\` ON \`_art_page_v\` (\`version_collage_seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_art_page_v_version_songs_seo_version_songs_seo_share_im_idx\` ON \`_art_page_v\` (\`version_songs_seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_art_page_v_version_videos_seo_version_videos_seo_share__idx\` ON \`_art_page_v\` (\`version_videos_seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_art_page_v_version_version__status_idx\` ON \`_art_page_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_art_page_v_created_at_idx\` ON \`_art_page_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_art_page_v_updated_at_idx\` ON \`_art_page_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_art_page_v_latest_idx\` ON \`_art_page_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_art_page_v_autosave_idx\` ON \`_art_page_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`resources_page\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Resources',
  	\`body\` text,
  	\`seo_title\` text DEFAULT 'Resources',
  	\`seo_description\` text DEFAULT 'Definitions, declassified government documents and support websites that Becca Berry has found helpful for understanding trauma-based mind control.',
  	\`seo_share_image_id\` integer,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`resources_page_seo_seo_share_image_idx\` ON \`resources_page\` (\`seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`resources_page__status_idx\` ON \`resources_page\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_resources_page_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_heading\` text DEFAULT 'Resources',
  	\`version_body\` text,
  	\`version_seo_title\` text DEFAULT 'Resources',
  	\`version_seo_description\` text DEFAULT 'Definitions, declassified government documents and support websites that Becca Berry has found helpful for understanding trauma-based mind control.',
  	\`version_seo_share_image_id\` integer,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_resources_page_v_version_seo_version_seo_share_image_idx\` ON \`_resources_page_v\` (\`version_seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_resources_page_v_version_version__status_idx\` ON \`_resources_page_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_resources_page_v_created_at_idx\` ON \`_resources_page_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_resources_page_v_updated_at_idx\` ON \`_resources_page_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_resources_page_v_latest_idx\` ON \`_resources_page_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_resources_page_v_autosave_idx\` ON \`_resources_page_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`contact_page_topics\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`topic\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`contact_page\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`contact_page_topics_order_idx\` ON \`contact_page_topics\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`contact_page_topics_parent_id_idx\` ON \`contact_page_topics\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`contact_page\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text DEFAULT 'Info + Contact',
  	\`heading\` text DEFAULT 'I’d love to hear from you',
  	\`lede\` text DEFAULT 'About me, social media, and how to get in touch',
  	\`about\` text,
  	\`booking_address\` text DEFAULT 'Becca Berry
  Los Angeles, CA',
  	\`booking_hint\` text DEFAULT 'Choose “Booking” or “Press” in the form.',
  	\`seo_title\` text DEFAULT 'Info + Contact',
  	\`seo_description\` text DEFAULT 'About Nothing Wrong With You, Becca Berry’s social media, and how to reach her for booking, press and collaboration. Based in Los Angeles, CA.',
  	\`seo_share_image_id\` integer,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`contact_page_seo_seo_share_image_idx\` ON \`contact_page\` (\`seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`contact_page__status_idx\` ON \`contact_page\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_contact_page_v_version_topics\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`topic\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_contact_page_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_contact_page_v_version_topics_order_idx\` ON \`_contact_page_v_version_topics\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_version_topics_parent_id_idx\` ON \`_contact_page_v_version_topics\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_contact_page_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_eyebrow\` text DEFAULT 'Info + Contact',
  	\`version_heading\` text DEFAULT 'I’d love to hear from you',
  	\`version_lede\` text DEFAULT 'About me, social media, and how to get in touch',
  	\`version_about\` text,
  	\`version_booking_address\` text DEFAULT 'Becca Berry
  Los Angeles, CA',
  	\`version_booking_hint\` text DEFAULT 'Choose “Booking” or “Press” in the form.',
  	\`version_seo_title\` text DEFAULT 'Info + Contact',
  	\`version_seo_description\` text DEFAULT 'About Nothing Wrong With You, Becca Berry’s social media, and how to reach her for booking, press and collaboration. Based in Los Angeles, CA.',
  	\`version_seo_share_image_id\` integer,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_seo_share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_contact_page_v_version_seo_version_seo_share_image_idx\` ON \`_contact_page_v\` (\`version_seo_share_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_version_version__status_idx\` ON \`_contact_page_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_created_at_idx\` ON \`_contact_page_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_updated_at_idx\` ON \`_contact_page_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_latest_idx\` ON \`_contact_page_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_autosave_idx\` ON \`_contact_page_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`site_settings_social\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_settings_social_order_idx\` ON \`site_settings_social\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_social_parent_id_idx\` ON \`site_settings_social\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`site_settings_safety_crisis_lines\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`how\` text,
  	\`phone\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_settings_safety_crisis_lines_order_idx\` ON \`site_settings_safety_crisis_lines\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_safety_crisis_lines_parent_id_idx\` ON \`site_settings_safety_crisis_lines\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`site_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_name\` text DEFAULT 'Nothing Wrong With You' NOT NULL,
  	\`tagline\` text DEFAULT 'You Can Save Yourself' NOT NULL,
  	\`owner_name\` text DEFAULT 'Becca Berry' NOT NULL,
  	\`default_description\` text DEFAULT 'A spiritual and artistic storytelling platform for survivors, curated by Becca Berry, Esq.' NOT NULL,
  	\`share_image_id\` integer,
  	\`safety_content_note_enabled\` integer DEFAULT true,
  	\`safety_content_note_text\` text DEFAULT 'Some of what is shared here discusses abuse and other trauma. Take breaks, and leave whenever you need to.',
  	\`safety_crisis_enabled\` integer DEFAULT true,
  	\`safety_legal_notice_enabled\` integer DEFAULT true,
  	\`safety_legal_notice_text\` text DEFAULT 'This site is for education and creative expression. Nothing here is legal advice, and visiting it does not create an attorney-client relationship.',
  	\`safety_quick_exit_enabled\` integer DEFAULT false,
  	\`safety_quick_exit_url\` text DEFAULT 'https://www.google.com/',
  	\`contact_form_formspree_id\` text,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`share_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`site_settings_share_image_idx\` ON \`site_settings\` (\`share_image_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`collage\`;`)
  await db.run(sql`DROP TABLE \`_collage_v\`;`)
  await db.run(sql`DROP TABLE \`songs\`;`)
  await db.run(sql`DROP TABLE \`_songs_v\`;`)
  await db.run(sql`DROP TABLE \`videos\`;`)
  await db.run(sql`DROP TABLE \`_videos_v\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`home_page_stanzas\`;`)
  await db.run(sql`DROP TABLE \`home_page\`;`)
  await db.run(sql`DROP TABLE \`_home_page_v_version_stanzas\`;`)
  await db.run(sql`DROP TABLE \`_home_page_v\`;`)
  await db.run(sql`DROP TABLE \`about_page_affirmations\`;`)
  await db.run(sql`DROP TABLE \`about_page\`;`)
  await db.run(sql`DROP TABLE \`_about_page_v_version_affirmations\`;`)
  await db.run(sql`DROP TABLE \`_about_page_v\`;`)
  await db.run(sql`DROP TABLE \`art_page\`;`)
  await db.run(sql`DROP TABLE \`_art_page_v\`;`)
  await db.run(sql`DROP TABLE \`resources_page\`;`)
  await db.run(sql`DROP TABLE \`_resources_page_v\`;`)
  await db.run(sql`DROP TABLE \`contact_page_topics\`;`)
  await db.run(sql`DROP TABLE \`contact_page\`;`)
  await db.run(sql`DROP TABLE \`_contact_page_v_version_topics\`;`)
  await db.run(sql`DROP TABLE \`_contact_page_v\`;`)
  await db.run(sql`DROP TABLE \`site_settings_social\`;`)
  await db.run(sql`DROP TABLE \`site_settings_safety_crisis_lines\`;`)
  await db.run(sql`DROP TABLE \`site_settings\`;`)
}
