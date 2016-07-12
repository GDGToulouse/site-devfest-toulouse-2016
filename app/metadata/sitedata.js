module.exports = {
  statistics: [{
    counter: 250,
    caption: 'Participants'
  }, {
    counter: 1,
    caption: 'Journée'
  }, {
    counter: 20,
    caption: 'Sessions'
  }, {
    counter: 3,
    caption: 'Tracks en parallèle'
  }],
  callToAction: {
    text: 'Nos autres conférences',
    buttonText: 'Voir plus de photos',
    video: {
      id: 't95z_HLMTmM',
      title: 'GDG DevFest Ukraine 2014 - Highlights'
    }
  },
  galleryBlock: {
    title: 'GDG DevFest Ukraine 2014 - Photos',
    photos: {
      big: '../images/backgrounds/2015_1.jpg',
      small: ['../images/backgrounds/2015_2.jpg', '../images/backgrounds/2015_3.jpg']
    },
    albumUrl: 'https://plus.google.com/events/gallery/cc6tosp4ohkp6qj9pg5jb4g6o3k?sort=1'
  },
  ticketsBlock: {
    title: 'Billets',
    tickets: [{
      name: 'Prix unique',
      price: 30,
      currency: 'EUROS',
      info: 'Tarif standard',
      soldOut: false
    }],
    details: 'Votre billet vous donne accès à toutes les conférences, aux pauses café, repas et à la soirée. L\'hébergement n\'est PAS inclus dans ce prix.'
  },
  socialFeed: {
    source: '/data/tweets.json'
  },
  partnershipProposition: '/assets/DossierSponsoringPartenariat-DevFestToulouse.pdf'
};
