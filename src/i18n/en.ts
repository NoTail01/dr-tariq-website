/**
 * English dictionary — source of truth for translation keys.
 * Adding a key here forces the Arabic file to define it too,
 * because `ar` is typed as `Dictionary`.
 */
export const en = {
  meta: {
    siteName: "Dr Tariq Abu Hweij",
    titleTemplate: "%s | Dr Tariq Abu Hweij",
    defaultTitle: "Dr Tariq Abu Hweij | Internal Medicine & Nephrology in Amman",
    defaultDescription:
      "Official website of Dr Tariq Abu Hweij, consultant in internal medicine, nephrology, kidney transplantation and hypertension in Amman. Verified qualifications, specialties, and booking.",
    seo: {
      home: {
        title: "Dr Tariq Abu Hweij | Internal Medicine & Nephrology in Amman",
        description:
          "Official website of Dr Tariq Abu Hweij, consultant in internal medicine, nephrology, kidney transplantation and hypertension in Amman. Verified qualifications, specialties, and booking.",
      },
      about: {
        title: "About Dr Tariq Abu Hweij — Qualifications & Specialties | Amman Clinic",
        description:
          "Biography and verified qualifications of Dr Tariq Abu Hweij: Jordanian Board in Internal Medicine, Jordanian Board in Nephrology, and German Board. Consultant in internal medicine and nephrology in Amman.",
      },
      blog: {
        title: "Blog — Dr Tariq Abu Hweij",
        description: "Articles on kidney and internal medicine by Dr Tariq Abu Hweij, in Arabic and English.",
      },
      book: {
        title: "Appointments & Clinic Contact — Dr Tariq Abu Hweij",
        description:
          "Call the clinic to book an appointment with Dr Tariq Abu Hweij in Amman. Mobile and landline numbers, clinic location and map.",
      },
    },
  },
  nav: {
    home: "Home",
    about: "About the Doctor",
    blog: "Blog",
    book: "Book Now",
    skipToContent: "Skip to main content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    switchLanguage: "العربية",
    switchLanguageLabel: "Switch language to Arabic",
  },
  common: {
    readMore: "Read more",
    learnMore: "Learn more",
    bookingCta: "Book now",
    backToBlog: "Back to articles",
    comingSoon: "Coming soon",
    awaitingVerification: "Awaiting verification",
    devNoticeBadge: "DEV PLACEHOLDER",
    demoBadge: "DEMO",
    emptyStateTitle: "Nothing here yet",
    loading: "Loading…",
    errorTitle: "Something went wrong",
    errorRetry: "Try again",
    notFoundTitle: "Page not found",
    notFoundText: "The page you are looking for does not exist or has moved.",
    goHome: "Go to the home page",
    verified: "Verified",
    unverified: "Not verified yet",
    portraitAlt: "Dr Tariq Abu Hweij",
  },
  home: {
    heroKicker: "Consultant in Internal Medicine & Nephrology",
    heroTitle: "Dr Tariq Abu Hweij",
    heroTitleNote:
      "Consultant in Internal Medicine, Nephrology, Kidney Transplantation and Hypertension",
    heroLead:
      "The clinic of Dr Tariq Abu Hweij, consultant in internal medicine and nephrology in Amman — behind the Specialty Hospital, Al-Riyad Medical Complex, first floor.",
    heroPrimary: "Contact the Clinic for an Appointment",
    heroSecondary: "About the doctor",
    aboutTitle: "About the doctor",
    aboutText:
      "Dr Tariq Abu Hweij holds the Jordanian Board in Internal Medicine and the Jordanian Board in Nephrology, as well as the German Board. Read the full profile for qualifications, memberships and specialties.",
    aboutLink: "Read the full profile",
    qualificationsTitle: "Qualifications",
    qualificationsIntro: "Board certifications verified on the hospital doctor profile page.",
    membershipsTitle: "Memberships",
    membershipsIntro: "Memberships are published exactly as stated by each source.",
    servicesTitle: "Specialties",
    specialtiesKicker: "Fields of expertise",
    servicesIntro:
      "Informational overview of the doctor's listed specialty areas. Kidney transplantation is a field of expertise; surgical procedures are not performed at this clinic.",
    services: [
      {
        title: "Internal medicine",
        text: "Diagnosis and follow-up of internal medicine conditions in adults.",
      },
      {
        title: "Nephrology",
        text: "Diagnosis and follow-up of kidney conditions.",
      },
      {
        title: "Kidney transplantation",
        text: "A listed field of expertise — transplantation consultations are not surgical procedures at this clinic.",
      },
      {
        title: "Hypertension",
        text: "Diagnosis and follow-up of high blood pressure.",
      },
    ],
    articlesTitle: "Latest articles",
    articlesText: "Newest published articles from the blog.",
    articlesEmpty: "No articles have been published yet.",
    contactTitle: "Clinic & contact",
    contactText:
      "To arrange an appointment with Dr Tariq Abu Hweij, contact the clinic by phone or WhatsApp to enquire about availability.",
    contactPlaceholder: "Contact details will be published here.",
    locationCardLabel: "Clinic location",
    locationTitle: "Dr Tariq Abu Hweij's Clinic Location in Amman",
    locationText:
      "Find Dr Tariq Abu Hweij's clinic in Amman: view the map or call the clinic to ask about appointments. The clinic is behind the Specialty Hospital, Al-Riyad Medical Complex, first floor.",
    openInMaps: "Open in Google Maps",
    mapTitle: "Map of Dr Tariq Abu Hweij's clinic in Amman",
    finalCtaTitle: "Contact the clinic",
    finalCtaText:
      "To arrange an appointment with Dr Tariq Abu Hweij, contact the clinic by phone or WhatsApp to enquire about availability.",
  },
  about: {
    title: "About the Doctor",
    description: "Biography, verified qualifications, and specialties of Dr Tariq Abu Hweij.",
    bioTitle: "Biography",
    portraitNote: "Dr Tariq Abu Hweij — consultant in internal medicine and nephrology.",
    qualificationsTitle: "Qualifications",
    qualificationsIntro:
      "Certifications as listed on the Specialty Hospital doctor profile page.",
    qualificationsNote:
      "The German Board is listed on the hospital page without naming its exact specialty or issuing organization; none is added here.",
    membershipsTitle: "Memberships",
    membershipsNotes: [
      "Member of the German Association for Internal Medicine and Cardiology — as stated on the supplied clinic branding.",
      "Member of the German Medical Association and the Jordanian Medical Association — as listed on the Specialty Hospital doctor profile page.",
    ],
    specialtiesTitle: "Specialty areas",
    specialtiesIntro:
      "Informational sections based on the professional title printed on the clinic's supplied branding.",
    languagesTitle: "Languages",
    languagesIntro: "Languages listed on the hospital doctor profile page.",
    sourcesTitle: "Source of published information",
    sourcesText:
      "Every published fact about the doctor is traceable to a source: the Specialty Hospital doctor profile page and the clinic's supplied brand image. See SOURCES.md in the project repository.",
  },
  blog: {
    title: "Blog",
    description: "Articles by Dr Tariq Abu Hweij in Arabic and English.",
    emptyTitle: "No published articles yet",
    emptyText: "Articles will appear here once they are written and published from the dashboard.",
    demoNotice:
      "Demo articles are clearly labelled, excluded from the sitemap, and hidden in production builds.",
    filterAll: "All",
    filterLabel: "Article categories",
    updated: "Updated",
    publishedOn: "Published on",
    categoryDemo: "Demo",
    categoryGuides: "Guides",
    categoryNews: "Clinic news",
    demoArticleBadge: "Demo article — not medical content",
    byAuthor: "By",
    reviewPendingBadge: "Awaiting medical review",
    reviewPendingNote:
      "This article is published awaiting the doctor's review: it has not been reviewed by him and is not attributed to him as author or reviewer. The source cited at the end of the article is its reference.",
    notInLanguage: "This article is not available in this language yet.",
    readInArabic: "Read it in Arabic",
    readInEnglish: "Read it in English",
  },
  book: {
    title: "Appointments & Clinic Contact",
    description:
      "To arrange an appointment with Dr Tariq Abu Hweij, contact the clinic by phone or WhatsApp to enquire about availability.",
    intro:
      "To arrange an appointment with Dr Tariq Abu Hweij, contact the clinic by phone or WhatsApp to enquire about availability. The numbers below are the clinic's published contact lines.",
    optionsTitle: "Contact options",
    mobileTitle: "Mobile",
    mobileText: "Mobile number as published on the clinic's branding.",
    landlineTitle: "Clinic landline",
    landlineText: "Clinic landline as published on the clinic's branding.",
    callAction: "Call the Clinic",
    mobileCallPrompt: "To reach the clinic",
    whatsappTitle: "WhatsApp",
    whatsappText:
      "Send a WhatsApp message to the clinic about an appointment. Opening the chat does not confirm a booking — the clinic replies to arrange the time.",
    whatsappPending: "WhatsApp is not active for this number at the moment.",
    whatsappAction: "Enquire About an Appointment",
    whatsappNote: "Opening WhatsApp starts a chat — it does not confirm an appointment.",
    emailTitle: "By email",
    emailText: "No public email address has been supplied yet.",
    emailAction: "Send an email",
    requestTitle: "Appointment request",
    requestText: "Send a request with your preferred time. We only need minimal contact details.",
    disabledNotice: "This channel is inactive until verified details are provided.",
    formNotice:
      "Local demo: this form does not send anything anywhere. No data leaves your computer. The only working booking channel today is a phone call to the clinic.",
    privacyNotice:
      "Please do not include medical history or any sensitive health information in this form.",
    fields: {
      name: "Full name",
      namePlaceholder: "Your name",
      contact: "Preferred contact method",
      contactEmail: "Email",
      contactPhone: "Phone",
      contactWhatsapp: "WhatsApp",
      contactValue: "Contact detail",
      contactValuePlaceholder: "Email or phone number",
      preferredTime: "Preferred time",
      preferredTimePlaceholder: "e.g. weekday morning",
      message: "Message (optional)",
      messagePlaceholder: "Anything we should know to reach you",
      submit: "Send request",
      submitting: "Sending…",
    },
    validation: {
      nameRequired: "Please enter your name.",
      nameTooLong: "The name is too long (max 120 characters).",
      contactRequired: "Please choose a contact method.",
      contactValueRequired: "Please enter how we can reach you.",
      contactValueInvalid: "Enter a valid email address or phone number.",
      preferredTimeTooLong: "The preferred time is too long (max 200 characters).",
      messageTooLong: "The message is too long (max 2000 characters).",
      consentRequired: "Please confirm you understand this is a demo submission.",
      invalidPayload: "The submitted data is not valid.",
    },
    consent: "I understand that this local demo does not actually send my request.",
    result: {
      demoTitle: "Demo mode — request NOT sent",
      demoText:
        "The website is running locally without a backend, so your request was not transmitted anywhere. Nothing was saved.",
      successTitle: "Request received",
      successText: "Your appointment request was submitted successfully. The clinic will contact you.",
      errorTitle: "The request could not be sent",
      errorText: "Please try again later or use another contact option.",
    },
  },
  footer: {
    rights: "All rights reserved.",
    developedNote: "Internal medicine and nephrology clinic — Amman.",
    quickLinks: "Quick links",
    contact: "Contact",
    noContactYet: "Contact details will be published here.",
    disclaimerTitle: "Medical disclaimer",
    disclaimer:
      "The content on this website is for general information only and does not replace a personal medical consultation.",
  },
};

export type Dictionary = typeof en;
