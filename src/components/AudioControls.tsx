import { GUITAR_NOTES, MY_NOTES } from "../utils/tuner";

interface AudioControlsProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNoteClick: (note: string, file: string) => void;
  handleLoadFromMic: () => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  onFileChange,
  onNoteClick,
  handleLoadFromMic,
}) => {
  return (
    <>
      <div className="mic-button-container">
        <button onClick={handleLoadFromMic}>Use Microphone</button>
      </div>

      <div className="note-buttons-container">
        <div className="note-buttons-header">
          <h2>CorrectNotes</h2>
        </div>
        <div className="note-buttons-body">
          {Object.entries(GUITAR_NOTES).map(([note, data]) => (
            <button
              key={note}
              onClick={() => onNoteClick(note, data.file)}
              className="note-button"
            >
              {note}
            </button>
          ))}
        </div>
      </div>

      <div className="note-buttons-container">
        <div className="note-buttons-header">
          <h2>My Notes</h2>
        </div>
        <div className="note-buttons-body">
          {Object.entries(MY_NOTES).map(([note, data]) => (
            <button
              key={note}
              onClick={() => onNoteClick(note, data)}
              className="note-button"
            >
              {note}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="file-input-container">
          <input
            type="file"
            accept="audio/*"
            onChange={onFileChange}
            className="audio-file-input"
          />
        </div>
      </div>

      <style>{`
        .file-input-container {
          margin: 20px 0;
        }

        .note-buttons-container {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background-color: #fff;
        }

        .note-buttons-header {
          margin-bottom: 15px;
          text-align: center;
        }

        .note-buttons-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }

        .note-buttons-body {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .note-button {
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .note-button:hover {
          background-color: #e0e0e0;
          transform: translateY(-2px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .audio-file-input {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 100%;
          max-width: 300px;
        }
        .mic-button-container {
          margin: 20px 0;
          display: flex;
          justify-content: center;
          align-items: center;
          

        }
      `}</style>
    </>
  );
};
