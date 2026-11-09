import { Link } from 'react-router-dom'
import Icon from './Icon'
import { useRaccoglitore } from '../context/ParrocchiaContext'

// Riga dell'archivio: tutta la riga apre il canto, il triangolo apre YouTube
export default function SongCard({ song }) {
    const raccoglitore = useRaccoglitore()
    const riferimento = raccoglitore.riferimento(song.id)
    return (
        <article className="song-row">
            <Link to={`/song/${song.id}`} className={`song-row-main ${raccoglitore.conCanti ? '' : 'senza-riferimenti'}`}>
                {raccoglitore.conCanti && <span className="song-row-id">{riferimento}</span>}
                <span>
                    <span className="song-row-title">{song.title}</span>
                    {song.author && <span className="song-row-author">{song.author}</span>}
                    {raccoglitore.modificabile && raccoglitore.conCanti && !riferimento && (
                        <span className="song-row-binder">Non nel raccoglitore</span>
                    )}
                </span>
            </Link>
            {song.youtube && (
                <a
                    href={song.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="song-row-play"
                    aria-label={`Ascolta ${song.title} su YouTube`}
                >
                    <Icon name="play" size={20} />
                </a>
            )}
        </article>
    )
}
