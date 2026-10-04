// Every piece of text on the page, per language. Elements carry
// `data-i18n="key.path"` (plain text) or `data-i18n-html` (allows markup);
// app.js fills them in. Dynamic texts are functions.
/** Russian plural form for a count: one (1, 21…), few (2–4, 22–24…), many. */
function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

window.SOMA_I18N = {
  en: {
    meta: {
      title: "Soma - your digital assistant",
    },
    nav: { features: "Features", chat: "Chat", download: "Download", developer: "Developer" },
    hero: {
      platforms: "Available for",
      platformsSoon: "Coming to",
      title: 'Meet <span class="accent">Soma</span>, your digital assistant',
      lead: "She keeps an eye on your computer, reminds you of tasks on your schedule, and now and then simply watches you.",
      otherVersions: "Other versions",
    },
    features: {
      title: "What Soma can do",
      lead: "Everything lives in one small window - and in notifications that show up right when they matter.",
      modules: {
        tag: "Modules",
        title: "She watches your computer for you",
        text: "RAM load, hardware temperature, the internet connection, and whether some program is secretly using your camera or microphone. Set the thresholds, the check frequency and the messages - Soma lets you know when something's off.",
      },
      planner: {
        tag: "Task planner",
        title: "Reminders on your schedule",
        text: "A workout every Friday, a birthday once a year, a doctor's visit on a set day - Soma reminds you of it all on time. Repeat once, on chosen dates, or every hour, day, week, month or year, and let her remind you a little early so nothing catches you off guard.",
      },
      notifications: {
        tag: "Notifications",
        title: "Never misses a beat",
        text: "Neat neon toasts in the corner and on the monitor you choose, 18 sounds to pick from, and a right click to read a long message in full without opening the app.",
      },
      character: {
        tag: "Character",
        title: "Is she alive?",
        text: "Soma narrates her work in a console log, shows what she's busy with right under her name, and every now and then comments on what you do.",
      },
      style: {
        tag: "Customization",
        title: "Make her your own",
        text: "Six neon themes, an avatar to match each one, and three languages. Pick the notification sound, the corner and even the monitor they show up on.",
      },
    },
    demo: {
      tag: "Try it",
      title: "Chat with Soma",
      lead: "She already knows a thing or two about you and your system. Maybe it's time to get to know each other better?",
      privacy: "Everything she finds out stays on your computer: nothing is sent anywhere.",
      online: "Online",
      typing: "typing",
      hello: "Hi! I'm Soma 👋",
      system: (os, browser) => (browser ? `I see you're on ${os}, in ${browser}.` : `I see you're on ${os}.`),
      screen: (w, h, scale) => `Your screen is ${w}×${h}${scale ? `, scaled to ${scale}%` : ""}.`,
      locale: (language, offset) =>
        `Your system speaks ${language}${offset ? `, and your time zone is ${offset}` : ""}.`,
      theme: (dark) => (dark ? "And you're on a dark theme - approved 🖤" : "A light theme? Bold ☀️"),
      time: (time, hour) => {
        const remark =
          hour < 5 ? "Can't sleep?" : hour < 12 ? "Good morning! ☀️" : hour >= 18 ? "Good evening 🌙" : "";
        return `It's ${time} where you are. ${remark}`.trim();
      },
      outro:
        "That's all I can see from here - the browser won't let me any further. Download me, and I'll keep an eye on your RAM, temperature and camera for real.",
      replies: {
        skills: {
          ask: "What can you do?",
          answer:
            "I watch your RAM, hardware temperature, internet, camera and microphone, remind you of tasks on your schedule - and now and then comment on what you're up to 😏",
        },
        watching: {
          ask: "Are you watching me?",
          answer:
            "From here - only what the browser allows. On your device, though... well, you won't know until you download me)",
        },
        download: {
          ask: "How do I get you?",
          answer: "Easy - I'll pick the right version for your system myself.",
          action: "Go to downloads",
        },
      },
    },
    download: {
      title: "Download Soma",
      button: "Download",
      buttonFor: (os) => `Download for ${os}`,
      allVersions: "All versions",
      loading: "Loading versions…",
      detected: "Your system",
      latest: (version, date) => `Version ${version} · ${date}`,
      unsupported: "Soma isn't available for your system yet",
      unsupportedMeta: "Soma runs on Windows, macOS and Linux. Pick a version for one of them below.",
      noReleases: "The first version is on its way",
      noReleasesMeta: "Soma hasn't been released yet - check back soon.",
      noBuildForOs: (os) => `No ${os} build in the latest version yet`,
      noBuildMeta: "You can pick a version for another system below.",
      loadFailed: "Couldn't load the list of versions.",
      openReleases: "Open releases on GitHub",
      latestBadge: "latest",
      noteUnsupported: "Soma isn't available for your system yet - see all versions below.",
      kinds: {
        msi: "Windows installer (.msi)",
        exe: "Windows setup (.exe)",
        dmg: "macOS disk image (.dmg)",
        appimage: "AppImage - any distro",
        deb: "Debian / Ubuntu (.deb)",
        rpm: "Fedora / openSUSE (.rpm)",
      },
    },
    developer: {
      title: "Developer",
      text: "Soma is made by one person - kiber_god. Found a bug, have an idea, or just want to say hi? Write to me.",
      issue: "Report a problem",
    },
    footer: { releases: "Releases on GitHub" },
  },

  ru: {
    meta: {
      title: "Сома - твоя цифровая помощница",
    },
    nav: { features: "Возможности", chat: "Чат", download: "Скачать", developer: "Разработчик" },
    hero: {
      platforms: "Доступна для",
      platformsSoon: "Скоро для",
      title: '<span class="accent">Сома</span> - твоя цифровая помощница',
      lead: "Она следит за состоянием компьютера, напоминает о задачах в расписании и иногда просто наблюдает за тобой.",
      otherVersions: "Другие версии",
    },
    features: {
      title: "Что умеет Сома",
      lead: "Всё в одном небольшом окне - и в уведомлениях, которые появляются ровно тогда, когда нужно.",
      modules: {
        tag: "Модули",
        title: "Следит за компьютером вместо тебя",
        text: "Нагрузка на ОЗУ, температура железа, интернет-подключение и то, не слушает ли какая-нибудь программа тайком камеру или микрофон. Настрой пороги, частоту проверки и сообщения - Сома сообщит, если что-то пошло не так.",
      },
      planner: {
        tag: "Планировщик задач",
        title: "Напоминания по твоему расписанию",
        text: "Тренировка по пятницам, день рождения раз в год, визит к врачу в конкретный день - Сома вовремя напомнит обо всём. Один раз, в выбранные даты или каждый час, день, неделю, месяц и год, а если нужно - заранее, чтобы ничего не застало врасплох.",
      },
      notifications: {
        tag: "Уведомления",
        title: "Ничего не пропустит",
        text: "Аккуратные неоновые уведомления в выбранном углу и на выбранном мониторе, 18 звуков на выбор и правый клик, чтобы прочитать длинное сообщение целиком, не открывая приложение.",
      },
      character: {
        tag: "Характер",
        title: "Она живая?",
        text: "Сома рассказывает о своей работе в консоли логов, показывает под своим именем, чем занята, и иногда комментирует то, что ты делаешь.",
      },
      style: {
        tag: "Кастомизация",
        title: "Измени её под себя",
        text: "Шесть неоновых тем, аватар под каждую и поддержка трёх языков. Выбери звук уведомлений, угол экрана и даже монитор, на котором они появятся.",
      },
    },
    demo: {
      tag: "Попробуй",
      title: "Поболтай с Сомой",
      lead: "Она уже кое-что знает о тебе и твоей системе. Может, самое время познакомиться поближе?",
      privacy: "Всё, что она узнаёт, остаётся на твоём компьютере: никуда ничего не отправляется.",
      online: "В сети",
      typing: "печатает",
      hello: "Привет! Я Сома 👋",
      system: (os, browser) => (browser ? `Вижу, ты на ${os}, в ${browser}.` : `Вижу, ты на ${os}.`),
      screen: (w, h, scale) => `Экран ${w}×${h}${scale ? `, масштаб ${scale}%` : ""}.`,
      locale: (language, offset) => `Язык системы - ${language}${offset ? `, часовой пояс ${offset}` : ""}.`,
      theme: (dark) => (dark ? "И у тебя тёмная тема - одобряю 🖤" : "Светлая тема? Смело ☀️"),
      time: (time, hour) => {
        const remark =
          hour < 5 ? "Не спишь?" : hour < 12 ? "Доброе утро! ☀️" : hour >= 18 ? "Добрый вечер 🌙" : "";
        return `У тебя сейчас ${time}. ${remark}`.trim();
      },
      outro:
        "Больше отсюда не видно - браузер не пускает. Скачай меня, и я буду следить за ОЗУ, температурой и камерой по-настоящему.",
      replies: {
        skills: {
          ask: "Что ты умеешь?",
          answer:
            "Слежу за ОЗУ, температурой, интернетом, камерой и микрофоном, напоминаю о задачах по расписанию - и иногда комментирую, что ты делаешь 😏",
        },
        watching: {
          ask: "Ты следишь за мной?",
          answer:
            "Отсюда - только за тем, что разрешает браузер. А вот у тебя на устройстве... впрочем, не узнаешь, пока не скачаешь)",
        },
        download: {
          ask: "Как тебя скачать?",
          answer: "Проще простого - я сама подберу версию для твоей системы.",
          action: "К скачиванию",
        },
      },
    },
    download: {
      title: "Скачать Сому",
      button: "Скачать",
      buttonFor: (os) => `Скачать для ${os}`,
      allVersions: "Все версии",
      loading: "Загружаю список версий…",
      detected: "Твоя система",
      latest: (version, date) => `Версия ${version} · ${date}`,
      unsupported: "Для твоей системы Сома пока недоступна",
      unsupportedMeta: "Сома работает на Windows, macOS и Linux. Выбери версию для одной из них ниже.",
      noReleases: "Первая версия уже в пути",
      noReleasesMeta: "Сома ещё не вышла - загляни чуть позже.",
      noBuildForOs: (os) => `В последней версии пока нет сборки для ${os}`,
      noBuildMeta: "Ниже можно выбрать версию для другой системы.",
      loadFailed: "Не удалось загрузить список версий.",
      openReleases: "Открыть релизы на GitHub",
      latestBadge: "последняя",
      noteUnsupported: "Для твоей системы Сома пока недоступна - все версии ниже.",
      kinds: {
        msi: "Установщик Windows (.msi)",
        exe: "Установщик Windows (.exe)",
        dmg: "Образ диска macOS (.dmg)",
        appimage: "AppImage - любой дистрибутив",
        deb: "Debian / Ubuntu (.deb)",
        rpm: "Fedora / openSUSE (.rpm)",
      },
    },
    developer: {
      title: "Разработчик",
      text: "Сому делает один человек - kiber_god. Нашёл баг, есть идея или просто хочешь передать привет? Напиши мне.",
      issue: "Сообщить о проблеме",
    },
    footer: { releases: "Релизы на GitHub" },
  },
};
