export function Modal({ children, open = false, setOpen }) {
  return (
    <div className={"modal " + (open ? "is-active" : "")}>
      <div className="modal-background" onClick={(evt) => setOpen(false)}></div>
      <div className="modal-content">{children}</div>
      <button onClick={(evt) => setOpen(false)} className="modal-close is-large"></button>
    </div>
  );
}

export function Confirm({ children, open = false, setOpen, onConfirm, title = "Please confirm!" }) {
  return (
    <div className={"modal " + (open ? "is-active" : "")}>
      <div className="modal-background" onClick={(evt) => setOpen(false)}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">{title}</p>
          <button className="delete" onClick={(evt) => setOpen(false)}></button>
        </header>
        <section className="modal-card-body">{children}</section>
        <footer className="modal-card-foot">
          <div className="buttons is-right">
            <button className="button is-danger" onClick={(evt) => onConfirm()}>
              Yes
            </button>
            <button className="button is-info" onClick={(evt) => setOpen(false)}>
              No
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
