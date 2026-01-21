import React from "react";
import "./PromptMarketplace.css";

function PromptCard({
  prompt,
  onSelect,
  isSelected,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="prompt-card skeleton" aria-hidden="true">
        <div className="skeleton-title" />
        <div className="skeleton-desc" />
        <div className="skeleton-tags" />
      </div>
    );
  }

  return (
    <div
      className={`prompt-card ${isSelected ? "selected" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onSelect(prompt)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(prompt)}
    >
      <div className="card-content">
        <h3 className="card-title">{prompt.title}</h3>
        <p className="card-description">{prompt.description}</p>

        <div className="card-tags">
          {prompt.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="card-actions">
        <button
          className="btn-use-prompt"
          aria-label="Use prompt template"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(prompt);
          }}
        >
          Use
        </button>

        <button
          className={`btn-select ${isSelected ? "selected" : ""}`}
          aria-label={isSelected ? "Selected" : "Add prompt"}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(prompt);
          }}
        >
          {isSelected ? "✓" : "+"}
        </button>
      </div>
    </div>
  );
}


export default PromptCard;
