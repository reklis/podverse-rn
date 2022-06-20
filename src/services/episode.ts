import { request } from './request'

export const getEpisodes = async (query: any = {}) => {
  const searchTitle = query.searchTitle ? encodeURIComponent(query.searchTitle) : ''
  const filteredQuery = {
    ...(query.page ? { page: query.page } : { page: 1 }),
    ...(query.sort ? { sort: query.sort } : {}),
    ...(query.podcastId ? { podcastId: query.podcastId } : {}),
    ...(searchTitle ? { searchTitle } : {}),
    ...(query.includePodcast ? { includePodcast: query.includePodcast } : {}),
    ...(query.sincePubDate ? { sincePubDate: query.sincePubDate } : {}),
    ...(query.hasVideo ? { hasVideo: query.hasVideo } : {})
  } as any

  if (query.categories && query.categories) {
    filteredQuery.categories = query.categories
  }

  if (query.subscribedOnly && query.podcastId && query.podcastId.length === 0) {
    return [[], 0]
  }

  const response = await request({
    endpoint: '/episode',
    query: filteredQuery
  })

  return response && response.data
}

export const getEpisode = async (id: string) => {
  const response = await request({
    endpoint: `/episode/${id}`
  })

  return response && response.data
}

export const retrieveLatestChaptersForEpisodeId = async (id: string) => {
  const response = await request({
    endpoint: `/episode/${id}/retrieve-latest-chapters`
  })

  return response && response.data
}

export const getEpisodesSincePubDate = async (sincePubDate: string, podcastIds: any[]) => {
  if (podcastIds && podcastIds.length > 0) {
    const response = await getEpisodes({
      podcastId: podcastIds,
      sincePubDate,
      includePodcast: true
    })

    return response[0]
  } else {
    return []
  }
}
