-- MySQL schema for SciPulse · 学术脉动
-- 根据 SQLAlchemy 模型生成的建表语句，用于初始化数据库结构

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '用户主键 ID',
  `email` VARCHAR(255) NOT NULL COMMENT '邮箱地址，唯一',
  `hashed_password` VARCHAR(255) NOT NULL COMMENT '哈希后的登录密码',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否激活',
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '邮箱是否已验证',
  `subscription_enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否开启订阅',
  `digest_time` CHAR(5) NULL COMMENT '每日推送时间，格式 HH:MM',
  `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `ix_users_email` (`email`),
  KEY `ix_users_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for research_profiles
-- ----------------------------
DROP TABLE IF EXISTS `research_profiles`;
CREATE TABLE `research_profiles` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '科研画像主键 ID',
  `user_id` INT NOT NULL COMMENT '关联用户 ID',
  `keywords` JSON NULL COMMENT '关注关键词列表',
  `disciplines` JSON NULL COMMENT '学科标签列表',
  `journal_preferences` JSON NULL COMMENT '期刊偏好列表',
  `updated_at` DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '最近一次更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_research_profiles_user_id` (`user_id`),
  KEY `ix_research_profiles_id` (`id`),
  CONSTRAINT `fk_research_profiles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for papers
-- ----------------------------
DROP TABLE IF EXISTS `papers`;
CREATE TABLE `papers` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '论文主键 ID',
  `title` VARCHAR(512) NOT NULL COMMENT '论文标题',
  `authors` JSON NULL COMMENT '作者列表',
  `abstract` TEXT NULL COMMENT '原始摘要',
  `structured_abstract` TEXT NULL COMMENT '结构化摘要（LLM 生成）',
  `url` VARCHAR(512) NULL COMMENT '论文链接，唯一',
  `source` VARCHAR(50) NULL COMMENT '数据来源，如 arXiv、PubMed 等',
  `published_date` DATETIME NULL COMMENT '论文发布日期',
  `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '入库时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_papers_url` (`url`),
  KEY `ix_papers_id` (`id`),
  KEY `ix_papers_url` (`url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for daily_digests
-- ----------------------------
DROP TABLE IF EXISTS `daily_digests`;
CREATE TABLE `daily_digests` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '每日摘要主键 ID',
  `user_id` INT NOT NULL COMMENT '所属用户 ID',
  `date` DATETIME NULL DEFAULT CURRENT_TIMESTAMP COMMENT '逻辑日期',
  `paper_ids` JSON NULL COMMENT '推送的论文 ID 列表',
  `sent_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '邮件发送时间',
  PRIMARY KEY (`id`),
  KEY `ix_daily_digests_id` (`id`),
  KEY `ix_daily_digests_user_id` (`user_id`),
  CONSTRAINT `fk_daily_digests_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for email_configs
-- ----------------------------
DROP TABLE IF EXISTS `email_configs`;
CREATE TABLE `email_configs` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '邮箱配置主键 ID',
  `smtp_host` VARCHAR(255) NOT NULL COMMENT 'SMTP 服务器地址',
  `smtp_port` INT NOT NULL COMMENT 'SMTP 服务器端口号',
  `smtp_tls` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用 TLS',
  `smtp_user` VARCHAR(255) NOT NULL COMMENT 'SMTP 登录用户名',
  `smtp_password` VARCHAR(255) NOT NULL COMMENT 'SMTP 登录密码',
  `from_email` VARCHAR(255) NOT NULL COMMENT '发件人邮箱',
  `from_name` VARCHAR(255) NULL COMMENT '发件人展示名称',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否为当前启用配置',
  `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `ix_email_configs_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for verification_codes
-- ----------------------------
DROP TABLE IF EXISTS `verification_codes`;
CREATE TABLE `verification_codes` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '验证码主键 ID',
  `email` VARCHAR(255) NOT NULL COMMENT '绑定邮箱',
  `code` VARCHAR(16) NOT NULL COMMENT '验证码内容',
  `purpose` VARCHAR(32) NOT NULL COMMENT '用途：register / reset_password 等',
  `expires_at` DATETIME(6) NOT NULL COMMENT '过期时间',
  `used` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已使用',
  `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `ix_verification_codes_id` (`id`),
  KEY `ix_verification_codes_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

