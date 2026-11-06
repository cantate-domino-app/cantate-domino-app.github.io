import { Link } from 'react-router-dom'
import Icon from './Icon'

// Riga dell'archivio: tutta la riga apre il canto, il triangolo apre YouTube
export default function SongCard({ song }) {
    return (
        <article className="song-row">
            <Link to={`/song/${song.id}`} className="song-row-main">
                <span className="song-row-id">{song.id}</span>
                <span>
                    <span className="song-row-title">{song.title}</span>
                    {song.author && <span className="song-row-author">{song.author}</span>}
                    {!song.binder && <span className="song-row-binder">Non nel raccoglitore</span>}
                    {song.binder && song.binder !== song.id && (
                        <span className="song-row-binder">Raccoglitore: {song.binder}</span>
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
