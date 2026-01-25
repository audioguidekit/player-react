/**
 * French translations
 * TODO: Translate all strings to French
 */

import { Translations } from '../types';

export const fr: Translations = {
  loading: {
    tourData: 'Chargement des données de la visite...',
    preparing: 'Préparation de votre visite...',
    audio: 'Chargement audio et images',
  },
  errors: {
    loadFailed: 'Erreur de chargement des données',
    tourLoadFailed: 'Échec du chargement des données de la visite',
    downloadFailed: 'Échec du téléchargement',
    retry: 'Réessayer',
    httpsTooltip: '💡 Astuce : Utilisez HTTPS ou accédez via localhost pour les téléchargements hors ligne',
  },
  startCard: {
    preparing: 'Préparation...',
    loadingTour: 'Chargement de la visite...',
    replayTour: 'Rejouer la visite',
    resumeTour: 'Reprendre la visite',
    downloadTour: 'Télécharger la visite',
    startTour: 'Démarrer la visite',
    offlineInfo: 'Téléchargez cette visite maintenant pour en profiter hors ligne dans les zones à connectivité limitée.',
  },
  rating: {
    title: 'Comment avez-vous aimé cette visite ?',
    subtitle: 'Vos commentaires sont précieux pour nous !',
    tapToRate: 'Appuyez pour noter',
    shareDetails: 'Souhaitez-vous partager plus de détails ?',
    feedbackPlaceholder: 'Décrivez ce que vous avez aimé ou non...',
    next: 'Suivant',
    stayInLoop: 'Rester informé ?',
    emailInfo: 'Entrez votre e-mail pour recevoir des mises à jour sur les nouvelles visites et offres exclusives.',
    emailPlaceholder: 'votre@email.fr',
    subscribe: "S'abonner",
    skip: 'Passer',
    thankYou: 'Merci !',
    appreciateFeedback: 'Nous apprécions vos commentaires.',
    close: 'Fermer',
    subscribed: 'Vous êtes abonné !',
    checkInbox: 'Vérifiez votre boîte de réception.',
  },
  tourComplete: {
    title: 'Visite terminée !',
    message: 'Vous avez écouté tous les arrêts audio. Nous espérons que vous avez apprécié la visite.',
    rateTour: 'Noter cette visite',
    skipRating: 'Ignorer la note',
    done: 'Terminé',
  },
  tourHeader: {
    minLeft: 'min restantes',
  },
} as const;
