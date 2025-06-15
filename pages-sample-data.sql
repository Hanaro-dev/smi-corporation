-- Données de test pour les pages
-- À utiliser lors de la migration vers une base de données réelle

-- Réinitialiser la table des pages (si nécessaire)
-- TRUNCATE TABLE Pages;

-- Pages de niveau 0 (racine)
INSERT INTO Pages (title, content, slug, status, parentId, level, `order`, createdAt, updatedAt) VALUES 
('Accueil', '[h1]Bienvenue sur le site de SMI Corporation[/h1]\r\n\r\n[p]Nous sommes ravis de vous accueillir sur notre plateforme de gestion de contenu.[/p]\r\n\r\n[p]Découvrez nos services et notre expertise à travers les différentes pages de ce site.[/p]', 'accueil', 'published', NULL, 0, 1, NOW(), NOW()),
('À propos', '[h1]À propos de SMI Corporation[/h1]\r\n\r\n[p]SMI Corporation est une entreprise spécialisée dans le développement de solutions numériques innovantes.[/p]\r\n\r\n[p]Fondée en 2023, notre entreprise s''engage à fournir des services de qualité à nos clients dans divers secteurs d''activité.[/p]', 'a-propos', 'published', NULL, 0, 2, NOW(), NOW()),
('Services', '[h1]Nos services[/h1]\r\n\r\n[p]SMI Corporation propose une gamme complète de services pour répondre à vos besoins numériques.[/p]', 'services', 'published', NULL, 0, 3, NOW(), NOW()),
('Contact', '[h1]Contactez-nous[/h1]\r\n\r\n[p]Vous avez des questions ou souhaitez en savoir plus sur nos services ? N''hésitez pas à nous contacter.[/p]\r\n\r\n[p]Email : contact@smi-corporation.com[/p]\r\n[p]Téléphone : +33 1 23 45 67 89[/p]', 'contact', 'published', NULL, 0, 4, NOW(), NOW()),
('Mentions légales', '[h1]Mentions légales[/h1]\r\n\r\n[p]Informations légales concernant SMI Corporation et l''utilisation de ce site web.[/p]', 'mentions-legales', 'draft', NULL, 0, 5, NOW(), NOW());

-- Pages de niveau 1 (enfants des pages racines)
INSERT INTO Pages (title, content, slug, status, parentId, level, `order`, createdAt, updatedAt) VALUES 
('Notre équipe', '[h1]Notre équipe[/h1]\r\n\r\n[p]Découvrez les membres de notre équipe talentueuse qui travaillent chaque jour pour vous offrir le meilleur service.[/p]', 'notre-equipe', 'published', 2, 1, 1, NOW(), NOW()),
('Notre histoire', '[h1]Notre histoire[/h1]\r\n\r\n[p]Découvrez l''histoire de SMI Corporation depuis sa création jusqu''à aujourd''hui.[/p]', 'notre-histoire', 'published', 2, 1, 2, NOW(), NOW()),
('Développement web', '[h1]Développement web[/h1]\r\n\r\n[p]Nous créons des sites web modernes, réactifs et optimisés pour les moteurs de recherche.[/p]', 'developpement-web', 'published', 3, 1, 1, NOW(), NOW()),
('Applications mobiles', '[h1]Applications mobiles[/h1]\r\n\r\n[p]Développement d''applications mobiles natives et hybrides pour iOS et Android.[/p]', 'applications-mobiles', 'published', 3, 1, 2, NOW(), NOW()),
('Conseil en stratégie digitale', '[h1]Conseil en stratégie digitale[/h1]\r\n\r\n[p]Nous vous accompagnons dans la définition et la mise en œuvre de votre stratégie digitale.[/p]', 'conseil-strategie-digitale', 'published', 3, 1, 3, NOW(), NOW());

-- Pages de niveau 2
INSERT INTO Pages (title, content, slug, status, parentId, level, `order`, createdAt, updatedAt) VALUES 
('Développeurs', '[h1]Nos développeurs[/h1]\r\n\r\n[p]Notre équipe de développeurs expérimentés maîtrise les technologies les plus récentes pour créer des solutions sur mesure.[/p]', 'developpeurs', 'published', 6, 2, 1, NOW(), NOW()),
('Designers', '[h1]Nos designers[/h1]\r\n\r\n[p]Nos designers créatifs donnent vie à vos idées avec des interfaces intuitives et esthétiques.[/p]', 'designers', 'published', 6, 2, 2, NOW(), NOW()),
('Sites vitrines', '[h1]Sites vitrines[/h1]\r\n\r\n[p]Présentez votre entreprise avec un site vitrine professionnel et moderne.[/p]', 'sites-vitrines', 'published', 8, 2, 1, NOW(), NOW()),
('E-commerce', '[h1]E-commerce[/h1]\r\n\r\n[p]Créez votre boutique en ligne et développez vos ventes sur internet.[/p]', 'e-commerce', 'published', 8, 2, 2, NOW(), NOW()),
('Applications iOS', '[h1]Applications iOS[/h1]\r\n\r\n[p]Développement d''applications pour iPhone et iPad avec Swift et SwiftUI.[/p]', 'applications-ios', 'draft', 9, 2, 1, NOW(), NOW()),
('Applications Android', '[h1]Applications Android[/h1]\r\n\r\n[p]Développement d''applications Android natives avec Kotlin et Java.[/p]', 'applications-android', 'draft', 9, 2, 2, NOW(), NOW());