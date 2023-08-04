# Nova Framework

Nova est un framework Node.js qui suit le modèle MVC (Model-View-Controller). Il est conçu pour faciliter la création et la gestion d'une application Node.js, avec des utilitaires intégrés pour des tâches courantes comme la connexion à la base de données, la génération de routes, la gestion des erreurs et la journalisation. Il fournit également une interface en ligne de commande (CLI) pour une gestion plus facile de l'application.

## Table des matières

- [Installation](#installation)
- [Utilisation CLI](#utilisation-cli)
  - [Commande init](#commande-init)
  - [Commande start](#commande-start)
  - [Commande model](#commande-model)
  - [Commande deploy](#commande-deploy)
  - [Commande git](#commande-git)
- [Utilisation businessLogic](#utilisation-businesslogic)

# Installation

- Clonez le projet à partir du repository GitHub

```bash
  git clone <URL_DU_REPOSITORY>
```

- Accédez au répertoire du projet

```bash
  cd nom-du-projet
```

- Installez les dépendances

```bash
  npm install
```

- Liez le package localement pour utiliser les commandes CLI de Nova

```bash
  npm link
```

## Utilisation CLI

### Commande init

Cette commande initialise un nouveau projet. Elle vous posera des questions sur le port du projet et l'URL de la base de données. Ces informations seront utilisées pour créer le fichier .env.

```bash
  nova init
```

### Commande start

Cette commande démarre le serveur. Elle utilise le fichier .env pour récupérer les informations de connexion à la base de données et le port du serveur.

```bash
  nova start
```

### Commande model

Cette commande génère un nouveau modèle. Elle vous posera des questions sur le nom du modèle, le nombre de champs que vous souhaitez ajouter au modèle, le nom de chaque champ, le type de chaque champ et si chaque champ est requis. Un nouveau fichier de modèle sera créé dans le dossier models avec les informations que vous avez fournies.

```bash
  nova model
```

### Commande deploy

Cette commande déploie le serveur. Si vous choisissez d'utiliser Docker, elle générera un fichier Dockerfile avec les informations de votre fichier .env.

```bash
  nova deploy
```

### Commande git

Cette commande exécute des commandes git. Elle vous posera des questions sur le message du commit, la branche sur laquelle vous voulez pousser, si vous êtes en développement et si vous voulez pousser les modifications. Si vous êtes en développement, tous les fichiers dans le dossier models sauf User.js seront supprimés. Ensuite, elle exécutera les commandes git add et git commit avec le message que vous avez fourni. Si vous choisissez de pousser les modifications, elle exécutera également la commande git push.

```bash
  nova git
```

## Utilisation businessLogic

Pour ajouter de la logique métier à un modèle, utilisez l'attribut `businessLogic`. Par exemple, pour le modèle `User` :

```javascript
User.businessLogic = {
  findByAge: {
    route: "/findByAge/:age",
    method: "get",
    handler: async (req, res, next) => {
      // Votre logique ici
    },
  },
  login: {
    route: "/login",
    method: "post",
    handler: async (req, res, next) => {
      // Votre logique ici
    },
  },
  // Ajoutez d'autres méthodes spécifiques à User ici
};
```
