export default function HowTo() {
  return (
    <div className="page-hero howto-hero text-white">
      <div className="overlay py-5">
        <div className="container py-5">
          <h1 className="display-5">How to Identify Phishing</h1>
          <p className="lead">Practical tips to inspect URLs and emails before you click.</p>

          <div className="card mt-4 p-3">
            <h3>Quick checklist</h3>
            <ul>
              <li>Inspect sender email carefully</li>
              <li>Hover to preview link destinations</li>
              <li>Check for mismatched domains and typos</li>
              <li>Look for generic greetings and urgent requests</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
