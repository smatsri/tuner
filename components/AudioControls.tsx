import { GUITAR_NOTES } from "@/utils/tuner";

interface AudioControlsProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNoteClick: (note: string, file: string) => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  onFileChange,
  onNoteClick,
}) => {
  return (
    <>
      <div className="file-input-container">
        <input
          type="file"
          accept="audio/*"
          onChange={onFileChange}
          className="audio-file-input"
        />
      </div>

      <div className="note-buttons">
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

      <style jsx>{`
        .file-input-container {
          margin: 20px 0;
        }

        .note-buttons {
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
          transition: background-color 0.2s;
        }

        .note-button:hover {
          background-color: #e0e0e0;
        }

        .audio-file-input {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
      `}</style>
    </>
  );
};
