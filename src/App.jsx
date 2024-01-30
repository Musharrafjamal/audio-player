import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [playlist, setPlaylist] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [loading, setLoading] = useState(true); // State for tracking loading status

  useEffect(() => {
    // Open (or create) a database
    const request = window.indexedDB.open("playlistDatabase", 1);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;

      // Create an object store
      const objectStore = db.createObjectStore("playlist", {
        keyPath: "id",
        autoIncrement: true,
      });

      // Define the schema of the object store
      objectStore.createIndex("name", "name", { unique: false });
      objectStore.createIndex("url", "url", { unique: false });
    };

    request.onsuccess = function (event) {
      const db = event.target.result;

      // Fetch playlist from the database
      const transaction = db.transaction(["playlist"], "readonly");
      const objectStore = transaction.objectStore("playlist");
      const getRequest = objectStore.getAll();

      getRequest.onsuccess = function (event) {
        setPlaylist(event.target.result);
        setLoading(false); // Set loading to false once playlist is loaded
      };

      db.close();
    };

    request.onerror = function (event) {
      console.log("Database error: " + event.target.errorCode);
    };
  }, []);

  const handleFileChange = (event) => {
    const files = event.target.files;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = (e) => {
        const newSong = {
          name: file.name,
          url: e.target.result,
        };

        setPlaylist((prevPlaylist) => [...prevPlaylist, newSong]);

        // Add the new song to the IndexedDB
        const request = window.indexedDB.open("playlistDatabase", 1);

        request.onsuccess = function (event) {
          const db = event.target.result;

          const transaction = db.transaction(["playlist"], "readwrite");
          const objectStore = transaction.objectStore("playlist");

          objectStore.add(newSong);

          db.close();
        };
      };

      reader.readAsDataURL(file);
    }
  };

  const handleChangeSong = (event) => {
    setCurrentSongIndex(event.target.selectedIndex);
  };
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  useEffect(() => {
    if (currentTime !== 0) {
      localStorage.setItem("currentTime", currentTime.toFixed(2));
    }
  }, [currentTime]);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = parseInt(
        localStorage.getItem("currentTime")
      );
      audioRef.current.play();
    }
    setCurrentSongIndex(parseInt(localStorage.getItem("currentSongIndex")));
  }, [playlist]);
  useEffect(() => {
    if (currentSongIndex !== 0) {
      localStorage.setItem("currentSongIndex", currentSongIndex);
    }
  }, [currentSongIndex]);

  return (
    <div className="container">
      <h1 className="title">Audio Player</h1>
      {loading ? ( // Render loading screen if loading is true
        <div className="loading-screen">
          <span>Loading...</span>
          <div class="newtons-cradle">
            <div class="newtons-cradle__dot"></div>
            <div class="newtons-cradle__dot"></div>
            <div class="newtons-cradle__dot"></div>
            <div class="newtons-cradle__dot"></div>
          </div>
        </div>
      ) : (
        <>
          <input
            className="file-input"
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileChange}
          />

          {playlist.length > 0 && (
            <div className="playlist-container">
              <h2 className="playlist-title">Playlist</h2>
              <select className="playlist-select" onChange={handleChangeSong}>
                {playlist.map((song, index) => (
                  <option
                    key={index}
                    value={song.name}
                    className="playlist-option"
                  >
                    {song.name}
                  </option>
                ))}
              </select>
              <h3 className="now-playing">
                Now Playing: {playlist[currentSongIndex].name}
              </h3>
              <audio
                ref={audioRef}
                controls
                onTimeUpdate={handleTimeUpdate}
                src={playlist[currentSongIndex].url}
                className="audio-player"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
