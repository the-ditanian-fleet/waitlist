CREATE TABLE `badge` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL UNIQUE
);

CREATE TABLE `badge_assignment` (
  `characterId` BIGINT NOT NULL,
  `badgeId` INT NOT NULL,
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

# Set vars AdminId, CreatedAt
SELECT @admin_id := character_id FROM admins WHERE level='admin';
SELECT @created_at := UNIX_TIMESTAMP();

# Migrate Logi
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, '2', @admin_id, @created_at FROM admins WHERE admins.level = 'l';
DELETE FROM admins WHERE admins.level = 'l';

# Migrate Bastion
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, '1', @admin_id, @created_at FROM admins WHERE admins.level = 'b';
DELETE FROM admins WHERE admins.level = 'b';

# Migrate Webs
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, '4', @admin_id, @created_at FROM admins WHERE admins.level = 'w';
DELETE FROM admins WHERE admins.level = 'w';

# Migrate Logi/Bastion
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, '1', @admin_id, @created_at FROM admins WHERE admins.level = 'lb';
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, '2', @admin_id, @created_at FROM admins WHERE admins.level = 'lb';
DELETE FROM admins WHERE admins.level = 'lb';

# Migrate Logi/Bastion/Webs
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, '1', @admin_id, @created_at FROM admins WHERE admins.level = 'lbw';
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, '2', @admin_id, @created_at FROM admins WHERE admins.level = 'lbw';
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, '4', @admin_id, @created_at FROM admins WHERE admins.level = 'lbw';
DELETE FROM admins WHERE admins.level = 'lbw';

# Migrate Logi/Webs
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, '2', @admin_id, @created_at FROM admins WHERE admins.level = 'lw';
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, '4', @admin_id, @created_at FROM admins WHERE admins.level = 'lw';
DELETE FROM admins WHERE admins.level = 'lw';

# Migrate Bastion/Webs
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, '1', @admin_id, @created_at FROM admins WHERE admins.level = 'bw';
INSERT INTO badge_assignment (CharacterId, BadgeId, GrantedById, GrantedAt) SELECT character_id, '4', @admin_id, @created_at FROM admins WHERE admins.level = 'bw';
DELETE FROM admins WHERE admins.level = 'bw';