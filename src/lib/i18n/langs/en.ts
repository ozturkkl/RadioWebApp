export const en = {
	settings: {
		title: 'Settings',
		theme: 'Theme',
		chooseTheme: 'Choose your preferred theme',
		language: 'Language',
		chooseLanguage: 'Choose your preferred language',
		autoplay: 'Autoplay',
		autoplayDescription: 'Automatically play next episode',
		resumeLastContent: 'Resume Last Content',
		resumeLastContentDescription:
			'Automatically play your last played radio or podcast when opening the app',
		autoClosePodcasts: 'Auto-close Podcasts',
		autoClosePodcastsDescription: 'Automatically close other podcasts when expanding one',
		skipDuration: 'Skip Duration',
		skipDurationDescription: 'Amount of seconds to skip when using the skip buttons',
		install: 'Install',
		installApp: 'Install App',
		installAppDescription: 'Install this app on your device',
		alreadyInstalled: 'Already Installed',
		seconds: 'seconds'
	},
	home: {
		favorites: 'Favorites',
		radio: 'Radio',
		archive: 'Archive',
		allStationsInFavorites: 'All stations are in favorites',
		allArchiveInFavorites: 'All of this archive is in favorites',
		scrollForMoreEpisodes: 'Scroll for more episodes',
		allCategories: 'All'
	},
	player: {
		skipBackward: 'Skip backward',
		skipForward: 'Skip forward',
		play: 'Play',
		pause: 'Pause',
		nextTrack: 'Next track',
		previousTrack: 'Previous track',
		refreshRadio: 'Refresh radio stream',
		playbackSpeed: 'Playback speed',
		volumeControl: 'Volume control',
		goToPodcast: 'Go to podcast',
		goToRadio: 'Go to radio',
		share: 'Share',
		shareRadio: 'Share Radio',
		sharePodcast: 'Share Podcast',
		shareFromStart: 'Share from start',
		shareFromCurrentTime: 'Share from current time',
		linkCopied: 'Link copied to clipboard',
		linkCopyFailed: 'Failed to copy link to clipboard'
	},
	podcast: {
		showMoreInfo: 'Show more information',
		showNewestFirst: 'Show newest first',
		showOldestFirst: 'Show oldest first',
		episodes: 'Episodes',
		refreshed: 'Refreshed',
		justNow: 'just now',
		timeAgo: 'ago',
		overallProgress: 'Overall Progress',
		currentEpisode: 'Current Episode',
		timeUnits: {
			days: 'd',
			hours: 'h',
			minutes: 'm'
		}
	},
	continueListening: {
		scrollLeft: 'Scroll left',
		scrollRight: 'Scroll right'
	},
	navbar: {
		goBack: 'Go back',
		otherLinks: 'Other Links'
	},
	modals: {
		externalLinks: 'Other Resources'
	},
	installModal: {
		// Titles
		installOnIOS: 'Install on iOS',
		installOnAndroid: 'Install on Android',

		// Common elements
		step1: 'Step 1',
		step2: 'Step 2',
		step3: 'Step 3',

		// iOS specific
		ios: {
			shareButton: 'Tap the Share button in Safari or Chrome',
			shareButtonNote: '(square with arrow pointing up)',
			addToHomeScreen: 'Scroll down in the share menu and tap "Add to Home Screen"',
			finishInstall: 'You can edit the name if you want, then tap "Add" in the top right corner'
		},

		// Firefox specific
		firefox: {
			limitation: 'Firefox Limitation',
			noSupport:
				'Unfortunately, Firefox does not support installing websites as Progressive Web Apps (PWAs).',
			useAlternative:
				'To install this app on your device, please use one of these browsers instead:'
		},

		// Browser options
		browsers: {
			chrome: 'Chrome (recommended for Android)',
			edge: 'Edge',
			safari: 'Safari (iOS only)',
			samsung: 'Samsung Internet'
		},

		// Generic instructions
		generic: {
			menuButton: 'Tap the menu button in {browser}',
			menuPosition: '{position}',
			chromeInstall: 'Tap "Cast, save, and share" and "Install page as app..."',
			edgeInstall: 'Tap "Apps" and then "install this site as an app"',
			defaultInstall: 'Look for "Install app" or "Add to Home screen"',
			tapInstall: 'Tap "Install" or "Add" in the prompt that appears'
		},

		// Notes and tips
		notes: {
			important: 'Important',
			appOnHomeScreen:
				'Note: This app will now appear on your home screen and will run in full-screen mode without the browser interface.',
			safariChromeOnly:
				"This feature only works in Safari and Chrome. If you're using a different browser on iOS, please open this site in Safari or Chrome first.",
			mostBrowsersSupport: 'Tip: Most modern browsers except Firefox support installing PWAs.',
			tryChrome: "Tip: If you don't see the install option, try using Chrome."
		},

		// Menu positions
		menuPositions: {
			chromeEdge: 'three dots in the top right',
			default: 'usually three dots or lines in the corner'
		}
	},
	auth: {
		googleAccount: 'Google Account',
		syncData: 'Sync data with Google',
		signedInAs: 'Signed in as',
		signInToSync: 'Sign in to sync your progress across devices',
		changeUser: 'Change User',
		signOut: 'Sign out',
		signInWithGoogle: 'Sign in with Google',
		processing: 'Processing...'
	}
};
