module.exports = {
  types: [
    { value: 'feat', name: 'feat:      Nouvelle fonctionnalité' },
    { value: 'fix', name: 'fix:       Correction de bug' },
    { value: 'docs', name: 'docs:      Modification de la documentation' },
    { value: 'style', name: 'style:     Changement de style sans impact fonctionnel' },
    { value: 'refactor', name: 'refactor:  Refactorisation du code sans changement fonctionnel' },
    { value: 'perf', name: 'perf:      Amélioration des performances' },
    { value: 'test', name: 'test:      Ajout ou modification de tests' },
    { value: 'build', name: 'build:     Modification du système de build ou des dépendances' },
    { value: 'ci', name: 'ci:        Modification des fichiers de configuration CI' },
    { value: 'chore', name: 'chore:     Autres changements qui ne modifient pas les fichiers source' },
    { value: 'revert', name: 'revert:    Annulation d\'un précédent commit' }
  ],
  
  scopes: [],
  
  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
  
  messages: {
    type: 'Quel type de changement effectuez-vous ?',
    scope: 'Quel est le périmètre de ce changement (composant ou fichier) ? (appuyez sur entrée pour ignorer)',
    customScope: 'Quel est le périmètre de ce changement ?',
    subject: 'Écrivez une description courte et impérative du changement :\n',
    body: 'Fournissez une description détaillée du changement (appuyez sur entrée pour ignorer) :\n',
    breaking: 'Listez les changements non rétrocompatibles (appuyez sur entrée pour ignorer) :\n',
    footer: 'Listez les problèmes fermés par ce changement (ex: "fix #123, fix #456") :\n',
    confirmCommit: 'Êtes-vous sûr de vouloir procéder à ce commit ?'
  },
  
  subjectLimit: 100,
  footerPrefix: 'Résout les problèmes:',
  breakingPrefix: 'CHANGEMENTS NON RÉTROCOMPATIBLES:',
};