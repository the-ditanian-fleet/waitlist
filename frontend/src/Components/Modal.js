export function Modal({ children, open = false, onClose }) {
  return (
    <div className={"modal " + (open ? "is-active" : "")}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-content">{children}</div>
      <button onClick={onClose} className="modal-close is-large"></button>
    </div>
  );
}
