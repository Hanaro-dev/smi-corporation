# 📚 SMI Corporation CMS - Documentation

Documentation complète pour le système de gestion de contenu SMI Corporation.

## 📖 Aperçu de la Documentation

### 🚀 Démarrage
- **[Guide Utilisateur](USER_GUIDE.md)** - Guide complet pour les utilisateurs finaux, créateurs de contenu et administrateurs
- **[Guide Développeur](DEVELOPER_GUIDE.md)** - Configuration de développement, standards de codage et directives de contribution

### 🏗️ Documentation Technique  
- **[Référence API](API_REFERENCE.md)** - Documentation complète de l'API REST avec endpoints et exemples
- **[Architecture Système](ARCHITECTURE.md)** - Architecture technique, pile technologique et conception système
- **[Système BBCode](BBCODE_SYSTEM.md)** - Éditeur BBCode avancé et documentation des balises personnalisées

## 🎯 Navigation Rapide

### Pour les Utilisateurs Finaux
- [Démarrage](USER_GUIDE.md#getting-started) - Première connexion et navigation de base
- [Création de Contenu](USER_GUIDE.md#content-management) - Création et édition de pages
- [Éditeur BBCode](USER_GUIDE.md#bbcode-editor) - Formatage de texte riche et balises personnalisées
- [Gestion des Médias](USER_GUIDE.md#media-management) - Téléchargement d'images et galeries
- [Dépannage](USER_GUIDE.md#troubleshooting) - Problèmes courants et solutions

### Pour les Développeurs
- [Configuration de Développement](DEVELOPER_GUIDE.md#development-setup) - Configuration de l'environnement local
- [Endpoints API](API_REFERENCE.md) - Référence API REST et exemples d'utilisation
- [Développement Frontend](DEVELOPER_GUIDE.md#frontend-development) - Modèles Vue.js et Nuxt.js
- [Développement Backend](DEVELOPER_GUIDE.md#backend-development) - Développement API côté serveur
- [Tests](DEVELOPER_GUIDE.md#testing) - Stratégies de test et exemples

### Pour les Administrateurs
- [Gestion des Utilisateurs](USER_GUIDE.md#user-management) - Administration des comptes et des rôles
- [Configuration Système](USER_GUIDE.md#administration) - Paramètres système et sécurité
- [Vue d'Ensemble de l'Architecture](ARCHITECTURE.md) - Conception système et choix technologiques
- [Fonctionnalités de Sécurité](API_REFERENCE.md#authentication--security) - Systèmes d'authentification et de sécurité

## 🛠️ Aperçu du Système

**SMI Corporation CMS** est un système de gestion de contenu moderne et full-stack construit avec :

- **Frontend** : Nuxt.js 3 avec Vue.js 3, TypeScript strict, Tailwind CSS et éditeur BBCode avancé
- **Backend** : Architecture modulaire avec services centralisés, Sequelize ORM et base de données hybride
- **Sécurité** : Authentification JWT renforcée, RBAC granulaire, audit logging et validation stricte
- **Qualité** : Code refactorisé (juillet 2025), réduction de 70% de duplication, patterns d'architecture modernisés

## 📋 Fonctionnalités Principales

### ✨ Gestion de Contenu
- Structure de pages hiérarchique avec jusqu'à 3 niveaux
- Éditeur BBCode avancé avec aperçu en direct
- Composants personnalisés (organigrammes, galeries, informations utilisateur)
- Flux de travail brouillon/publication avec versioning de contenu

### 🔐 Sécurité et Authentification
- Contrôle d'accès basé sur les rôles (RBAC) avec permissions granulaires
- Authentification basée sur JWT avec stockage sécurisé des cookies
- Protection CSRF et limitation du débit
- Validation des entrées et prévention XSS

### 📱 Gestion des Médias
- Support multi-formats d'images (JPEG, PNG, GIF, WebP, SVG)
- Variantes d'images automatiques et optimisation
- Outils avancés de recadrage et d'édition d'images
- Stockage organisé avec recherche et filtrage

### 👥 Administration des Utilisateurs
- Gestion complète du cycle de vie des utilisateurs
- Système flexible de rôles et permissions
- Surveillance des activités et pistes d'audit
- Opérations en lot et analytiques utilisateur

## 🚀 Démarrage Rapide

### Pour les Utilisateurs
1. Naviguez vers l'URL CMS de votre organisation
2. Connectez-vous avec vos identifiants
3. Référez-vous au [Guide Utilisateur](USER_GUIDE.md) pour des instructions détaillées

### Pour les Développeurs
1. Clonez le dépôt
2. Suivez le guide [Configuration de Développement](DEVELOPER_GUIDE.md#development-setup)
3. Consultez la [Référence API](API_REFERENCE.md) pour les détails d'intégration

### Pour les Administrateurs Système
1. Consultez la [Documentation Architecture](ARCHITECTURE.md)
2. Configurez les paramètres système selon le [Guide d'Administration](USER_GUIDE.md#administration)
3. Configurez les rôles utilisateur en utilisant la documentation [Gestion des Utilisateurs](USER_GUIDE.md#user-management)

## 📞 Support et Contribution

- **Problèmes** : Signalez les bugs et demandes de fonctionnalités via les canaux de support de votre organisation
- **Développement** : Suivez le [Guide Développeur](DEVELOPER_GUIDE.md) pour les directives de contribution
- **Documentation** : Cette documentation est maintenue avec le code source

---

**Dernière Mise à Jour** : Juillet 2025  
**Version Documentation** : 2.1  
**Version CMS** : Compatible avec SMI Corporation CMS v2.x