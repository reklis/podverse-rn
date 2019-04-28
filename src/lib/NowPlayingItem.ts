export type NowPlayingItem = {
  clipEndTime?: number
  clipId?: string
  clipStartTime?: number
  clipTitle?: string
  episodeDescription?: string
  episodeId?: string
  episodeImageUrl?: string
  episodeMediaUrl?: string
  episodePubDate?: string
  episodeTitle?: string
  isPublic?: boolean
  podcastId?: string
  podcastImageUrl?: string
  podcastIsExplicit?: boolean
  podcastTitle?: string
  userPlaybackPosition?: number
}

export const convertToNowPlayingItem = (data, inheritedEpisode, inheritedPodcast, userPlaybackPosition = 0) => {
  let nowPlayingItem: NowPlayingItem = {}

  if (!data) { return {} }
  const e = (data.pubDate && data) || data.episode || inheritedEpisode
  const p = (data.episode && data.episode.podcast) || data.podcast || inheritedPodcast

  // If it has a podcast_id field, assume it is an Episode list item
  if (data.podcast_id) {
    nowPlayingItem.episodeDescription = data.description
    nowPlayingItem.episodeId = data.id
    nowPlayingItem.episodeMediaUrl = data.mediaUrl
    nowPlayingItem.episodePubDate = data.pubDate
    nowPlayingItem.episodeTitle = data.title
    nowPlayingItem.podcastId = data.podcast_id
    nowPlayingItem.podcastImageUrl = data.podcast_imageUrl
    nowPlayingItem.podcastTitle = data.podcast_title
    nowPlayingItem.userPlaybackPosition = userPlaybackPosition || 0
    // If it has a pubDate field, assume it is an Episode
  } else if (data.pubDate) {
    nowPlayingItem.episodeDescription = data.description
    nowPlayingItem.episodeId = data.id
    nowPlayingItem.episodeMediaUrl = data.mediaUrl
    nowPlayingItem.episodePubDate = data.pubDate
    nowPlayingItem.episodeTitle = data.title
    nowPlayingItem.podcastId = p.id
    nowPlayingItem.podcastImageUrl = p.imageUrl
    nowPlayingItem.podcastIsExplicit = p.isExplicit
    nowPlayingItem.podcastTitle = p.title
    nowPlayingItem.userPlaybackPosition = userPlaybackPosition || 0
    // Else assume it is a MediaRef
  } else {
    nowPlayingItem.clipEndTime = data.endTime
    nowPlayingItem.clipId = data.id
    nowPlayingItem.clipStartTime = data.startTime
    nowPlayingItem.clipTitle = data.title
    nowPlayingItem.episodeDescription = e.description
    nowPlayingItem.episodeId = e.id
    nowPlayingItem.episodeImageUrl = e.imageUrl
    nowPlayingItem.episodeMediaUrl = e.mediaUrl
    nowPlayingItem.episodePubDate = e.pubDate
    nowPlayingItem.episodeTitle = e.title
    nowPlayingItem.isPublic = data.isPublic
    nowPlayingItem.podcastId = p.id
    nowPlayingItem.podcastIsExplicit = p.isExplicit
    nowPlayingItem.podcastImageUrl = p.imageUrl
    nowPlayingItem.podcastTitle = p.title
    nowPlayingItem.userPlaybackPosition = userPlaybackPosition || data.clipStartTime || 0
  }

  return nowPlayingItem
}
