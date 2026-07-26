/*!
 * @name 巡回寺 QQ Music 128k/320k
 * @description 使用巡回寺 API 解析 QQ Music 的 128k、320k 播放地址与歌词
 * @version 1.0.0
 * @author kiseding
 */

const API_URL = 'https://api.xunhuisi.store/API/QQMusic/Song.php'
const QUALITY_MAP = {
  '128k': 'standard',
  '320k': 'high',
}

function requestJson(url) {
  return new Promise((resolve) => {
    lx.request(url, { method: 'GET' }, (error, response) => {
      if (error || !response || response.statusCode < 200 || response.statusCode >= 300) {
        resolve(null)
        return
      }

      try {
        const body = response.body
        resolve(typeof body === 'string' ? JSON.parse(body) : body)
      } catch (_) {
        resolve(null)
      }
    })
  })
}

lx.on(lx.EVENT_NAMES.request, async ({ action, source, info }) => {
  if (source !== 'tx') return null

  const musicInfo = (info && info.musicInfo) || {}
  const id = musicInfo.songmid || musicInfo.id || musicInfo.hash
  if (!id) return null

  const quality = QUALITY_MAP[info && info.type]
  if (action === 'musicUrl' && !quality) return null
  if (action !== 'musicUrl' && action !== 'lyric') return null

  const query = ['id=' + encodeURIComponent(id)]
  if (quality) query.push('quality=' + quality)

  const data = await requestJson(API_URL + '?' + query.join('&'))
  if (!data || Number(data.code) !== 200) return null

  if (action === 'musicUrl') {
    const url = typeof data.music_url === 'string' ? data.music_url.trim() : ''
    return /^https:\/\//.test(url) ? { url } : null
  }

  const lyric = typeof data.lyric === 'string' ? data.lyric : ''
  return lyric ? { lyric } : null
})

lx.send(lx.EVENT_NAMES.inited, {
  status: true,
  sources: {
    tx: {
      type: 'music',
      actions: ['musicUrl', 'lyric'],
      qualitys: ['128k', '320k'],
    },
  },
})
