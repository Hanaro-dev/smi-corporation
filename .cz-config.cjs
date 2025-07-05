module.exports = {
  types: [
    {
      value: 'feat',
      name: 'feat:     ✨ Nouvelle fonctionnalité pour l\'utilisateur, pas une nouvelle fonctionnalité de build'
    },
    {
      value: 'fix',
      name: 'fix:      🐛 Correction de bug pour l\'utilisateur, pas une correction de build'
    },
    {
      value: 'docs',
      name: 'docs:     📚 Changements dans la documentation'
    },
    {
      value: 'style',
      name: 'style:    💄 Changements qui n\'affectent pas le sens du code (espaces, formatage, etc.)'
    },
    {
      value: 'refactor',
      name: 'refactor: ♻️  Changement de code qui ne corrige pas de bug et n\'ajoute pas de fonctionnalité'
    },
    {
      value: 'perf',
      name: 'perf:     ⚡ Changement de code qui améliore les performances'
    },
    {
      value: 'test',
      name: 'test:     ✅ Ajout de tests manquants ou correction de tests existants'
    },
    {
      value: 'build',
      name: 'build:    🏗️  Changements qui affectent le système de build ou les dépendances externes'
    },
    {
      value: 'ci',
      name: 'ci:       👷 Changements dans les fichiers et scripts de configuration CI'
    },
    {
      value: 'chore',
      name: 'chore:    🔧 Autres changements qui ne modifient pas les fichiers src ou test'
    },
    {
      value: 'revert',
      name: 'revert:   ⏪ Annulation d\'un commit précédent'
    }
  ],

  scopes: [
    { name: 'auth', description: 'Authentification et autorisation' },
    { name: 'api', description: 'Endpoints API' },
    { name: 'ui', description: 'Interface utilisateur' },
    { name: 'components', description: 'Composants Vue' },
    { name: 'pages', description: 'Pages et routes' },
    { name: 'services', description: 'Services backend' },
    { name: 'database', description: 'Base de données et modèles' },
    { name: 'config', description: 'Configuration du projet' },
    { name: 'deps', description: 'Dépendances' },
    { name: 'deployment', description: 'Déploiement et infrastructure' },
    { name: 'monitoring', description: 'Monitoring et logging' },
    { name: 'security', description: 'Sécurité' },
    { name: 'performance', description: 'Performance et optimisation' },
    { name: 'accessibility', description: 'Accessibilité' },
    { name: 'i18n', description: 'Internationalisation' },
    { name: 'organigrammes', description: 'Gestion des organigrammes' },
    { name: 'images', description: 'Gestion des images et médias' },
    { name: 'bbcode', description: 'Système BBCode' },
    { name: 'admin', description: 'Interface d\'administration' },
    { name: 'quality', description: 'Qualité du code' }
  ],

  allowTicketNumber: false,
  isTicketNumberRequired: false,
  ticketNumberPrefix: 'TICKET-',
  ticketNumberRegExp: '\\d{1,5}',

  // Override the messages, defaults are as follows
  messages: {
    type: 'Sélectionnez le type de changement que vous effectuez:',
    scope: '\nIndiquez la PORTÉE de ce changement (optionnel):',
    // used if allowCustomScopes is true
    customScope: 'Indiquez la portée de ce changement:',
    subject: 'Écrivez une description COURTE et IMPÉRATIVE du changement:\n',
    body: 'Fournissez une description DÉTAILLÉE du changement (optionnel). Utilisez "|" pour les sauts de ligne:\n',
    breaking: 'Listez tous les BREAKING CHANGES (optionnel):\n',
    footer: 'Listez tous les ISSUES FERMÉS par ce changement (optionnel). Ex.: #31, #34:\n',
    confirmCommit: 'Êtes-vous sûr de vouloir procéder avec le commit ci-dessus?'
  },

  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
  // skip any questions you want
  skipQuestions: [],

  // limit subject length
  subjectLimit: 100,
  breaklineChar: '|', // It is supported for fields body and footer.
  footerPrefix: 'ISSUES CLOSED:'
};