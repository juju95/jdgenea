# Charte UI/UX - JdGenea

## 1. Identité Visuelle

### 1.1 Palette de Couleurs Pastel

**Couleurs Principales:**
- **Rose Poudré**: `#F8E2E4` - Couleur principale pour les éléments importants
- **Bleu Ciel**: `#E8F4F8` - Couleur secondaire pour les actions et liens
- **Vert Menthe**: `#E8F5E8` - Couleur de validation et succès
- **Jaune Pâle**: `#FFF8E1` - Couleur d'accentuation et mise en avant

**Couleurs Neutres:**
- **Gris Perle**: `#F5F5F5` - Fond principal
- **Gris Clair**: `#E0E0E0` - Bordures et séparations
- **Texte Principal**: `#4A4A4A` - Texte corps
- **Texte Secondaire**: `#8A8A8A` - Texte descriptif

**Couleurs d'État:**
- **Succès**: `#A8E6A3` (vert menthe foncé)
- **Erreur**: `#FFB7B2` (corail pâle)
- **Avertissement**: `#FFEAA7` (jaune pastel)
- **Info**: `#BEE3F8` (bleu pâle)

### 1.2 Typographie

**Polices:**
- **Titre Principal**: 'Poppins', sans-serif (600)
- **Titres Secondaires**: 'Inter', sans-serif (500)
- **Corps de Texte**: 'Inter', sans-serif (400)
- **Texte Petit**: 'Inter', sans-serif (300)

**Tailles:**
- H1: 32px (2rem)
- H2: 24px (1.5rem)
- H3: 20px (1.25rem)
- Corps: 16px (1rem)
- Petit: 14px (0.875rem)
- Très petit: 12px (0.75rem)

## 2. Composants UI

### 2.1 Navigation

**Navbar Principale:**
- Hauteur: 80px
- Fond: Blanc avec ombre douce (`box-shadow: 0 2px 10px rgba(0,0,0,0.05)`)
- Logo à gauche, menu centré, profil à droite
- Effet hover: fond rose poudré très léger

**Sidebar (Dashboard):**
- Largeur: 280px
- Fond: `#F8F9FA`
- Bordure droite: 1px solide `#E0E0E0`
- Icônes + texte avec espacement généreux

### 2.2 Cartes (Cards)

**Card Standard:**
```css
.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
}
```

### 2.3 Boutons

**Bouton Primaire:**
- Fond: Rose poudré dégradé
- Texte: Blanc
- Bordures: Arrondies (8px)
- Padding: 12px 24px
- Effet hover: Légère augmentation de luminosité

**Bouton Secondaire:**
- Fond: Blanc
- Bordure: 2px solide bleu ciel
- Texte: Bleu ciel
- Même padding et arrondis que primaire

### 2.4 Formulaires

**Champs de Texte:**
- Fond: `#FAFAFA`
- Bordure: 2px solide `#E0E0E0`
- Border-radius: 8px
- Padding: 12px 16px
- Focus: Bordure bleu ciel avec transition douce
- Labels: Texte secondaire au-dessus du champ

**Sélecteurs:**
- Style cohérent avec les champs texte
- Flèche personnalisée en bleu ciel
- Options avec hover en rose poudré très léger

### 2.5 Modales

**Modal Container:**
- Fond: Blanc avec bordure arrondie (16px)
- Ombre portée importante pour créer de la profondeur
- Padding: 32px
- Largeur max: 600px (responsive)
- Fond overlay: Noir semi-transparent (0.5 opacity)

## 3. Layout et Grille

### 3.1 Système de Grille
- Container max-width: 1200px
- Gouttières: 24px
- Colonnes: 12 sur desktop, 8 sur tablette, 4 sur mobile

### 3.2 Espacement
- Base: 8px
- Multiples: 8, 16, 24, 32, 48, 64px
- Espacement généreux pour une respiration optimale

## 4. Responsive Design

### 4.1 Breakpoints
- Mobile: < 768px
- Tablette: 768px - 1024px
- Desktop: > 1024px

### 4.2 Adaptations
- **Mobile**: Navigation en bas d'écran (bottom nav), cartes empilées verticalement, textes plus grands
- **Tablette**: Sidebar rétractable, grille 2 colonnes
- **Desktop**: Utilisation complète de l'espace, sidebar fixe

## 5. Accessibilité

### 5.1 Contraste
- Ratio minimum: 4.5:1 pour le texte normal
- Ratio minimum: 3:1 pour le texte grand
- Test sur tous les fonds pastel

### 5.2 Navigation Clavier
- Tous les éléments interactifs accessibles au clavier
- Focus visible avec contour bleu ciel de 2px
- Ordre de tabulation logique

### 5.3 ARIA Labels
- Labels descriptifs pour les icônes
- États clairs pour les formulaires
- Annonces pour les changements dynamiques

## 6. Maquettes des Pages Principales

### 6.1 Page d'Accueil

**Structure:**
```
[Navbar blanche avec logo et boutons Login/Register]

[Héro Section]
- Titre: "Découvrez votre histoire familiale"
- Sous-titre: "Créez, explorez et partagez votre arbre généalogique"
- CTA Principal: "Commencer gratuitement" (rose poudré)
- CTA Secondaire: "En savoir plus" (bleu ciel)
- Illustration: Famille heureuse style flat design pastel

[Features Section]
- 3 cartes avec icônes:
  * "Interface intuitive" (icône main + cœur)
  * "Partage facile" (icône partage)
  * "Sécurité maximale" (icône cadenas)

[Stats Section]
- Compteur d'utilisateurs avec animations
- Témoignages en carousel

[Footer]
- Liens importants, réseaux sociaux, copyright
```

**Design visuel:**
- Fond dégradé très légent de rose poudré vers blanc
- Espacement généreux entre sections (80px)
- Animations douces au scroll

### 6.2 Page Login/Register

**Structure commune:**
```
[Logo centré en haut]

[Card centrale]
- Titre: "Connexion" / "Inscription"
- Formulaire avec champs arrondis
- Bouton de soumission principal
- Lien vers l'autre page
- Séparateur "ou" avec connexion sociale (optionnel)
```

**Design spécifique:**
- Fond: Rose poudré très pâle
- Card: Blanche avec ombre douce centrée
- Largeur: 400px max
- Illustration subtile en arrière-plan (contour d'arbre généalogique)

### 6.3 Dashboard

**Structure:**
```
[Sidebar gauche - 280px]
- Logo compact
- Menu principal:
  * Tableau de bord (actif)
  * Mon arbre généalogique
  * Membres de la famille
  * Import/Export
  * Paramètres
- Profil en bas

[Zone principale]
- Header avec titre et notifications
- Statistiques en cartes:
  * Nombre total de personnes
  * Générations trouvées
  * Documents attachés
  * Dernière mise à jour

[Section activité récente]
- Timeline des dernières modifications
- Cartes des personnes récemment ajoutées

[Section raccourcis]
- Boutons rapides pour actions fréquentes
```

**Design visuel:**
- Sidebar: Fond gris perle très clair
- Cards de stats: Chiffres en gros caractères, icônes pastel
- Timeline: Ligne verticale bleu ciel avec points rose poudré

### 6.4 Éditeur d'Arbre Généalogique

**Structure:**
```
[Barre d'outils en haut]
- Boutons: Ajouter personne, Modifier, Supprimer
- Zoom: +/- et reset
- Vue: Arbre, Liste, Timeline
- Recherche rapide

[Zone d'édition principale]
- Canvas pour l'arbre (fond crémeux)
- Personnes représentées en cartes rondes:
  * Photo ou icône par défaut
  * Nom et dates
  * Bouton d'édition au survol
- Connexions en lignes courbes bleu ciel

[Sidebar droite - rétractable]
- Détail de la personne sélectionnée
- Formulaire d'édition
- Médias et documents
```

**Interactions:**
- Drag & drop pour réorganiser
- Double-clic pour éditer
- Clic droit menu contextuel
- Zoom avec molette

### 6.5 Fiche Personne

**Structure:**
```
[Header avec photo et nom]
- Photo ronde (120px)
- Nom complet en grand
- Dates clés (naissance/décès)
- Boutons d'action: Éditer, Partager, Imprimer

[Onglets]
- Informations générales
- Événements
- Médias
- Documents
- Notes

[Contenu par onglet]
- Coordonnées, relations familiales
- Timeline visuelle des événements
- Galerie photo avec grid responsive
- Liste documents avec prévisualisation
- Éditeur de texte riche pour notes
```

**Design:**
- Photo avec bordure rose poudré de 4px
- Onglets avec indicateur bleu ciel actif
- Cards pour chaque section d'information
- Timeline avec icônes pastel

### 6.6 Page Import/Export

**Structure:**
```
[Section Import]
- Zone de drag & drop (fond bleu ciel très pâle)
- Bouton parcourir
- Formats supportés: GEDCOM, CSV, JSON
- Prévisualisation avant import
- Options d'import (doublons, validation)

[Section Export]
- Sélection du format
- Options de personnalisation
- Bouton télécharger
- Historique des exports

[Section Sauvegarde]
- Bouton sauvegarder maintenant
- Planification automatique
- Restauration depuis sauvegarde
```

**Design visuel:**
- Zone drag & drop avec bordure en pointillés bleu ciel
- Icônes de format de fichier colorés
- Progress bar pastel pendant l'import
- Messages de succès en vert menthe

## 7. Animations et Micro-interactions

### 7.1 Transitions
- Durée: 0.2s à 0.3s
- Timing function: ease-out
- Pas d'animations sur mobile pour performance

### 7.2 Hover Effects
- Boutons: Légère élévation et changement de luminosité
- Cards: Translation de -2px et ombre renforcée
- Liens: Soulignement animé de gauche à droite

### 7.3 Loading States
- Spinner: Cercle rose poudré avec rotation
- Skeleton screens pour les contenus chargés
- Messages de progression avec barres pastel

## 8. Icônes et Illustrations

### 8.1 Icônes
- Style: Line icons avec remplissage pastel au survol
- Taille standard: 24x24px
- Couleur: Gris qui hérite de la couleur parent au survol

### 8.2 Illustrations
- Style: Flat design avec formes arrondies
- Palette: Couleurs pastel de la charte
- Thèmes: Famille, arbre, connexion, héritage

## 9. Messages et Feedback

### 9.1 Toast Notifications
- Position: En haut à droite
- Durée: 4 secondes
- Styles selon le type (succès, erreur, info)
- Bouton fermer (X) discret

### 9.2 Messages Inline
- Validation de formulaire: Sous le champ
- Couleurs: Rouge pâle pour erreur, vert menthe pour succès
- Icônes pour renforcer le message

### 9.3 Modales de Confirmation
- Pour actions destructrices
- Boutons clairs: Annuler (secondaire) / Confirmer (rouge pâle)
- Message explicite des conséquences

Cette charte UI/UX garantit une expérience utilisateur agréable, accessible et cohérente tout en respectant l'identité visuelle pastel et conviviale souhaitée pour l'application de généalogie.