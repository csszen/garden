
import {useState} from 'react'
import {InferGetStaticPropsType} from 'next'
import {Head, Fabric, Preview} from 'src/components'
import {safeWaitPromise, createSnapshot, getThemesByCursor} from 'src/helpers'
import {THEME_REVALIDATION_INTERVAL, FETCH_GISTS_CACHE_LIFETIME} from 'src/config'
import {defaultThemes} from 'src/helpers/values'
import styles from './index.module.scss'

export default function All ({themeChoices}: InferGetStaticPropsType<typeof getStaticProps>) {
    const [loading, setLoading] = useState(false)
    const [themeInfo, setThemes] = useState(themeChoices)

    const fetchThemes = async (api: string) => {
        if (loading) return
        setLoading(true)
        try {
            const r = await fetch(api, {
                headers: {
                    'Cache-Control': `s-maxage=${FETCH_GISTS_CACHE_LIFETIME}, stale-while-revalidate`,
                },
            })
            const r2 = await r.json()
            setThemes(r2)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleNextThemes = async () => {
        const {pageInfo} = themeInfo

        fetchThemes(`/api/themes?after=${pageInfo.endCursor}`)
    }

    const handlePreviousThemes = async () => {
        const {pageInfo} = themeInfo

        fetchThemes(`/api/themes?before=${pageInfo.startCursor}`)
    }

    return (
        <Fabric className={styles.contianer}>
            <Head title="All Designs | CSS Zen Garden" />
            <h1 className={styles.h1}>
                All Designs
            </h1>
            <Fabric clearfix className={styles['all-mian']}>
                {themeInfo.themes.map(
                    theme => <Preview className={styles['preview-item']} manifest={theme.manifest} gistsid={theme.id} key={theme.id} />
                )}
            </Fabric>
            {themeInfo.pageInfo.hasPreviousPage? <a onClick={handlePreviousThemes} className={styles.right} /> : ''}
            {themeInfo.pageInfo.hasNextPage ? <a onClick={handleNextThemes} className={styles.left} /> : ''}
        </Fabric>
    )
}
export async function getStaticProps () {
    const themeChoices = await safeWaitPromise(getThemesByCursor({take: 6}), defaultThemes)
    const {themes} = themeChoices
    themes.forEach(theme => {
        createSnapshot({gistid: theme.id})
    })
    return {
        props: {
            themeChoices,
        },
        revalidate: THEME_REVALIDATION_INTERVAL, // incremental static regeneration everytime
    }
}
