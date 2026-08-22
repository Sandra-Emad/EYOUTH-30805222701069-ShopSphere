export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <h2>Something went wrong</h2>

      <p>{message}</p>

      {onRetry && (
        <button
          type="button"
          className="btn btn-outline"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  );
}