import { Alert, Linking, StyleSheet } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import React from 'reactn'
import { translate } from '../lib/i18n'
import { readableClipTime } from '../lib/utility'
import { PV } from '../resources'
import { loadChapterPlaybackInfo } from '../state/actions/playerChapters'
import { ActivityIndicator, FastImage, Text, View } from './'

type Props = {
  handlePressClipInfo: any
  imageHeight: number
  imageWidth: number
  navigation?: any
  width: number
}

type State = {
  reduceBottomWrapperHeight?: boolean
}
export class MediaPlayerCarouselViewer extends React.PureComponent<Props, State> {
  chapterInterval: NodeJS.Timeout
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    loadChapterPlaybackInfo()
    this.chapterInterval = setInterval(loadChapterPlaybackInfo, 4000)
  }

  componentWillUnmount() {
    clearInterval(this.chapterInterval)
  }

  handleChapterLinkPress = (url: string) => {
    Alert.alert(PV.Alerts.LEAVING_APP.title, PV.Alerts.LEAVING_APP.message, [
      { text: translate('Cancel') },
      { text: translate('Yes'), onPress: () => Linking.openURL(url) }
    ])
  }

  render() {
    const { handlePressClipInfo, imageHeight, imageWidth, width } = this.props
    const { fontScaleMode, player, screenPlayer } = this.global
    const { reduceBottomWrapperHeight } = this.state
    const { currentChapter, nowPlayingItem = {} } = player
    const { isLoading } = screenPlayer
    let { clipId, clipEndTime, clipStartTime, clipTitle, podcastImageUrl } = nowPlayingItem
    let clipUrl = ''

    // If a clip is currently playing, then load the clip info.
    // Else if a chapter is currently playing, then override with the chapter info.
    if (currentChapter && !clipId) {
      clipId = currentChapter.id
      clipEndTime = currentChapter.endTime
      clipUrl = currentChapter.linkUrl
      clipStartTime = currentChapter.startTime
      clipTitle = currentChapter.title
      podcastImageUrl = currentChapter.imageUrl || podcastImageUrl
    }

    const imageStyle = [{ height: imageHeight, width: imageWidth }] as any
    if (clipUrl) {
      imageStyle.push(styles.imageBorder)
    }

    const imageWrapperStylePadding = clipId ? { padding: 16 } : { paddingHorizontal: 16, paddingTop: 16 }
    const reduceBottomWrapperStyle = reduceBottomWrapperHeight
      ? { height: PV.Player.carouselTextBottomWrapper.height - 24 }
      : { height: PV.Player.carouselTextBottomWrapper.height }

    const clipInfoNumberOfLines = [PV.Fonts.fontScale.larger, PV.Fonts.fontScale.largest].includes(fontScaleMode)
      ? 1
      : 2

    return (
      <View style={[styles.outerWrapper, { width }]} transparent={true}>
        <View style={styles.innerWrapper} transparent={true}>
          <View style={styles.carouselTextTopWrapper} transparent={true}>
            {isLoading && <ActivityIndicator fillSpace={true} />}
            {!isLoading && !!nowPlayingItem && (
              <React.Fragment>
                <Text
                  fontSizeLargestScale={PV.Fonts.largeSizes.xl}
                  numberOfLines={1}
                  style={styles.episodeTitle}
                  testID='media_player_carousel_viewer_episode_title'>
                  {nowPlayingItem.episodeTitle}
                </Text>
                {fontScaleMode !== PV.Fonts.fontScale.largest && (
                  <Text
                    fontSizeLargestScale={PV.Fonts.largeSizes.md}
                    isSecondary={true}
                    numberOfLines={1}
                    style={styles.podcastTitle}
                    testID='media_player_carousel_viewer_podcast_title'>
                    {nowPlayingItem.podcastTitle}
                  </Text>
                )}
              </React.Fragment>
            )}
          </View>
          <View
            style={[styles.imageWrapper, { height: imageHeight, width: '100%' }, imageWrapperStylePadding]}
            transparent={true}>
            <TouchableWithoutFeedback {...(clipUrl ? { onPress: () => this.handleChapterLinkPress(clipUrl) } : {})}>
              <FastImage key={podcastImageUrl} source={podcastImageUrl} styles={imageStyle} />
            </TouchableWithoutFeedback>
          </View>
          {clipId && (
            <TouchableWithoutFeedback onPress={handlePressClipInfo}>
              <View style={[styles.carouselTextBottomWrapper, reduceBottomWrapperStyle]} transparent={true}>
                <View style={styles.clipWrapper} transparent={true}>
                  <Text
                    numberOfLines={clipInfoNumberOfLines}
                    onTextLayout={(e) => {
                      const { lines } = e.nativeEvent
                      if (
                        lines.length === 1 ||
                        [PV.Fonts.fontScale.larger, PV.Fonts.fontScale.largest].includes(fontScaleMode)
                      ) {
                        this.setState({ reduceBottomWrapperHeight: true })
                      } else {
                        this.setState({ reduceBottomWrapperHeight: false })
                      }
                    }}
                    style={styles.clipTitle}
                    testID='media_player_carousel_viewer_title'>{`${clipTitle}`}</Text>
                  {fontScaleMode !== PV.Fonts.fontScale.largest && (
                    <Text style={styles.clipTime} testID='media_player_carousel_viewer_time'>
                      {readableClipTime(clipStartTime, clipEndTime)}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  carouselTextBottomWrapper: {
    flex: 0
  },
  carouselTextTopWrapper: {
    flex: 0,
    minHeight: PV.Player.carouselTextTopWrapper.height,
    justifyContent: 'center'
  },
  clipTime: {
    color: PV.Colors.skyLight,
    fontSize: PV.Fonts.sizes.sm,
    minHeight: PV.Player.carouselTextSubBottomWrapper.height,
    marginTop: PV.Player.carouselTextSubBottomWrapper.marginTop,
    textAlign: 'center'
  },
  clipTitle: {
    fontSize: PV.Fonts.sizes.xxl,
    paddingBottom: 2,
    textAlign: 'center'
  },
  clipWrapper: {},
  episodeTitle: {
    fontSize: PV.Fonts.sizes.xxl,
    textAlign: 'center'
  },
  imageBorder: {
    borderColor: PV.Colors.skyDark,
    borderWidth: 5
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10
  },
  innerWrapper: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 8
  },
  outerWrapper: {
    flex: 0
  },
  podcastTitle: {
    color: PV.Colors.skyDark,
    flex: 0,
    fontSize: PV.Fonts.sizes.md,
    fontWeight: PV.Fonts.weights.bold,
    marginTop: 2,
    textAlign: 'center'
  }
})