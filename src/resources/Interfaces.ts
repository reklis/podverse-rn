export interface GlobalTheme {
  actionSheetButton?: any
  actionSheetButtonCancel?: any
  actionSheetButtonDisabled?: any
  actionSheetButtonText?: any
  actionSheetButtonTextCancel?: any
  actionSheetButtonTextDisabled?: any
  actionSheetButtonUnderlay?: any
  actionSheetButtonCancelUnderlay?: any
  actionSheetHeaderText?: any
  actionSheetView?: any
  activityIndicator?: any
  activityIndicatorAlternate?: any
  buttonGroupText?: any
  buttonGroupTextSelected?: any
  buttonImage?: any
  buttonPrimaryText?: any
  buttonPrimaryTextDisabled?: any
  buttonPrimaryWrapper?: any
  buttonPrimaryWrapperDisabled?: any
  divider?: any
  flatList?: any
  inputContainerText?: any
  link?: any
  makeClipPlayerControlsWrapper?: any
  membershipTextExpired?: any
  membershipTextExpiring?: any
  membershipTextPremium?: any
  modalBackdrop?: any
  modalInnerWrapper?: any
  placeholderText?: any
  player?: any
  playerClipTimeFlag?: any
  playerText?: any
  selectorText?: any
  swipeRowBack?: any
  tabbar?: any
  tabbarItem?: any
  tableCellTextPrimary?: any
  tableCellTextSecondary?: any
  tableSectionHeader?: any
  tableSectionHeaderIcon?: any
  tableSectionHeaderText?: any
  text?: any
  textInput?: any
  textInputIcon?: any
  textInputWrapper?: any
  view?: any
}

export interface UserInfo {
  email?: string,
  freeTrialExpiration?: string,
  historyItems?: [],
  id?: string,
  membershipExpiration?: string | null,
  name?: string,
  playlists?: [],
  queueItems?: [],
  subscribedPlaylistIds?: [],
  subscribedPodcastIds?: [],
  subscribedUserIds?: []
}

export interface InitialState {
  globalTheme: GlobalTheme
  autoDownloadSettings: any
  downloadsActive: any
  downloadsArray: any[]
  downloadedEpisodeIds: any
  downloadedPodcastEpisodeCounts: any
  player: {
    isPlaying: boolean
    nowPlayingItem: any
    playbackRate: number
    showMakeClip: boolean
    showMiniPlayer: boolean
  }
  playlists: {
    myPlaylists: []
    subscribedPlaylists: []
  }
  profile: {
    flatListData: []
    user: any
  }
  profiles: {
    flatListData: []
    flatListDataTotalCount: null
  }
  screenPlayer: {
    endOfResultsReached: boolean
    flatListData: any[]
    flatListDataTotalCount: number | null
    isLoading: boolean
    isLoadingMore: boolean
    queryFrom: string | null
    queryPage: number
    querySort: string | null
    selectedItem?: any
    showFullClipInfo: boolean
    showHeaderActionSheet: boolean
    showMoreActionSheet: boolean
    showShareActionSheet: boolean
    viewType: string | null
  }
  screenPlaylist: {
    flatListData: []
    flatListDataTotalCount: number | null
    playlist?: any
  }
  session: {
    isLoggedIn: boolean
    userInfo: UserInfo
  }
  subscribedPodcasts: []
  subscribedPodcastsTotalCount: number
}

export interface IActionSheet {
  media: {
    moreButtons: any
  }
}

export interface IFilters {
  downloadedKey: string
  allEpisodesKey: string
  clipsKey: string
  aboutKey: string
  mostRecentKey: string
  mostRecentAllKey: string
  oldestKey: string
  topPastDay: string
  topPastWeek: string
  topPastMonth: string
  topPastYear: string
}

interface IFontSizes {
  [size: string]: number
}

interface IFontWeights {
  [weight: string]: string
}

export interface IFonts {
  sizes: IFontSizes,
  weights: IFontWeights
}
