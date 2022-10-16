DROP TABLE `ban`;
DROP TABLE `alliance`;
DROP TABLE `corporation`;

CREATE TABLE `ban` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `entity_id` bigint NOT NULL,
  `entity_name` varchar(64),
  `entity_type` varchar(16) NOT NULL CHECK (
    `entity_type` in (
      'Account', 
      'Character',
      'Corporation',
      'Alliance'
    )
  ),  
  `issued_at` bigint NOT NULL,
  `issued_by` bigint NOT NULL REFERENCES character(`id`),
  `public_reason` varchar(512),
  `reason` varchar(512) NOT NULL,
  `revoked_at` bigint,
  `revoked_by` bigint
);

CREATE TABLE `alliance` (
  `id` bigint PRIMARY KEY NOT NULL,
  `name` text NOT NULL
);

CREATE TABLE `corporation` (
  `id` bigint PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `alliance_id` bigint REFERENCES `alliance` (`id`),
  `updated_at` bigint NOT NULL
);

ALTER TABLE `character` ADD `corporation_id` bigint NULL REFERENCES `corporation` (`id`);