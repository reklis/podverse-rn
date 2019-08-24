import AsyncStorage from '@react-native-community/async-storage'
import debounce from 'lodash/debounce'
import { AppState, Linking, Platform, StyleSheet } from 'react-native'
import React from 'reactn'
import { ActivityIndicator, Divider, FlatList, PlayerEvents, PodcastTableCell, SearchBar, SwipeRowBack,
  TableSectionSelectors, View } from '../components'
import { getDownloadedPodcasts } from '../lib/downloadedPodcast'
import { alertIfNoNetworkConnection } from '../lib/network'
import { generateAuthorsText, generateCategoriesText, generateCategoryItems } from '../lib/utility'
import { PV } from '../resources'
import { getCategoryById, getTopLevelCategories } from '../services/category'
import { getEpisode } from '../services/episode'
import { getNowPlayingItemFromQueueOrHistoryByTrackId, PVTrackPlayer } from '../services/player'
import { getPodcast, getPodcasts } from '../services/podcast'
import { getAuthUserInfo } from '../state/actions/auth'
import { initDownloads, removeDownloadedPodcast } from '../state/actions/downloads'
import { initializePlayerQueue, initPlayerState, updatePlaybackState, updatePlayerState } from '../state/actions/player'
import { getSubscribedPodcasts, toggleSubscribeToPodcast } from '../state/actions/podcast'
import { core } from '../styles'

type Props = {
  navigation?: any
}

type State = {
  categoryItems: any[]
  endOfResultsReached: boolean
  flatListData: any[]
  flatListDataTotalCount: number | null
  isLoading: boolean
  isLoadingMore: boolean
  isRefreshing: boolean
  isUnsubscribing: boolean
  queryFrom: string | null
  queryPage: number
  querySort: string | null
  searchBarText: string
  selectedCategory: string | null
  selectedSubCategory: string | null
  subCategoryItems: any[]
}

let isInitialLoad = true

export class PodcastsScreen extends React.Component<Props, State> {

  static navigationOptions = {
    title: 'Podcasts'
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      categoryItems: [],
      endOfResultsReached: false,
      flatListData: [],
      flatListDataTotalCount: null,
      isLoading: true,
      isLoadingMore: false,
      isRefreshing: false,
      isUnsubscribing: false,
      queryFrom: _subscribedKey,
      queryPage: 1,
      querySort: _alphabeticalKey,
      searchBarText: '',
      selectedCategory: null,
      selectedSubCategory: null,
      subCategoryItems: []
    }

    this._handleSearchBarTextQuery = debounce(this._handleSearchBarTextQuery, PV.SearchBar.textInputDebounceTime)
  }

  async componentDidMount() {
    const { flatListData } = this.state

    if (Platform.OS === 'android') {
      Linking.getInitialURL().then((url) => {
        if (url) this._handleOpenURL(url)
      })
    } else {
      Linking.addEventListener('url', this._handleOpenURLEvent)
    }

    AppState.addEventListener('change', this._handleAppStateChange)

    try {
      const appHasLaunched = await AsyncStorage.getItem(PV.Keys.APP_HAS_LAUNCHED)
      if (!appHasLaunched) {
        await AsyncStorage.setItem(PV.Keys.APP_HAS_LAUNCHED, 'true')
        await AsyncStorage.setItem(PV.Keys.DOWNLOADING_WIFI_ONLY, 'TRUE')
        await AsyncStorage.setItem(PV.Keys.STREAMING_WIFI_ONLY, 'TRUE')
        await AsyncStorage.setItem(PV.Keys.AUTO_DELETE_EPISODE_ON_END, 'TRUE')
        await AsyncStorage.setItem(PV.Keys.PLAYER_MAXIMUM_SPEED, '2.5')
        // navigation.navigate(PV.RouteNames.Onboarding)
      } else {
        await this._initializeScreenData()
      }
    } catch (error) {
      if (error.name === PV.Errors.FREE_TRIAL_EXPIRED.name || error.name === PV.Errors.PREMIUM_MEMBERSHIP_EXPIRED.name) {
        // Since the expired user was logged out after the alert in getAuthUserInfo,
        // we initialiize the screen data again, this time as a local/logged-out user.
        await this._initializeScreenData()
      }
      console.log(error)
    }

    this.setState({
      flatListData,
      flatListDataTotalCount: null,
      isLoading: false
    })
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange)
    Linking.removeEventListener('url', this._handleOpenURLEvent)
  }

  _handleAppStateChange = async (nextAppState: any) => {
    if (nextAppState === 'active' && !isInitialLoad) {
      const { nowPlayingItem: lastItem } = this.global.player
      const trackId = await PVTrackPlayer.getCurrentTrack()
      const currentItem = await getNowPlayingItemFromQueueOrHistoryByTrackId(trackId)

      if ((!lastItem) || (lastItem && currentItem.episodeId !== lastItem.episodeId)) {
        await updatePlayerState(currentItem)
      }
      await updatePlaybackState()
    } else {
      isInitialLoad = false
    }
  }

  _handleOpenURLEvent = (event: any) => {
    if (event) this._handleOpenURL(event.url)
  }

  _handleOpenURL = async (url: string) => {
    const { navigate } = this.props.navigation

    try {
      if (url) {
        const route = url.replace(/.*?:\/\//g, '')
        const splitPath = route.split('/')
        const path = splitPath[1] ? splitPath[1] : ''
        const id = splitPath[2] ? splitPath[2] : ''

        if (path === PV.DeepLinks.Clip.pathPrefix) {
          await navigate(PV.RouteNames.PodcastsScreen)
          await navigate(PV.RouteNames.PlayerScreen, { mediaRefId: id })
        } else if (path === PV.DeepLinks.Episode.pathPrefix) {
          await navigate(PV.RouteNames.PodcastsScreen)
          const episode = await getEpisode(id)
          if (episode) {
            const podcast = await getPodcast(episode.podcast.id)
            await navigate(PV.RouteNames.PodcastScreen, { podcast, navToEpisodeWithId: id })
          }
        } else if (path === PV.DeepLinks.Playlist.pathPrefix) {
          await navigate(PV.RouteNames.MoreScreen)
          await navigate(PV.RouteNames.PlaylistsScreen, { navToPlaylistWithId: id })
        } else if (path === PV.DeepLinks.Playlists.path) {
          await navigate(PV.RouteNames.MoreScreen)
          await navigate(PV.RouteNames.PlaylistsScreen)
        } else if (path === PV.DeepLinks.Podcast.pathPrefix) {
          await navigate(PV.RouteNames.PodcastsScreen)
          await navigate(PV.RouteNames.PodcastScreen, { podcastId: id })
        } else if (path === PV.DeepLinks.Podcasts.path) {
          await navigate(PV.RouteNames.PodcastsScreen)
        } else if (path === PV.DeepLinks.Profile.pathPrefix) {
          await navigate(PV.RouteNames.MoreScreen)
          await navigate(PV.RouteNames.ProfilesScreen, { navToProfileWithId: id })
        } else if (path === PV.DeepLinks.Profiles.path) {
          await navigate(PV.RouteNames.MoreScreen)
          await navigate(PV.RouteNames.ProfilesScreen)
        } else if (path === PV.DeepLinks.Search.path) {
          await navigate(PV.RouteNames.SearchScreen)
        } else {
          await navigate(PV.RouteNames.PodcastsScreen)
        }
      }
    } catch (error) {
      //
    }
  }

  _initializeScreenData = async () => {
    await initPlayerState(this.global)
    await getAuthUserInfo()
    const { userInfo } = this.global.session
    await getSubscribedPodcasts(userInfo.subscribedPodcastIds || [])
    await initDownloads()
    await initializePlayerQueue()
  }

  selectLeftItem = async (selectedKey: string) => {
    if (!selectedKey) {
      this.setState({ queryFrom: null })
      return
    }

    this.setState({
      endOfResultsReached: false,
      flatListData: [],
      flatListDataTotalCount: null,
      isLoading: true,
      queryFrom: selectedKey,
      queryPage: 1
    }, async () => {
      const newState = await this._queryData(selectedKey, this.state)
      this.setState(newState)
    })
  }

  selectRightItem = async (selectedKey: string) => {
    if (!selectedKey) {
      this.setState({ querySort: null })
      return
    }

    this.setState({
      endOfResultsReached: false,
      flatListData: [],
      flatListDataTotalCount: null,
      isLoading: true,
      queryPage: 1,
      querySort: selectedKey
    }, async () => {
      const newState = await this._queryData(selectedKey, this.state)

      this.setState(newState)
    })
  }

  _selectCategory = async (selectedKey: string, isSubCategory?: boolean) => {
    if (!selectedKey) {
      this.setState({
        ...(isSubCategory ? { selectedSubCategory: null } : { selectedCategory: null }) as any
      })
      return
    }

    this.setState({
      endOfResultsReached: false,
      isLoading: true,
      ...(isSubCategory ? { selectedSubCategory: selectedKey } : { selectedCategory: selectedKey }) as any,
      ...(!isSubCategory ? { subCategoryItems: [] } : {}),
      flatListData: [],
      flatListDataTotalCount: null
    }, async () => {
      const newState = await this._queryData(selectedKey, this.state, {}, { isSubCategory })
      this.setState(newState)
    })
  }

  _onEndReached = ({ distanceFromEnd }) => {
    const { endOfResultsReached, isLoadingMore, queryFrom, queryPage = 1 } = this.state
    if (queryFrom !== _subscribedKey && !endOfResultsReached && !isLoadingMore) {
      if (distanceFromEnd > -1) {
        this.setState({
          isLoadingMore: true
        }, async () => {
          const nextPage = queryPage + 1
          const newState = await this._queryData(queryFrom, this.state, {
            queryPage: nextPage,
            searchAllFieldsText: this.state.searchBarText
          })
          this.setState(newState)
        })
      }
    }
  }

  _onRefresh = () => {
    const { queryFrom } = this.state

    this.setState({
      isRefreshing: true
    }, async () => {
      const newState = await this._queryData(queryFrom, this.state, { queryPage: 1 })
      this.setState(newState)
    })
  }

  _ListHeaderComponent = () => {
    const { searchBarText } = this.state

    return (
      <View style={styles.ListHeaderComponent}>
        <SearchBar
          containerStyle={styles.ListHeaderComponent}
          inputContainerStyle={core.searchBar}
          onChangeText={this._handleSearchBarTextChange}
          onClear={this._handleSearchBarClear}
          value={searchBarText} />
      </View>
    )
  }

  _ItemSeparatorComponent = () => {
    return <Divider />
  }

  _renderPodcastItem = ({ item }) => {
    const { downloadedPodcastEpisodeCounts } = this.global
    const userLocalPodcastView = this.state.queryFrom === _subscribedKey || this.state.queryFrom === _downloadedKey
    const episodeCount = downloadedPodcastEpisodeCounts[item.id]

    return (
      <PodcastTableCell
        id={item.id}
        lastEpisodePubDate={item.lastEpisodePubDate}
        onPress={() => this.props.navigation.navigate(
          PV.RouteNames.PodcastScreen, {
            podcast: item,
            episodeCount
          }
        )}
        podcastAuthors={userLocalPodcastView ? '' : generateAuthorsText(item.authors)}
        podcastCategories={userLocalPodcastView ? '' : generateCategoriesText(item.categories)}
        podcastImageUrl={item.imageUrl}
        podcastTitle={item.title}
        showAutoDownload={userLocalPodcastView}
        showDownloadCount={userLocalPodcastView} />
    )
  }

  _renderHiddenItem = ({ item }, rowMap) => (
    <SwipeRowBack
      isLoading={this.state.isUnsubscribing}
      onPress={() => this._handleHiddenItemPress(item.id, rowMap)} />
  )

  _handleHiddenItemPress = async (selectedId, rowMap) => {
    const { queryFrom } = this.state

    let wasAlerted = false
    if (queryFrom === _subscribedKey) {
      wasAlerted = await alertIfNoNetworkConnection('unsubscribe from podcast')
    }

    if (wasAlerted) return
    this.setState({ isUnsubscribing: true }, async () => {
      try {
        const { flatListData } = this.state

        if (queryFrom === _subscribedKey) {
          await toggleSubscribeToPodcast(selectedId)
        } else if (queryFrom === _downloadedKey) {
          await removeDownloadedPodcast(selectedId)
        }
        const newFlatListData = flatListData.filter((x) => x.id !== selectedId)
        rowMap[selectedId].closeRow()
        this.setState({
          flatListData: newFlatListData,
          flatListDataTotalCount: newFlatListData.length,
          isUnsubscribing: false
        })
      } catch (error) {
        this.setState({ isUnsubscribing: false })
      }
    })
  }

  _handleSearchBarClear = (text: string) => {
    this.setState({
      flatListData: [],
      flatListDataTotalCount: null,
      searchBarText: ''
    })
  }

  _handleSearchBarTextChange = (text: string) => {
    const { queryFrom } = this.state

    this.setState({
      isLoadingMore: true,
      searchBarText: text
    }, async () => {
      this._handleSearchBarTextQuery(queryFrom, this.state, {}, { searchTitle: text })
    })
  }

  _handleSearchBarTextQuery = async (queryFrom: string | null, prevState: any, newState: any, queryOptions: any) => {
    this.setState({
      flatListData: [],
      flatListDataTotalCount: null,
      queryPage: 1
    }, async () => {
      const state = await this._queryData(queryFrom, prevState, newState, { searchTitle: queryOptions.searchTitle })
      this.setState(state)
    })
  }

  _handleSearchNavigation = () => {
    this.props.navigation.navigate(PV.RouteNames.SearchScreen)
  }

  render() {
    const { categoryItems, queryFrom, isLoading, isLoadingMore, isRefreshing, querySort,
      selectedCategory, selectedSubCategory, subCategoryItems } = this.state

    let flatListData = []
    let flatListDataTotalCount = null
    if (queryFrom === _subscribedKey) {
      flatListData = this.global.subscribedPodcasts
      flatListDataTotalCount = this.global.subscribedPodcastsTotalCount
    } else if (queryFrom === _downloadedKey) {
      flatListData = this.global.downloadedPodcasts
      flatListDataTotalCount = this.global.downloadedPodcasts.length
    } else {
      flatListData = this.state.flatListData
      flatListDataTotalCount = this.state.flatListDataTotalCount
    }

    return (
      <View style={styles.view}>
        <PlayerEvents />
        <TableSectionSelectors
          handleSelectLeftItem={this.selectLeftItem}
          handleSelectRightItem={this.selectRightItem}
          leftItems={leftItems}
          rightItems={!queryFrom || queryFrom === _subscribedKey || queryFrom === _downloadedKey ? [] : rightItems}
          selectedLeftItemKey={queryFrom}
          selectedRightItemKey={querySort} />
        {
          queryFrom === _categoryKey && categoryItems &&
            <TableSectionSelectors
              handleSelectLeftItem={(x: string) => this._selectCategory(x)}
              handleSelectRightItem={(x: string) => this._selectCategory(x, true)}
              leftItems={categoryItems}
              placeholderLeft={{ label: 'All', value: _allCategoriesKey }}
              placeholderRight={{ label: 'All', value: _allCategoriesKey }}
              rightItems={subCategoryItems}
              selectedLeftItemKey={selectedCategory}
              selectedRightItemKey={selectedSubCategory} />
        }
        {
          isLoading &&
            <ActivityIndicator />
        }
        {
          !isLoading && queryFrom &&
            <FlatList
              data={flatListData}
              dataTotalCount={flatListDataTotalCount}
              disableLeftSwipe={queryFrom !== _subscribedKey && queryFrom !== _downloadedKey}
              extraData={flatListData}
              handleSearchNavigation={this._handleSearchNavigation}
              isLoadingMore={isLoadingMore}
              isRefreshing={isRefreshing}
              ItemSeparatorComponent={this._ItemSeparatorComponent}
              {...(queryFrom !== _subscribedKey && queryFrom !== _downloadedKey ? { ListHeaderComponent: this._ListHeaderComponent } : {})}
              noSubscribedPodcasts={queryFrom === _subscribedKey && (!flatListData || flatListData.length === 0)}
              onEndReached={this._onEndReached}
              onRefresh={queryFrom === _subscribedKey ? this._onRefresh : null}
              renderHiddenItem={this._renderHiddenItem}
              renderItem={this._renderPodcastItem}
              resultsText='podcasts' />
        }
      </View>
    )
  }

  _querySubscribedPodcasts = async () => {
    const { session } = this.global
    const { userInfo } = session
    await getSubscribedPodcasts(userInfo.subscribedPodcastIds || [])
  }

  _queryAllPodcasts = async (sort: string | null, page: number = 1) => {
    const { searchBarText: searchTitle } = this.state
    const results = await getPodcasts({
      sort,
      page,
      includeAuthors: true,
      includeCategories: true,
      ...(searchTitle ? { searchTitle } : {}) }, this.global.settings.nsfwMode)
    return results
  }

  _queryPodcastsByCategory = async (categoryId: string | null, sort: string | null, page: number = 1) => {
    const { searchBarText: searchTitle } = this.state
    const results = await getPodcasts({
      categories: categoryId, sort, page,
      includeAuthors: true,
      ...(searchTitle ? { searchTitle } : {})
    }, this.global.settings.nsfwMode)
    return results
  }

  _queryData = async (
    filterKey: string | null, prevState: State, nextState?: {},
    queryOptions: { isSubCategory?: boolean, searchTitle?: string } = {}) => {
    const newState = {
      isLoading: false,
      isLoadingMore: false,
      isRefreshing: false,
      ...nextState
    } as State

    const wasAlerted = await alertIfNoNetworkConnection('load podcasts')
    if (wasAlerted) return newState

    try {
      const { searchBarText: searchTitle, flatListData = [], querySort, selectedCategory,
        selectedSubCategory } = prevState
      const { settings } = this.global
      const { nsfwMode } = settings
      if (filterKey === _subscribedKey) {
        await getAuthUserInfo() // get the latest subscribedPodcastIds first
        await this._querySubscribedPodcasts()
      } else if (filterKey === _downloadedKey) {
        const podcasts = await getDownloadedPodcasts()
        newState.endOfResultsReached = true
        newState.flatListDataTotalCount = podcasts.length
      } else if (filterKey === _allPodcastsKey) {
        const results = await this._queryAllPodcasts(querySort, newState.queryPage)
        newState.flatListData = [...flatListData, ...results[0]]
        newState.endOfResultsReached = newState.flatListData.length >= results[1]
        newState.flatListDataTotalCount = results[1]
      } else if (filterKey === _categoryKey) {
        const { querySort, selectedCategory, selectedSubCategory } = prevState
        if (selectedCategory && selectedSubCategory === _allCategoriesKey) {
          const results = await this._queryPodcastsByCategory(selectedCategory, querySort, newState.queryPage)
          newState.flatListData = [...flatListData, ...results[0]]
          newState.endOfResultsReached = newState.flatListData.length >= results[1]
          newState.flatListDataTotalCount = results[1]
        } else if (selectedSubCategory) {
          const results = await this._queryPodcastsByCategory(selectedSubCategory, querySort, newState.queryPage)
          newState.flatListData = [...flatListData, ...results[0]]
          newState.endOfResultsReached = newState.flatListData.length >= results[1]
          newState.flatListDataTotalCount = results[1]
          newState.selectedSubCategory = selectedSubCategory || _allCategoriesKey
        } else {
          const categoryResults = await getTopLevelCategories()
          const podcastResults = await this._queryAllPodcasts(querySort, newState.queryPage)
          newState.categoryItems = generateCategoryItems(categoryResults[0])
          newState.flatListData = [...flatListData, ...podcastResults[0]]
          newState.endOfResultsReached = newState.flatListData.length >= podcastResults[1]
          newState.flatListDataTotalCount = podcastResults[1]
        }
      } else if (rightItems.some((option) => option.value === filterKey)) {
        const results = await getPodcasts({
          ...((selectedSubCategory && selectedSubCategory !== _allCategoriesKey)
            || selectedCategory ? { categories: (selectedSubCategory && selectedSubCategory !== _allCategoriesKey) || selectedCategory }
            : {}) as object,
          sort: filterKey, ...(searchTitle ? { searchTitle } : {})
        }, nsfwMode)
        newState.flatListData = results[0]
        newState.endOfResultsReached = newState.flatListData.length >= results[1]
        newState.flatListDataTotalCount = results[1]
      } else {
        const { isSubCategory } = queryOptions
        let categories
        if (isSubCategory) {
          categories = filterKey === _allCategoriesKey ? selectedCategory : filterKey
        } else if (filterKey === _allCategoriesKey) {
          newState.selectedCategory = _allCategoriesKey
        } else {
          categories = filterKey
          const category = await getCategoryById(filterKey || '')
          newState.subCategoryItems = generateCategoryItems(category.categories)
          newState.selectedSubCategory = _allCategoriesKey
          newState.selectedCategory = filterKey
        }

        const results = await getPodcasts({
          categories,
          sort: querySort,
          includeAuthors: true,
          ...(searchTitle ? { searchTitle } : {}) }, nsfwMode)
        newState.flatListData = results[0]
        newState.endOfResultsReached = newState.flatListData.length >= results[1]
        newState.flatListDataTotalCount = results[1]
      }

      return newState
    } catch (error) {
      return newState
    }
  }
}

const _subscribedKey = 'subscribed'
const _downloadedKey = 'downloaded'
const _allPodcastsKey = 'allPodcasts'
const _categoryKey = 'category'
const _allCategoriesKey = 'allCategories'
const _alphabeticalKey = 'alphabetical'
const _mostRecentKey = 'most-recent'
const _topPastDay = 'top-past-day'
const _topPastWeek = 'top-past-week'
const _topPastMonth = 'top-past-month'
const _topPastYear = 'top-past-year'

const leftItems = [
  {
    label: 'Subscribed',
    value: _subscribedKey
  },
  {
    label: 'Downloaded',
    value: _downloadedKey
  },
  {
    label: 'All Podcasts',
    value: _allPodcastsKey
  },
  {
    label: 'Category',
    value: _categoryKey
  }
]

const rightItems = [
  {
    label: 'alphabetical',
    value: _alphabeticalKey
  },
  {
    label: 'most recent',
    value: _mostRecentKey
  },
  {
    label: 'top - past day',
    value: _topPastDay
  },
  {
    label: 'top - past week',
    value: _topPastWeek
  },
  {
    label: 'top - past month',
    value: _topPastMonth
  },
  {
    label: 'top - past year',
    value: _topPastYear
  }
]

const styles = StyleSheet.create({
  ListHeaderComponent: {
    borderBottomWidth: 0,
    borderTopWidth: 0,
    flex: 0,
    height: PV.FlatList.searchBar.height,
    justifyContent: 'center'
  },
  view: {
    flex: 1
  }
})
