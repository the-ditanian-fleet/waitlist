CREATE TABLE `badge` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL UNIQUE,
  `exclude_badge_id` BIGINT NULL,
  CONSTRAINT `exclude_badge` FOREIGN KEY (`exclude_badge_id`) REFERENCES `badge` (`id`) ON DELETE SET NULL
);

CREATE TABLE `badge_assignment` (
  `characterId` BIGINT NOT NULL,
  `badgeId` BIGINT NOT NULL,
  `grantedById` BIGINT NULL,
  `grantedAt` BIGINT NOT NULL,
  CONSTRAINT `characterId` FOREIGN KEY (`characterId`) REFERENCES `character` (`id`),
  CONSTRAINT `badgeId` FOREIGN KEY (`badgeId`) REFERENCES `badge` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grantedById` FOREIGN KEY (`grantedById`) REFERENCES `character` (`id`)
);

INSERT INTO badge (name) VALUES ('BASTION');
INSERT INTO badge (name) VALUES ('LOGI');
INSERT INTO badge (name) VALUES ('RETIRED-LOGI');
INSERT INTO badge (name) VALUES ('WEB');

-- Logi and Retired logi are exclusive, update rows to reflect this
SELECT @bastion_id := id FROM badge WHERE name='BASTION';
SELECT @logi_id := id FROM badge WHERE name='LOGI';
SELECT @retired_logi_id := id FROM badge WHERE name='RETIRED-LOGI';
SELECT @web_id := id FROM badge WHERE name='WEB';

UPDATE badge SET exclude_badge_id=@retired_logi_id WHERE id=@logi_id;
UPDATE badge SET exclude_badge_id=@logi_id WHERE id=@retired_logi_id;

-- Set vars AdminId, CreatedAt
SELECT @admin_id := character_id FROM admins WHERE level='admin';
SELECT @created_at := UNIX_TIMESTAMP();

-- Migrate Logi
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, @logi_id, @admin_id, @created_at FROM admins WHERE admins.level = 'l';
DELETE FROM admins WHERE admins.level = 'l';

-- Migrate Bastion
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, @bastion_id, @admin_id, @created_at FROM admins WHERE admins.level = 'b';
DELETE FROM admins WHERE admins.level = 'b';

-- Migrate Webs
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, @web_id, @admin_id, @created_at FROM admins WHERE admins.level = 'w';
DELETE FROM admins WHERE admins.level = 'w';

-- Migrate Logi/Bastion
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, @bastion_id, @admin_id, @created_at FROM admins WHERE admins.level = 'lb';
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, @logi_id, @admin_id, @created_at FROM admins WHERE admins.level = 'lb';
DELETE FROM admins WHERE admins.level = 'lb';

-- Migrate Logi/Bastion/Webs
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, @bastion_id, @admin_id, @created_at FROM admins WHERE admins.level = 'lbw';
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, @logi_id, @admin_id, @created_at FROM admins WHERE admins.level = 'lbw';
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, @web_id, @admin_id, @created_at FROM admins WHERE admins.level = 'lbw';
DELETE FROM admins WHERE admins.level = 'lbw';

-- Migrate Logi/Webs
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, @logi_id, @admin_id, @created_at FROM admins WHERE admins.level = 'lw';
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, @web_id, @admin_id, @created_at FROM admins WHERE admins.level = 'lw';
DELETE FROM admins WHERE admins.level = 'lw';

-- Migrate Bastion/Webs
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, @bastion_id, @admin_id, @created_at FROM admins WHERE admins.level = 'bw';
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, @web_id, @admin_id, @created_at FROM admins WHERE admins.level = 'bw';
DELETE FROM admins WHERE admins.level = 'bw';