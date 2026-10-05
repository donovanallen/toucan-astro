// Ported from toucan-react portfolio-data.js
// Cover/feature images served from /images (sanitized names, no spaces)

const PortfolioData = {
  items: [
    {
      title: 'Scilent UI',
      subtitle: 'design system + UI kit',
      link: '/scilent-ui',
      overview:
        'A component and utility library for music-based applications and UIs',
      images: [
        { src: '/images/scilent-ui/cover.png', alt: 'scilent ui cover image' },
      ],
    },
    {
      title: 'scilent music',
      subtitle: 'mobile application',
      link: '/scilent-music',
      overview:
        'An original music app designed to elevate the listening experience',
      description:
        'This ongoing project has served as a platform for my own re-imagining of the modern, integrated music listening experience focused around enhancing the ways in which listeners interact with the music they hear everyday.',
      skills: [
        'mobile development',
        'web development',
        'react native',
        'ui/ux',
        'visual design',
        'interaction design',
      ],
      images: [
        { src: '/images/sd01/cover.png', alt: 'scilent music cover image' },
      ],
      features: [
        {
          title: 'Release Day Central',
          description:
            "A central hub for all your favorite artists' releases",
          images: [{ src: '/images/sd01/release-hub.png', alt: 'scilent music release hub' }],
        },
        {
          title: 'Listen in stereo',
          description:
            'Aggregated listening data and real-time insights to give you and your followers a full view of your listening experience, tendencies, departures, and discoveries',
          images: [{ src: '/images/sd01/aura-insights.png', alt: 'scilent music data insights' }],
        },
        {
          title: 'Be heard',
          description:
            'An all-new Verified Review Engine TM that ensures real and authentic reviews and reactions from real fans and listeners.',
          images: [{ src: '/images/sd01/review-engine.png', alt: 'scilent music review engine' }],
        },
      ],
    },
    {
      title: 'Holiday Gift Guide',
      subtitle: 'web + mobile web experience',
      link: '/holiday-gift-guide',
      overview:
        "lululemon's festive web experience for the holidays",
      description:
        "As a frontend engineer with lululemon's Digital Elevated Experiences team, I contributed to the redesign and implementation of the Holiday Gift Guide and related web experiences.",
      skills: ['web development', 'frontend', 'react', 'Contentful CMS'],
      images: [
        { src: '/images/lululemon/desktop.png', alt: 'gift guide cover image' },
        { src: '/images/lululemon/browser.png', alt: 'gift guide cover image' },
      ],
    },
    {
      title: 'F1 23 Redesign',
      subtitle: 'UX Design Case Study',
      link: '/f1-23',
      overview:
        'A case study on enhancing the user experience of EA Sports F1 23',
      description:
        'This design exploration addresses the user experience and visual design of F1 23 in three main ways: data visualization, layout of information, and improved visual design cues.',
      skills: ['ui/ux', 'visual design', 'figma', 'adobe cc'],
      images: [
        { src: '/images/f1/cover.jpeg', alt: 'f1 cover image' },
      ],
    },
  ],
};

export default PortfolioData;
