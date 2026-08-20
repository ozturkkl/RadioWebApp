<script lang="ts">
	import { beforeNavigate, goto, onNavigate } from '$app/navigation';
	import { ChevronLeft, Search, Settings, SquareArrowOutUpRight } from 'lucide-svelte';
	import TouchableButton from '$lib/components/utility/TouchableButton.svelte';
	import SearchInput from '$lib/components/utility/SearchInput.svelte';
	import { config } from '$lib/config/config';
	import { getIconComponent } from '$lib/util/getIconComponent';
	import { writable } from 'svelte/store';
	import ExternalLinksModal from '$lib/components/modals/ExternalLinksModal.svelte';
	import { onMount, tick } from 'svelte';
	import { t } from '$lib/i18n';
	import { searchOpen, searchQuery, openSearch, closeSearch } from '$lib/stores/search';

	const showBackButton = writable(false);
	let externalLinksModal: ExternalLinksModal;
	let searchButtonEl: HTMLElement | null = null;
	let wasSearchOpen = false;
	let leftGroupEl: HTMLDivElement | null = null;
	let logoEl: HTMLElement | null = null;
	let titleMeasureEl: HTMLSpanElement | null = null;
	let titleFits = false;
	let scrolled = false;
	let isMobile = false;

	const MOBILE_MQ = '(max-width: 639px)';
	const SCROLL_COMPACT_PX = 24;
	const SCROLL_EXPAND_PX = 8;

	function measureTitleFit() {
		if (!leftGroupEl || !titleMeasureEl) return;
		if (leftGroupEl.clientWidth === 0) return;
		const available = leftGroupEl.clientWidth - (logoEl?.offsetWidth ?? 0);
		titleFits = titleMeasureEl.offsetWidth <= available;
	}

	function syncScrollerState(scroller: HTMLElement) {
		const top = scroller.scrollTop;
		if (top > SCROLL_COMPACT_PX) scrolled = true;
		else if (top < SCROLL_EXPAND_PX) scrolled = false;
	}

	$: searchOpenOnHome = !$showBackButton && $searchOpen;
	$: compactSearch = isMobile && !$showBackButton && scrolled;
	$: showSearchField = searchOpenOnHome || compactSearch;
	$: hideChrome = isMobile && showSearchField;
	$: searchOpenOnHome, $showBackButton, void tick().then(measureTitleFit);

	$: {
		if (wasSearchOpen && !$searchOpen) {
			searchQuery.set('');
			void restoreSearchButtonFocus();
		}
		wasSearchOpen = $searchOpen;
	}

	onMount(() => {
		showBackButton.set(window.location.pathname !== '/');
		const resizeObserver = new ResizeObserver(() => measureTitleFit());
		if (leftGroupEl) resizeObserver.observe(leftGroupEl);
		if (titleMeasureEl) resizeObserver.observe(titleMeasureEl);
		window.addEventListener('resize', measureTitleFit);
		void tick().then(measureTitleFit);

		const mediaQuery = window.matchMedia(MOBILE_MQ);
		const syncMobile = () => {
			isMobile = mediaQuery.matches;
		};
		syncMobile();
		mediaQuery.addEventListener('change', syncMobile);

		const scroller = document.querySelector<HTMLElement>('[data-main-scroller]');
		const onScroll = () => {
			if (scroller) syncScrollerState(scroller);
		};
		scroller?.addEventListener('scroll', onScroll, { passive: true });
		if (scroller) syncScrollerState(scroller);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', measureTitleFit);
			mediaQuery.removeEventListener('change', syncMobile);
			scroller?.removeEventListener('scroll', onScroll);
		};
	});

	beforeNavigate((navigation) => {
		if (
			navigation.type !== 'popstate' &&
			$searchOpen &&
			navigation.from?.url.pathname === '/' &&
			navigation.to?.url.pathname !== '/'
		) {
			closeSearch({ popHistory: false });
		}
	});

	onNavigate((navigation) => {
		showBackButton.set(navigation.to?.url.pathname !== '/');
	});

	async function restoreSearchButtonFocus() {
		await tick();
		if (searchButtonEl?.isConnected) {
			searchButtonEl.focus();
		}
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if (
			event.key === 'Escape' &&
			$searchOpen &&
			!event.defaultPrevented &&
			!event.isComposing &&
			!document.querySelector('dialog[open]')
		) {
			event.preventDefault();
			closeSearch();
		}
	}

	function handleDesktopSearchBlur() {
		if (isMobile) return;
		if ($searchQuery.trim()) return;
		closeSearch();
	}

	function handleDesktopSearchClear() {
		if (isMobile) return;
		closeSearch();
	}
</script>

<svelte:window on:keydown={handleSearchKeydown} />

<div class="flex w-full items-center gap-1 sm:gap-2">
	<div
		bind:this={leftGroupEl}
		class="relative flex min-w-0 flex-1 items-center overflow-hidden {searchOpenOnHome
			? 'max-sm:hidden'
			: ''} {compactSearch ? 'hidden' : ''}"
	>
		<TouchableButton
			bind:el={logoEl}
			onClick={() => ($showBackButton ? window.history.back() : goto('/'))}
			ariaLabel={$t.navbar.goBack}
			circle={false}
			buttonClassName="px-1"
			className="shrink-0"
			size="sm"
		>
			{#if $showBackButton}
				<ChevronLeft class="w-[32px]" />
			{:else}
				<img
					src="/favicon.png"
					alt="Logo"
					class="h-full w-[32px] rounded-full border border-base-content/30"
					draggable="false"
				/>
			{/if}
		</TouchableButton>
		<span
			bind:this={titleMeasureEl}
			class="pointer-events-none invisible absolute whitespace-nowrap text-base font-bold sm:text-xl"
			aria-hidden="true"
		>
			{config.website.title}
		</span>
		{#if titleFits}
			<a href="/" class="whitespace-nowrap pl-0 text-base font-bold text-base-content sm:text-xl">
				{config.website.title}
			</a>
		{/if}
	</div>

	<div
		class="ml-auto flex items-center justify-end {showSearchField
			? 'min-w-0 flex-1'
			: 'shrink-0'}"
	>
		{#if showSearchField}
			<div
				role="search"
				aria-label={$t.home.searchLabel}
				class="flex min-w-0 flex-1 items-center gap-1 {searchOpenOnHome
					? 'sm:flex-none sm:w-72 md:w-80 lg:w-96'
					: ''}"
			>
				{#if searchOpenOnHome}
					<TouchableButton
						onClick={closeSearch}
						ariaLabel={$t.navbar.closeSearch}
						circle={false}
						buttonClassName="px-1"
						className="sm:hidden"
						size="sm"
					>
						<ChevronLeft class="w-[32px]" />
					</TouchableButton>
				{/if}
				<SearchInput
					bind:value={$searchQuery}
					placeholder={$t.home.searchPlaceholder}
					ariaLabel={$t.home.searchLabel}
					clearLabel={$t.home.searchClear}
					focusOnMount={searchOpenOnHome}
					onFocus={openSearch}
					onBlur={handleDesktopSearchBlur}
					onClear={handleDesktopSearchClear}
				/>
			</div>
		{:else if !$showBackButton}
			<TouchableButton
				bind:el={searchButtonEl}
				onClick={openSearch}
				ariaLabel={$t.navbar.search}
				circle={false}
				size="sm"
			>
				<Search class="h-5 w-5 sm:h-6 sm:w-6" />
			</TouchableButton>
		{/if}

		{#if !hideChrome}
			{#each config.website.links as link (link.url)}
				<TouchableButton
					onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
					ariaLabel={link.iconLabel}
					circle={false}
					size="sm"
				>
					<svelte:component this={getIconComponent(link.iconLabel)} class="h-5 w-5 sm:h-6 sm:w-6" />
				</TouchableButton>
			{/each}

			<TouchableButton
				onClick={() => externalLinksModal.open()}
				ariaLabel={$t.navbar.otherLinks}
				circle={false}
				size="sm"
			>
				<SquareArrowOutUpRight class="h-5 w-5 sm:h-6 sm:w-6" />
			</TouchableButton>

			<TouchableButton
				onClick={() => goto('/settings')}
				ariaLabel={$t.settings.title}
				circle={false}
				size="sm"
			>
				<Settings class="h-5 w-5 sm:h-6 sm:w-6" />
			</TouchableButton>
		{/if}
	</div>
</div>

<ExternalLinksModal bind:this={externalLinksModal} />
