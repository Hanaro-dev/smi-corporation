#!/bin/bash

# Script pour finaliser la configuration Prisma
# Ce script sera exécuté quand l'utilisateur sera prêt à migrer vers Prisma

echo "🔄 Configuration de Prisma..."

# 1. Installer les dépendances Prisma
echo "📦 Installation des dépendances Prisma..."
npm install @prisma/client prisma --save

# 2. Générer le client Prisma
echo "⚙️  Génération du client Prisma..."
npx prisma generate

# 3. Pousser le schéma vers la base de données
echo "🗄️  Synchronisation du schéma de base de données..."
npx prisma db push

# 4. Exécuter le seeding
echo "🌱 Seeding de la base de données..."
node prisma/seed.js

# 5. Mettre à jour la configuration
echo "📝 Mise à jour de la configuration..."
sed -i 's/USE_MOCK_DB=true/USE_MOCK_DB=false/' .env

echo "✅ Configuration Prisma terminée!"
echo ""
echo "🎉 Vous pouvez maintenant:"
echo "   - Démarrer le serveur: npm run dev"
echo "   - Voir la base de données: npx prisma studio"
echo "   - Revenir à mock-db: Modifier USE_MOCK_DB=true dans .env"
echo ""
echo "📋 Comptes de test créés:"
echo "   - admin@smi-corporation.com / motdepasse123"
echo "   - editor@smi-corporation.com / motdepasse123"
echo "   - user@smi-corporation.com / motdepasse123"