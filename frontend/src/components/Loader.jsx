export default function Loader({ text = "Loading..." }) {
  return (
    <div className="loader" role="status">
      <span />
      <p>{text}</p>
    </div>
  );
}